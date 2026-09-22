#!/usr/bin/env node
import path from "node:path";
import { readDesktopMysqlConfig } from "@toygo/database";
import { MariaDbProvisioner } from "./mariadb-provisioner";
import { NodeInstallerCommandRunner } from "./node-command-runner";

async function main(): Promise<void> {
  if (process.argv[2] !== "provision") {
    throw new Error("Uso: toygo-installer provision");
  }
  const binDir = process.env.TOYGO_MARIADB_BIN_DIR;
  const rootPassword = process.env.TOYGO_MARIADB_ROOT_PASSWORD;
  if (!binDir || !rootPassword) {
    throw new Error("TOYGO_MARIADB_BIN_DIR e TOYGO_MARIADB_ROOT_PASSWORD sao obrigatorios para provisionar o MariaDB.");
  }
  const config = readDesktopMysqlConfig();
  if (config.password === "change-me") {
    throw new Error("Defina TOYGO_DESKTOP_MARIADB_PASSWORD antes de provisionar o banco.");
  }
  const schemaPath = process.env.TOYGO_MARIADB_SCHEMA_PATH ?? path.resolve("infra/mysql/desktop/schema.sql");
  const dataDir = process.env.TOYGO_MARIADB_DATA_DIR ?? path.resolve("mysql-data");
  const configTemplatePath = process.env.TOYGO_MARIADB_CONFIG_PATH ?? path.resolve("infra/mysql/desktop/my.ini");
  const result = await new MariaDbProvisioner({
    config,
    rootPassword,
    schemaPath,
    mysqlPath: path.join(binDir, "mariadb.exe"),
    mysqlAdminPath: path.join(binDir, "mariadb-admin.exe"),
    installDbPath: path.join(binDir, "mariadb-install-db.exe"),
    dataDir,
    configTemplatePath,
    serviceName: process.env.TOYGO_MARIADB_SERVICE_NAME ?? "ToyGoMariaDB",
    commandRunner: new NodeInstallerCommandRunner(),
  }).bootstrap();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
