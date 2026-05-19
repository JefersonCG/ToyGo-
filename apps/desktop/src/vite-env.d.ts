/// <reference types="vite/client" />

interface ToygoRuntimeStatus {
  mysql: { ok: boolean; message: string };
  license: {
    machineId: string;
    status: "inactive" | "active" | "grace" | "blocked" | "expired";
    expiresAt?: string;
    blockedReason?: string;
    payment?: {
      type: "pix" | "boleto";
      amountCents: number;
      copyPasteCode?: string;
      barcode?: string;
      expiresAt: string;
    };
  };
  machineId: string;
  appVersion: string;
}

interface Window {
  toygo: {
    getRuntimeStatus(): Promise<ToygoRuntimeStatus>;
    activateLicense(licenseKey: string): Promise<ToygoRuntimeStatus["license"]>;
  };
}
