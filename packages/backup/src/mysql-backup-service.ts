import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import type { ToygoMysqlConfig } from "@toygo/database";
import type { BackupManifest, BackupService } from "./backup-service";

const execFileAsync = promisify(execFile);
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

function toCommand(configured: string[] | undefined, fallback: string): [string, ...string[]] {
  if (configured && configured.length > 0) return configured as [string, ...string[]];
  return [fallback];
}

function runWithStdin(
  command: string,
  args: string[],
  options: { env: NodeJS.ProcessEnv; stdin: Buffer },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: options.env, stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} terminou com codigo ${code}: ${stderr}`));
    });
    child.stdin.end(options.stdin);
  });
}

export interface MysqlDumpBackupServiceOptions {
  config: ToygoMysqlConfig;
  backupsDir: string;
  /** Comando do cliente mysqldump/mysql: primeiro item e o executavel,
   * itens seguintes sao argumentos fixos prependidos (raramente
   * necessario -- serve para apontar para um interpretador, ex. em teste).
   * Por padrao, assume que o binario esta no PATH -- verdadeiro na maioria
   * das instalacoes de MariaDB/MySQL Server no Windows/Linux, que
   * adicionam o diretorio bin ao PATH do sistema durante a instalacao. */
  mysqldumpCommand?: string[];
  mysqlCommand?: string[];
}

/**
 * Implementacao real de BackupService via mysqldump/mysql (dump lógico
 * completo do banco local do Desktop, comprimido com gzip). Restore
 * sobrescreve os dados existentes do banco de destino -- e uma operacao
 * destrutiva por natureza, nunca deve rodar sem confirmacao explicita do
 * operador no chamador.
 */
export class MysqlDumpBackupService implements BackupService {
  readonly #config: ToygoMysqlConfig;
  readonly #backupsDir: string;
  readonly #mysqldumpCommand: [string, ...string[]];
  readonly #mysqlCommand: [string, ...string[]];

  constructor(options: MysqlDumpBackupServiceOptions) {
    this.#config = options.config;
    this.#backupsDir = options.backupsDir;
    this.#mysqldumpCommand = toCommand(options.mysqldumpCommand, "mysqldump");
    this.#mysqlCommand = toCommand(options.mysqlCommand, "mysql");
  }

  async createBackup(input: {
    reason: "manual" | "scheduled" | "before_update";
    requestedByUserId: string;
  }): Promise<BackupManifest> {
    await mkdir(this.#backupsDir, { recursive: true });
    const createdAt = new Date().toISOString();
    const id = `toygo-backup-${createdAt.replace(/[:.]/g, "-")}-${input.reason}`;
    const filePath = path.join(this.#backupsDir, `${id}.sql.gz`);

    const [mysqldumpBin, ...mysqldumpPrefixArgs] = this.#mysqldumpCommand;
    const { stdout } = await execFileAsync(
      mysqldumpBin,
      [
        ...mysqldumpPrefixArgs,
        `--host=${this.#config.host}`,
        `--port=${this.#config.port}`,
        `--user=${this.#config.user}`,
        "--single-transaction",
        "--routines",
        "--triggers",
        this.#config.database,
      ],
      {
        env: { ...process.env, MYSQL_PWD: this.#config.password },
        maxBuffer: 1024 * 1024 * 1024,
        encoding: "utf8",
      },
    );

    const compressed = await gzipAsync(Buffer.from(stdout, "utf8"));
    await writeFile(filePath, compressed);
    const checksumSha256 = createHash("sha256").update(compressed).digest("hex");
    const manifest: BackupManifest = {
      id,
      databaseName: this.#config.database,
      createdAt,
      filePath,
      checksumSha256,
      sizeBytes: compressed.byteLength,
    };
    await writeFile(this.#manifestPath(id), JSON.stringify(manifest, null, 2), "utf8");
    return manifest;
  }

  async listBackups(): Promise<BackupManifest[]> {
    let entries: string[];
    try {
      entries = await readdir(this.#backupsDir);
    } catch {
      return [];
    }
    const manifests: BackupManifest[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".manifest.json")) continue;
      try {
        const raw = await readFile(path.join(this.#backupsDir, entry), "utf8");
        manifests.push(JSON.parse(raw) as BackupManifest);
      } catch {
        // Manifesto corrompido ou parcialmente escrito -- ignora, nao quebra a listagem.
      }
    }
    return manifests.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  /**
   * Restaura o backup indicado, SOBRESCREVENDO o banco de destino com o
   * conteudo do dump. O chamador e responsavel por obter confirmacao
   * explicita do operador antes de invocar isto -- nao ha como desfazer.
   */
  async restoreBackup(input: { backupId: string; requestedByUserId: string }): Promise<void> {
    const manifests = await this.listBackups();
    const manifest = manifests.find((item) => item.id === input.backupId);
    if (!manifest) {
      throw new Error(`Backup ${input.backupId} nao encontrado em ${this.#backupsDir}.`);
    }
    const compressed = await readFile(manifest.filePath);
    if (manifest.checksumSha256) {
      const actual = createHash("sha256").update(compressed).digest("hex");
      if (actual !== manifest.checksumSha256) {
        throw new Error(`Backup ${input.backupId} esta corrompido (checksum nao confere).`);
      }
    }
    const dumpSql = await gunzipAsync(compressed);
    const [mysqlBin, ...mysqlPrefixArgs] = this.#mysqlCommand;
    await runWithStdin(
      mysqlBin,
      [
        ...mysqlPrefixArgs,
        `--host=${this.#config.host}`,
        `--port=${this.#config.port}`,
        `--user=${this.#config.user}`,
        this.#config.database,
      ],
      {
        env: { ...process.env, MYSQL_PWD: this.#config.password },
        stdin: dumpSql,
      },
    );
  }

  async deleteBackup(backupId: string): Promise<void> {
    const manifests = await this.listBackups();
    const manifest = manifests.find((item) => item.id === backupId);
    if (!manifest) return;
    await unlink(manifest.filePath).catch(() => {});
    await unlink(this.#manifestPath(backupId)).catch(() => {});
  }

  #manifestPath(id: string): string {
    return path.join(this.#backupsDir, `${id}.manifest.json`);
  }
}
