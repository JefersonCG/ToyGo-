import { createPool, type Pool } from "mysql2/promise";
import type { ToygoMysqlConfig } from "./mysql-config";

export function createToygoMysqlPool(config: ToygoMysqlConfig): Pool {
  return createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    decimalNumbers: true
  });
}

export async function checkMysqlConnection(config: ToygoMysqlConfig): Promise<{ ok: boolean; message: string }> {
  const pool = createToygoMysqlPool(config);
  try {
    await pool.query("SELECT 1 AS ok");
    return { ok: true, message: "MariaDB local conectado" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida ao conectar no MariaDB local";
    return { ok: false, message };
  } finally {
    await pool.end();
  }
}
