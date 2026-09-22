import { access, readFile } from "node:fs/promises";
import type { ToygoMysqlConfig } from "@toygo/database";

export interface InstallerCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface InstallerCommandRunner {
  run(
    command: string,
    args: string[],
    options?: { env?: NodeJS.ProcessEnv; stdin?: string },
  ): Promise<InstallerCommandResult>;
  start?(
    command: string,
    args: string[],
    options?: { env?: NodeJS.ProcessEnv },
  ): Promise<void>;
}

export interface MariaDbProvisionerOptions {
  config: ToygoMysqlConfig;
  rootPassword: string;
  schemaPath: string;
  mysqlPath: string;
  mysqlAdminPath: string;
  installDbPath?: string;
  serverPath?: string;
  dataDir?: string;
  configTemplatePath?: string;
  serviceName: string;
  commandRunner: InstallerCommandRunner;
  platform?: NodeJS.Platform;
  sleep?: (milliseconds: number) => Promise<void>;
}

export interface MariaDbProvisioningResult {
  startedService: boolean;
  databaseReady: boolean;
  message: string;
}

const defaultSleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Identificador MariaDB invalido: ${value}`);
  }
  return `\`${value}\``;
}

function quoteSqlString(value: string): string {
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function quoteSqlAccount(user: string, host: string): string {
  return `${quoteSqlString(user)}@${quoteSqlString(host)}`;
}

function mysqlArgs(config: ToygoMysqlConfig, user: string, database?: string): string[] {
  return [
    `--host=${config.host}`,
    `--port=${config.port}`,
    `--user=${user}`,
    ...(database ? [database] : []),
  ];
}

/**
 * Provisions the local MariaDB expected by the packaged Desktop.
 *
 * It deliberately receives a command runner so the real Windows process
 * boundary is covered by integration code while the destructive/system
 * operations remain deterministic in unit tests.
 */
export class MariaDbProvisioner {
  readonly #options: MariaDbProvisionerOptions;
  readonly #sleep: (milliseconds: number) => Promise<void>;
  #freshDatabase = false;

  constructor(options: MariaDbProvisionerOptions) {
    this.#options = options;
    this.#sleep = options.sleep ?? defaultSleep;
  }

  async ensureReady(): Promise<MariaDbProvisioningResult> {
    this.assertWindows();

    if (await this.ping()) {
      return { startedService: false, databaseReady: true, message: "MariaDB local conectado" };
    }

    if (this.#options.serverPath && !this.#options.dataDir) {
      throw new Error("TOYGO_MARIADB_DATA_DIR e obrigatorio para iniciar o MariaDB local.");
    }

    if (this.#options.installDbPath && this.#options.dataDir && !(await this.pathExists(`${this.#options.dataDir}\\mysql`))) {
      const initializeArgs = [
        `--datadir=${this.#options.dataDir}`,
        "--password=",
        `--port=${this.#options.config.port}`,
        "--silent",
        ...(!this.#options.serverPath ? [`--service=${this.#options.serviceName}`] : []),
        ...(this.#options.configTemplatePath ? [`--config=${this.#options.configTemplatePath}`] : []),
      ];
      const initialized = await this.#options.commandRunner.run(this.#options.installDbPath, initializeArgs);
      if (initialized.exitCode !== 0) {
        throw new Error(`Nao foi possivel inicializar o MariaDB local: ${initialized.stderr || initialized.stdout}`);
      }
      this.#freshDatabase = true;
    }

    if (this.#options.serverPath) {
      if (!this.#options.commandRunner.start) {
        throw new Error("O command runner nao suporta iniciar o MariaDB local.");
      }
      await this.#options.commandRunner.start(
        this.#options.serverPath,
        [
          ...(this.#options.configTemplatePath ? [`--defaults-file=${this.#options.configTemplatePath}`] : []),
          `--datadir=${this.#options.dataDir}`,
          `--port=${this.#options.config.port}`,
          `--bind-address=${this.#options.config.host}`,
        ],
        { env: process.env },
      );
    } else {
      const start = await this.#options.commandRunner.run("sc.exe", ["start", this.#options.serviceName]);
      if (start.exitCode !== 0 && !/already been started|ja foi iniciado/i.test(start.stdout + start.stderr)) {
        throw new Error(`Nao foi possivel iniciar o servico ${this.#options.serviceName}: ${start.stderr || start.stdout}`);
      }
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      if ((await this.ping()) || (this.#freshDatabase && await this.pingRootWithoutPassword())) {
        return {
          startedService: !this.#options.serverPath,
          databaseReady: true,
          message: this.#options.serverPath ? "MariaDB local iniciado como processo" : "MariaDB local iniciado e conectado",
        };
      }
      await this.#sleep(500);
    }

    throw new Error("MariaDB local nao respondeu ao health check apos iniciar o servico.");
  }

  async bootstrap(): Promise<MariaDbProvisioningResult> {
    const readiness = await this.ensureReady();
    const schema = await readFile(this.#options.schemaPath, "utf8");
    const database = quoteIdentifier(this.#options.config.database);
    const appAccounts = [
      quoteSqlAccount(this.#options.config.user, "localhost"),
      quoteSqlAccount(this.#options.config.user, "127.0.0.1"),
    ];
    const appPassword = quoteSqlString(this.#options.config.password);
    const bootstrapSql = [
      `CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
      ...appAccounts.map((account) => `CREATE USER IF NOT EXISTS ${account} IDENTIFIED BY ${appPassword};`),
      ...appAccounts.map((account) => `GRANT ALL PRIVILEGES ON ${database}.* TO ${account};`),
      "FLUSH PRIVILEGES;",
    ].join("\n");

    if (this.#freshDatabase) {
      await this.runMysql(
        mysqlArgs(this.#options.config, "root"),
        `ALTER USER 'root'@'localhost' IDENTIFIED BY ${quoteSqlString(this.#options.rootPassword)};`,
        "",
      );
    }
    await this.runMysql(mysqlArgs(this.#options.config, "root"), bootstrapSql, this.#options.rootPassword);
    await this.runMysql(
      mysqlArgs(this.#options.config, this.#options.config.user, this.#options.config.database),
      schema,
      this.#options.config.password,
    );

    return { ...readiness, databaseReady: true, message: "MariaDB local provisionado e schema aplicado" };
  }

  private async ping(): Promise<boolean> {
    return this.pingWith(this.#options.config.user, this.#options.config.password);
  }

  private async pingRootWithoutPassword(): Promise<boolean> {
    return this.pingWith("root", "");
  }

  private async pingWith(user: string, password: string): Promise<boolean> {
    const result = await this.#options.commandRunner.run(this.#options.mysqlAdminPath, [
      `--host=${this.#options.config.host}`,
      `--port=${this.#options.config.port}`,
      `--user=${user}`,
      "ping",
    ], { env: { ...process.env, MYSQL_PWD: password } });
    return result.exitCode === 0;
  }

  private async pathExists(target: string): Promise<boolean> {
    try {
      await access(target);
      return true;
    } catch {
      return false;
    }
  }

  private async runMysql(args: string[], stdin: string, password: string): Promise<void> {
    const result = await this.#options.commandRunner.run(this.#options.mysqlPath, args, {
      env: { ...process.env, MYSQL_PWD: password },
      stdin,
    });
    if (result.exitCode !== 0) {
      throw new Error(`MariaDB rejeitou o bootstrap: ${result.stderr || result.stdout}`);
    }
  }

  private assertWindows(): void {
    if ((this.#options.platform ?? process.platform) !== "win32") {
      throw new Error("O provisionamento do MariaDB embarcado do ToyGo! exige Windows.");
    }
  }
}
