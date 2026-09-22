#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string]$DesktopExe,
    [Parameter(Mandatory = $true)] [string]$RootPassword,
    [Parameter(Mandatory = $true)] [string]$AppPassword,
    [string]$DataDir = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $DesktopExe -PathType Leaf)) { throw "ToyGo executable nao encontrado: $DesktopExe" }

$old = @{
    root = $env:TOYGO_MARIADB_ROOT_PASSWORD
    app = $env:TOYGO_DESKTOP_MARIADB_PASSWORD
    data = $env:TOYGO_MARIADB_DATA_DIR
}
try {
    $env:TOYGO_MARIADB_ROOT_PASSWORD = $RootPassword
    $env:TOYGO_DESKTOP_MARIADB_PASSWORD = $AppPassword
    if ($DataDir) { $env:TOYGO_MARIADB_DATA_DIR = $DataDir }
    $process = Start-Process -FilePath $DesktopExe -ArgumentList "--toygo-provision" -Wait -PassThru -WindowStyle Hidden
    if ($process.ExitCode -ne 0) { throw "Bootstrap MariaDB terminou com codigo $($process.ExitCode)." }
} finally {
    $env:TOYGO_MARIADB_ROOT_PASSWORD = $old.root
    $env:TOYGO_DESKTOP_MARIADB_PASSWORD = $old.app
    $env:TOYGO_MARIADB_DATA_DIR = $old.data
}
