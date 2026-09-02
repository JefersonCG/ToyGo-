export interface ToygoMysqlConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export function readDesktopMysqlConfig(env: NodeJS.ProcessEnv = process.env): ToygoMysqlConfig {
  return {
    host: env.TOYGO_DESKTOP_MARIADB_HOST ?? env.TOYGO_DESKTOP_MYSQL_HOST ?? "127.0.0.1",
    port: Number(env.TOYGO_DESKTOP_MARIADB_PORT ?? env.TOYGO_DESKTOP_MYSQL_PORT ?? 3306),
    database: env.TOYGO_DESKTOP_MARIADB_DATABASE ?? env.TOYGO_DESKTOP_MYSQL_DATABASE ?? "toygo_desktop",
    user: env.TOYGO_DESKTOP_MARIADB_USER ?? env.TOYGO_DESKTOP_MYSQL_USER ?? "toygo_app",
    password: env.TOYGO_DESKTOP_MARIADB_PASSWORD ?? env.TOYGO_DESKTOP_MYSQL_PASSWORD ?? "change-me"
  };
}
