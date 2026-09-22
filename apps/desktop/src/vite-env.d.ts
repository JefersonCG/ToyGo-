/// <reference types="vite/client" />

interface ToygoSupportSession {
  id: string;
  status: "active" | "closed" | "expired";
  scopes: string[];
  managedPaths: string[];
  reason: string;
  startedAt: string;
  expiresAt: string;
}

interface ToygoBackupManifest {
  id: string;
  databaseName: string;
  createdAt: string;
  filePath: string;
  checksumSha256?: string;
  sizeBytes?: number;
}

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
  supportSessions: ToygoSupportSession[];
  machineId: string;
  appVersion: string;
}

interface ToygoUpgradePreparation {
  currentVersion: string;
  targetVersion: string;
  backupCreated: boolean;
}

interface Window {
  toygo: {
    getRuntimeStatus(): Promise<ToygoRuntimeStatus>;
    pairInstallation(pairingCode: string): Promise<ToygoRuntimeStatus["license"]>;
    createBackup(reason?: "manual" | "scheduled" | "before_update"): Promise<ToygoBackupManifest>;
    listBackups(): Promise<ToygoBackupManifest[]>;
    restoreBackup(backupId: string): Promise<void>;
    prepareUpdate(targetVersion: string): Promise<ToygoUpgradePreparation>;
  };
}
