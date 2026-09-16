import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("toygo", {
  getRuntimeStatus: () => ipcRenderer.invoke("toygo:get-runtime-status"),
  pairInstallation: (pairingCode: string) => ipcRenderer.invoke("toygo:pair-installation", pairingCode),
  createBackup: (reason?: "manual" | "scheduled" | "before_update") =>
    ipcRenderer.invoke("toygo:create-backup", reason),
  listBackups: () => ipcRenderer.invoke("toygo:list-backups"),
  restoreBackup: (backupId: string) => ipcRenderer.invoke("toygo:restore-backup", backupId)
});
