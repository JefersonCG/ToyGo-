import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MariaDbProvisioner, type InstallerCommandResult, type InstallerCommandRunner } from "./mariadb-provisioner";

class FakeRunner implements InstallerCommandRunner {
  readonly calls: Array<{ command: string; args: string[]; stdin?: string }> = [];
  pingResults = [1, 0];

  async run(command: string, args: string[], options?: { env?: NodeJS.ProcessEnv; stdin?: string }): Promise<InstallerCommandResult> {
    this.calls.push({ command, args, stdin: options?.stdin });
    if (command === "mariadb-admin.exe") {
      return { exitCode: this.pingResults.shift() ?? 0, stdout: "", stderr: "" };
    }
    return { exitCode: 0, stdout: "", stderr: "" };
  }
}

describe("MariaDbProvisioner", () => {
  it("starts the Windows service after a failed health check and retries until ready", async () => {
    const runner = new FakeRunner();
    const provisioner = new MariaDbProvisioner({
      config: { host: "127.0.0.1", port: 3306, database: "toygo_desktop", user: "toygo_app", password: "secret" },
      rootPassword: "root-secret",
      schemaPath: "schema.sql",
      mysqlPath: "mysql.exe",
      mysqlAdminPath: "mariadb-admin.exe",
      serviceName: "ToyGoMariaDB",
      commandRunner: runner,
      platform: "win32",
      sleep: async () => undefined,
    });

    const result = await provisioner.ensureReady();

    expect(result).toEqual({ startedService: true, databaseReady: true, message: "MariaDB local iniciado e conectado" });
    expect(runner.calls.map((call) => [call.command, call.args])).toEqual([
      ["mariadb-admin.exe", ["--host=127.0.0.1", "--port=3306", "--user=toygo_app", "ping"]],
      ["sc.exe", ["start", "ToyGoMariaDB"]],
      ["mariadb-admin.exe", ["--host=127.0.0.1", "--port=3306", "--user=toygo_app", "ping"]],
    ]);
  });

  it("bootstraps the database with stdin and never puts passwords in arguments", async () => {
    const runner = new FakeRunner();
    runner.pingResults = [0];
    const provisioner = new MariaDbProvisioner({
      config: { host: "127.0.0.1", port: 3306, database: "toygo_desktop", user: "toygo_app", password: "app-secret" },
      rootPassword: "root-secret",
      schemaPath: "schema.sql",
      mysqlPath: "mysql.exe",
      mysqlAdminPath: "mariadb-admin.exe",
      serviceName: "ToyGoMariaDB",
      commandRunner: runner,
      platform: "win32",
    });

    const workDir = await mkdtemp(path.join(tmpdir(), "toygo-installer-test-"));
    const schemaPath = path.join(workDir, "schema.sql");
    await writeFile(schemaPath, "CREATE TABLE installer_probe (id INT PRIMARY KEY);", "utf8");
    try {
      await new MariaDbProvisioner({
        config: { host: "127.0.0.1", port: 3306, database: "toygo_desktop", user: "toygo_app", password: "app-secret" },
        rootPassword: "root-secret",
        schemaPath,
        mysqlPath: "mysql.exe",
        mysqlAdminPath: "mariadb-admin.exe",
        serviceName: "ToyGoMariaDB",
        commandRunner: runner,
        platform: "win32",
      }).bootstrap();
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }

    const mysqlCalls = runner.calls.filter((call) => call.command === "mysql.exe");
    expect(mysqlCalls).toHaveLength(2);
    expect(mysqlCalls.flatMap((call) => call.args.join(" "))).not.toContain("root-secret");
    expect(mysqlCalls.flatMap((call) => call.args.join(" "))).not.toContain("app-secret");
    expect(mysqlCalls[0].stdin).toContain("CREATE DATABASE IF NOT EXISTS");
    expect(mysqlCalls[1].stdin).toContain("CREATE TABLE installer_probe");
  });

  it("does not run Windows service commands on another platform", async () => {
    const runner = new FakeRunner();
    const provisioner = new MariaDbProvisioner({
      config: { host: "127.0.0.1", port: 3306, database: "toygo_desktop", user: "toygo_app", password: "secret" },
      rootPassword: "root-secret",
      schemaPath: "schema.sql",
      mysqlPath: "mysql.exe",
      mysqlAdminPath: "mariadb-admin.exe",
      serviceName: "ToyGoMariaDB",
      commandRunner: runner,
      platform: "linux",
    });

    await expect(provisioner.ensureReady()).rejects.toThrow("exige Windows");
    expect(runner.calls).toHaveLength(0);
  });
});
