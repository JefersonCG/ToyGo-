param(
  [Parameter(Mandatory = $true)]
  [string]$RootPassword,
  [string]$Database = "toygo_desktop",
  [string]$AppUser = "toygo_app",
  [string]$AppPassword = "change-me",
  [string]$SchemaPath = "infra/mysql/desktop/schema.sql"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
  throw "MySQL 8.0+ nao encontrado no PATH. Instale o MySQL local antes de executar este script."
}

Write-Host "Criando banco local $Database e usuario $AppUser..."

$bootstrapSql = @"
CREATE DATABASE IF NOT EXISTS $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS '$AppUser'@'localhost' IDENTIFIED BY '$AppPassword';
GRANT ALL PRIVILEGES ON $Database.* TO '$AppUser'@'localhost';
FLUSH PRIVILEGES;
"@

$bootstrapSql | mysql -uroot -p$RootPassword
Get-Content -Raw $SchemaPath | mysql -uroot -p$RootPassword $Database

Write-Host "MySQL local do ToyGo! preparado com sucesso."
