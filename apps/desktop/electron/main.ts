import { app, BrowserWindow, ipcMain, safeStorage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkMysqlConnection, readDesktopMysqlConfig } from "@toygo/database";
import { createMachineId, CentralSdkAdapter, FileCentralInstallationStore, type ProtectedValueCodec } from "@toygo/central-adapter";
import { MysqlDumpBackupService, type BackupManifest } from "@toygo/backup";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

async function createWindow(): Promise<void> {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#101318",
    title: "ToyGo! Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    await window.loadURL("http://localhost:5173");
  } else {
    await window.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

class ElectronProtectedValueCodec implements ProtectedValueCodec {
  protect(value: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Armazenamento seguro do sistema operacional indisponivel.");
    }
    return safeStorage.encryptString(value).toString("base64");
  }

  reveal(value: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Armazenamento seguro do sistema operacional indisponivel.");
    }
    return safeStorage.decryptString(Buffer.from(value, "base64"));
  }
}

function createCentralAdapter(): CentralSdkAdapter {
  const store = new FileCentralInstallationStore(
    path.join(app.getPath("userData"), "central-installation.json"),
    new ElectronProtectedValueCodec(),
  );
  return new CentralSdkAdapter({
    baseUrl: process.env.TOYGO_CENTRAL_URL ?? "https://central.multisistemas.com.br",
    organizationId: process.env.TOYGO_CENTRAL_ORGANIZATION_ID ?? "",
    productCode: "toygo",
    installationLabel: process.env.TOYGO_INSTALLATION_LABEL ?? "ToyGo Desktop",
    sdkVersion: "1.0.0",
    store,
    allowInsecureDevelopment: isDev,
  });
}

function createBackupService(): MysqlDumpBackupService {
  return new MysqlDumpBackupService({
    config: readDesktopMysqlConfig(),
    backupsDir: path.join(app.getPath("userData"), "backups"),
  });
}

async function publishBackupManifest(manifest: BackupManifest): Promise<void> {
  const central = createCentralAdapter();
  try {
    await central.publishBackupManifest({
      backupId: manifest.id,
      formatVersion: "1.0.0",
      createdAt: manifest.createdAt,
      sizeBytes: manifest.sizeBytes ?? 0,
      sha256: manifest.checksumSha256 ?? "",
      storageReference: `local://${manifest.filePath}`,
      compatibility: { product_version: process.env.TOYGO_APP_VERSION ?? app.getVersion() },
    });
  } catch {
    // Backup local ja esta seguro em disco mesmo se a Central estiver
    // offline; o manifesto pode ser republicado manualmente depois.
  }
}

async function runCentralCycle(): Promise<void> {
  const central = createCentralAdapter();
  const mysql = await checkMysqlConnection(readDesktopMysqlConfig());
  try {
    await central.publishHeartbeat({
      productVersion: process.env.TOYGO_APP_VERSION ?? app.getVersion(),
      sdkVersion: "1.0.0",
      healthStatus: mysql.ok ? "healthy" : "degraded",
      capabilities: [
        "licensing",
        "heartbeat",
        "events",
        "remote_commands",
        "managed_releases",
        "backup_restore",
        "notifications",
        "aggregated_metrics",
      ],
      checks: [{ name: "mariadb", status: mysql.ok ? "healthy" : "degraded", detail: mysql.message }],
    });
  } catch {
    // The local operation remains available when the Central is offline.
  }
  try {
    await central.processRemoteCommands({
      "diagnostics.collect": async () => ({ summary: "Diagnostico tecnico agregado coletado localmente." }),
    });
  } catch {
    // Invalid, expired or unavailable commands are reconciled on the next cycle.
  }
}

ipcMain.handle("toygo:get-runtime-status", async () => {
  const mysql = await checkMysqlConnection(readDesktopMysqlConfig());
  const central = createCentralAdapter();
  const license = await central.readLicenseProjection();
  const supportSessions = await central.listSupportSessions().catch(() => []);

  return {
    mariadb: mysql,
    mysql,
    license,
    supportSessions,
    machineId: createMachineId(),
    appVersion: process.env.TOYGO_APP_VERSION ?? app.getVersion()
  };
});

ipcMain.handle("toygo:pair-installation", async (_event, pairingCode: string) => {
  const central = createCentralAdapter();
  return central.pair(pairingCode);
});

ipcMain.handle(
  "toygo:create-backup",
  async (_event, reason: "manual" | "scheduled" | "before_update" = "manual") => {
    const manifest = await createBackupService().createBackup({
      reason,
      requestedByUserId: "desktop-operator",
    });
    await publishBackupManifest(manifest);
    return manifest;
  },
);

ipcMain.handle("toygo:list-backups", async () => createBackupService().listBackups());

ipcMain.handle("toygo:restore-backup", async (_event, backupId: string) => {
  await createBackupService().restoreBackup({ backupId, requestedByUserId: "desktop-operator" });
});

app.whenReady().then(async () => {
  await createWindow();
  void runCentralCycle();
  setInterval(() => void runCentralCycle(), 60_000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
