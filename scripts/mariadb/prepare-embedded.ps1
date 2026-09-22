[CmdletBinding()]
param(
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$artifactRoot = Join-Path $repoRoot "infra\mariadb-embedded\11.8"
$manifest = Get-Content (Join-Path $artifactRoot "artifact.json") -Raw | ConvertFrom-Json
$vendor = Join-Path $artifactRoot "vendor"
$archive = Join-Path $artifactRoot $manifest.archive
$required = @("bin\mariadbd.exe", "bin\mariadb-install-db.exe", "bin\mariadb-admin.exe", "bin\mariadb.exe")

function Test-Payload {
    foreach ($relative in $required) {
        if (-not (Test-Path -LiteralPath (Join-Path $vendor $relative) -PathType Leaf)) { return $false }
    }
    return $true
}

if ((-not $Force) -and (Test-Payload)) {
    Write-Host "MariaDB $($manifest.version) ja preparado em $vendor"
    exit 0
}

if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
    Write-Host "Baixando $($manifest.downloadUrl)"
    Invoke-WebRequest -Uri $manifest.downloadUrl -OutFile $archive -UseBasicParsing
}
$actualHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualHash -ne $manifest.sha256.ToLowerInvariant()) {
    throw "Checksum MariaDB invalido. Esperado=$($manifest.sha256); obtido=$actualHash"
}

$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("toygo-mariadb-" + [guid]::NewGuid().ToString("N"))
try {
    Expand-Archive -LiteralPath $archive -DestinationPath $temp -Force
    $payloadRoot = Get-ChildItem -LiteralPath $temp -Directory | Select-Object -First 1
    if (-not $payloadRoot) { throw "Arquivo MariaDB nao possui uma pasta raiz reconhecivel." }
    if (Test-Path -LiteralPath $vendor) { Remove-Item -LiteralPath $vendor -Recurse -Force }
    New-Item -ItemType Directory -Path $vendor -Force | Out-Null
    Get-ChildItem -LiteralPath $payloadRoot.FullName -Force | Copy-Item -Destination $vendor -Recurse -Force
} finally {
    if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}

if (-not (Test-Payload)) { throw "Payload MariaDB extraido, mas faltam executaveis obrigatorios." }
Write-Host "MariaDB $($manifest.version) verificado e preparado em $vendor"
