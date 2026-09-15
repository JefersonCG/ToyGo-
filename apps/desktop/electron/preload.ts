import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("toygo", {
  getRuntimeStatus: () => ipcRenderer.invoke("toygo:get-runtime-status"),
  pairInstallation: (pairingCode: string) => ipcRenderer.invoke("toygo:pair-installation", pairingCode)
});
