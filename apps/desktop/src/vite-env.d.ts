/// <reference types="vite/client" />

interface ToygoRuntimeStatus {
  mariadb: { ok: boolean; message: string };
  mysql: { ok: boolean; message: string };
  license: {
    status: "inactive" | "active" | "grace" | "blocked";
    productCode: string;
    installationId: string | null;
    expiresAt: string | null;
    blockedReason: string | null;
  };
  machineId: string;
  appVersion: string;
}

interface Window {
  toygo: {
    getRuntimeStatus(): Promise<ToygoRuntimeStatus>;
    pairInstallation(pairingCode: string): Promise<ToygoRuntimeStatus["license"]>;
  };
}
