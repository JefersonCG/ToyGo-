import { app, BrowserWindow, ipcMain, safeStorage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkMysqlConnection, readDesktopMysqlConfig } from "@toygo/database";
import { createMachineId, CentralSdkAdapter, FileCentralInstallationStore, type ProtectedValueCodec } from "@toygo/central-adapter";

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

  return {
    mariadb: mysql,
    mysql,
    license,
    machineId: createMachineId(),
    appVersion: process.env.TOYGO_APP_VERSION ?? app.getVersion()
  };
});

ipcMain.handle("toygo:pair-installation", async (_event, pairingCode: string) => {
  const central = createCentralAdapter();
  return central.pair(pairingCode);
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
