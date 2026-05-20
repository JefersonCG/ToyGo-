import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkMysqlConnection, readDesktopMysqlConfig } from "@toygo/database";
import { createMachineId, FileLicenseStore, HttpLicenseTransport, HybridLicenseEngine } from "@toygo/licensing";

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

function createLicenseEngine(): HybridLicenseEngine {
  const machineId = createMachineId();
  const store = new FileLicenseStore(path.join(app.getPath("userData"), "local-license.json"));
  const transport = new HttpLicenseTransport(process.env.TOYGO_LICENSE_SERVER_URL ?? "http://localhost:3000");

  return new HybridLicenseEngine(store, transport, {
    machineId,
    appVersion: process.env.TOYGO_APP_VERSION ?? app.getVersion(),
    offlineGraceDays: 7
  });
}

ipcMain.handle("toygo:get-runtime-status", async () => {
  const mysql = await checkMysqlConnection(readDesktopMysqlConfig());
  const licenseEngine = createLicenseEngine();
  const license = await licenseEngine.getLocalStatus();

  return {
    mariadb: mysql,
    mysql,
    license,
    machineId: license.machineId,
    appVersion: process.env.TOYGO_APP_VERSION ?? app.getVersion()
  };
});

ipcMain.handle("toygo:activate-license", async (_event, licenseKey: string) => {
  const licenseEngine = createLicenseEngine();
  return licenseEngine.activate(licenseKey);
});

app.whenReady().then(createWindow);

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
