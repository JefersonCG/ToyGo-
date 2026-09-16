import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MysqlDumpBackupService } from "./mysql-backup-service";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "test", "fixtures");
const fakeMysqldump = [process.execPath, path.join(fixturesDir, "fake-mysqldump.mjs")];
const fakeMysql = [process.execPath, path.join(fixturesDir, "fake-mysql.mjs")];

describe("MysqlDumpBackupService", () => {
  let workDir: string;

  beforeEach(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "toygo-backup-test-"));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it("dumps, compresses and checksums a real backup file via a real child process", async () => {
    const backupsDir = path.join(workDir, "backups");
    const service = new MysqlDumpBackupService({
      config: { host: "127.0.0.1", port: 3306, database: "toygo_desktop", user: "toygo_app", password: "secret" },
      backupsDir,
      mysqldumpCommand: fakeMysqldump,
      mysqlCommand: fakeMysql,
    });

    const manifest = await service.createBackup({ reason: "manual", requestedByUserId: "user-1" });

    expect(manifest.databaseName).toBe("toygo_desktop");
    const compressed = await readFile(manifest.filePath);
    expect(createHash("sha256").update(compressed).digest("hex")).toBe(manifest.checksumSha256);
    const decompressed = gunzipSync(compressed).toString("utf8");
    expect(decompressed).toContain("CREATE TABLE demo");

    const listed = await service.listBackups();
    expect(listed).toHaveLength(1);
    expect(listed[0]).toEqual(manifest);
  });

  it("restores a backup by piping the decompressed dump into the mysql client's stdin", async () => {
    const backupsDir = path.join(workDir, "backups");
    const captureFile = path.join(workDir, "captured.sql");
    const service = new MysqlDumpBackupService({
      config: { host: "127.0.0.1", port: 3306, database: "toygo_desktop", user: "toygo_app", password: "secret" },
      backupsDir,
      mysqldumpCommand: fakeMysqldump,
      mysqlCommand: fakeMysql,
    });
    const manifest = await service.createBackup({ reason: "before_update", requestedByUserId: "user-1" });

    process.env.FAKE_MYSQL_CAPTURE_FILE = captureFile;
    try {
      await service.restoreBackup({ backupId: manifest.id, requestedByUserId: "user-1" });
    } finally {
      delete process.env.FAKE_MYSQL_CAPTURE_FILE;
    }

    const captured = await readFile(captureFile, "utf8");
    expect(captured).toContain("CREATE TABLE demo");
  });

  it("rejects restoring a backup whose file was tampered with after creation", async () => {
    const backupsDir = path.join(workDir, "backups");
    const service = new MysqlDumpBackupService({
      config: { host: "127.0.0.1", port: 3306, database: "toygo_desktop", user: "toygo_app", password: "secret" },
      backupsDir,
      mysqldumpCommand: fakeMysqldump,
      mysqlCommand: fakeMysql,
    });
    const manifest = await service.createBackup({ reason: "manual", requestedByUserId: "user-1" });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(manifest.filePath, Buffer.from("corrupted"));

    await expect(
      service.restoreBackup({ backupId: manifest.id, requestedByUserId: "user-1" }),
    ).rejects.toThrow("corrompido");
  });
});
