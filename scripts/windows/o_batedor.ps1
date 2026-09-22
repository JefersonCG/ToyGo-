#Requires -Version 5.1
[CmdletBinding()]
param(
    [ValidateSet("AGRESSIVO", "COMPLIANCE")]
    [string]$Modo = "COMPLIANCE",
    [bool]$DryRun = $true,
    [switch]$AllowMutation,
    [ValidateSet("install", "recovery", "audit")]
    [string]$InstallerPhase = "install",
    [string]$ProductRoot = "C:\ToyGo",
    [int]$DatabasePort = 3306,
    [switch]$ProvisionEmbeddedMariaDb,
    [string]$MariaDbPackageRoot = "",
    [string]$InstallationId = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if (-not $AllowMutation) { $DryRun = $true }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) { $DryRun = $true }

$logRoot = Join-Path $env:LOCALAPPDATA "ToyGo\Logs"
try { New-Item -ItemType Directory -Path $logRoot -Force | Out-Null }
catch { $logRoot = Join-Path $env:TEMP "ToyGo\Logs"; New-Item -ItemType Directory -Path $logRoot -Force | Out-Null }
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logPath = Join-Path $logRoot "O_Batedor_$stamp.txt"
$diagnosticPath = Join-Path $env:TEMP "diagnostico_ambiente_$stamp.json"
$handoffPath = Join-Path $env:TEMP "ToyGo_installer_handoff_$stamp.json"
$phases = [System.Collections.Generic.List[object]]::new()
$errors = [System.Collections.Generic.List[object]]::new()

function Write-Log([string]$Message) {
    Add-Content -LiteralPath $logPath -Value ("[{0}] {1}" -f (Get-Date -Format o), $Message) -Encoding UTF8
}

function Add-Phase([string]$Name, [string]$Status, [hashtable]$Meta = @{}) {
    $entry = [ordered]@{ phase = $Name; status = $Status; timestamp = (Get-Date -Format o) }
    foreach ($key in $Meta.Keys) { $entry[$key] = $Meta[$key] }
    $phases.Add($entry)
    Write-Log ("[{0}] {1}" -f $Status, $Name)
    Write-Host ("  [{0}] {1}" -f $Status, $Name)
}

function Invoke-Mutation([string]$Description, [scriptblock]$Action) {
    if ($DryRun) { Add-Phase $Description "dry"; return }
    try { & $Action; Add-Phase $Description "ok" }
    catch { $errors.Add([ordered]@{ phase = $Description; error = $_.Exception.Message }); Add-Phase $Description "error" }
}

Write-Host "=== O_Batedor ToyGo! | modo=$Modo | dry_run=$DryRun | admin=$isAdmin ==="
Write-Log "O_Batedor ToyGo! | modo=$Modo | dry_run=$DryRun | admin=$isAdmin"

try {
    $computer = Get-CimInstance Win32_ComputerSystem
    $os = Get-CimInstance Win32_OperatingSystem
    $defender = "unknown"
    try { $defender = if ((Get-MpComputerStatus -ErrorAction Stop).AntivirusEnabled) { "enabled" } else { "disabled" } } catch {}
    $firewall = @{}
    try { Get-NetFirewallProfile | ForEach-Object { $firewall[$_.Name] = $_.Enabled } } catch {}
    Add-Phase "Fase0_Discovery" "ok" @{ cpu_cores = $computer.NumberOfLogicalProcessors; ram_free_mb = [math]::Round($os.FreePhysicalMemory / 1024); domain_joined = $computer.PartOfDomain; defender = $defender; firewall_profiles = $firewall }
} catch {
    $errors.Add([ordered]@{ phase = "Fase0_Discovery"; error = $_.Exception.Message }); Add-Phase "Fase0_Discovery" "error"
}

try {
    $services = @(Get-Service | Where-Object { $_.Status -eq "Running" } | Select-Object -ExpandProperty Name)
    $adapters = @(Get-NetAdapter -ErrorAction SilentlyContinue | Select-Object Name, Status, InterfaceDescription)
    Add-Phase "Fase1_Snapshot" "ok" @{ running_services = $services.Count; network_adapters = $adapters.Count }
} catch {
    $errors.Add([ordered]@{ phase = "Fase1_Snapshot"; error = $_.Exception.Message }); Add-Phase "Fase1_Snapshot" "error"
}

Invoke-Mutation "Fase2_ProductDirectory" {
    New-Item -ItemType Directory -Path $ProductRoot -Force | Out-Null
}
Add-Phase "Fase3_ExecutionPolicy" "audit" @{ policy = (Get-ExecutionPolicy -Scope LocalMachine).ToString() }

Invoke-Mutation "Fase4_LocalFirewallRule" {
    New-NetFirewallRule -DisplayName "ToyGo MariaDB $DatabasePort" -Direction Inbound -Protocol TCP -LocalPort $DatabasePort -Action Allow -Profile Domain,Private -RemoteAddress LocalSubnet -ErrorAction SilentlyContinue | Out-Null
}

if ($ProvisionEmbeddedMariaDb) {
    $mariaRoot = if ($MariaDbPackageRoot) { $MariaDbPackageRoot } else { Join-Path $ProductRoot "mariadb" }
    $mysqld = Join-Path $mariaRoot "bin\mysqld.exe"
    $admin = Join-Path $mariaRoot "bin\mariadb-admin.exe"
    if ((Test-Path -LiteralPath $mysqld) -and (Test-Path -LiteralPath $admin)) { Add-Phase "Fase5_MariaDbPayload" "ok" @{ root = $mariaRoot } }
    else { $errors.Add([ordered]@{ phase = "Fase5_MariaDbPayload"; error = "Payload MariaDB ausente: $mariaRoot" }); Add-Phase "Fase5_MariaDbPayload" "error" @{ root = $mariaRoot } }
} else { Add-Phase "Fase5_MariaDbPayload" "skip" }

Add-Phase "Fase6_WindowsUpdate" "audit" @{ global_mutation = $false }
Add-Phase "Fase7_ProcessInspector" "audit" @{ processes_terminated = $false }
Add-Phase "Fase8_Peripherals" "audit" @{ usb_disabled = $false }

$diagnostic = [ordered]@{
    schema_version = "toygo-o-batedor-1.0"
    generated_at = (Get-Date -Format o)
    installation_id = $InstallationId
    installer_phase = $InstallerPhase
    product = "ToyGo!"
    product_root = $ProductRoot
    modo = $Modo
    dry_run = $DryRun
    mutation_authorized = [bool]$AllowMutation
    is_admin = $isAdmin
    phases = @($phases)
    errors = @($errors)
    log_path = $logPath
    diagnostic_path = $diagnosticPath
    handoff_path = $handoffPath
}
$diagnostic | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $diagnosticPath -Encoding UTF8
[ordered]@{ schema_version = "toygo-installer-handoff-1.0"; product = "ToyGo!"; diagnostic_path = $diagnosticPath; log_path = $logPath; maria_db_requested = [bool]$ProvisionEmbeddedMariaDb; maria_db_package_root = $MariaDbPackageRoot; safe_to_continue = ($errors.Count -eq 0) } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $handoffPath -Encoding UTF8
Write-Host "Diagnostico: $diagnosticPath"
Write-Host "Handoff: $handoffPath"
Write-Log "Diagnostico=$diagnosticPath; Handoff=$handoffPath; erros=$($errors.Count)"
if ($errors.Count -gt 0) { exit 1 }
exit 0
