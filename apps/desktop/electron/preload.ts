import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("toygo", {
  getRuntimeStatus: () => ipcRenderer.invoke("toygo:get-runtime-status"),
  activateLicense: (licenseKey: string) => ipcRenderer.invoke("toygo:activate-license", licenseKey)
});
