export type CentralProductCode = string;

export type CentralHealthStatus = "healthy" | "degraded" | "unhealthy";

export type CentralEventSensitivity = "technical" | "operational_metadata";

export interface CentralProductModule {
  code: string;
  displayName: string;
  menuSlot: string;
  permissions: string[];
  capabilities: string[];
}

export interface CentralProductContext {
  organizationId: string;
  legalEntityId: string;
  subscriptionId: string;
  productCode: CentralProductCode;
  planCode: string;
  modules: CentralProductModule[];
  permissions: string[];
  capabilities: string[];
}

export interface CentralAggregateEvent {
  eventId: string;
  eventType: string;
  sensitivityClass: CentralEventSensitivity;
  component: string;
  summary: string;
  severity?: "info" | "warning" | "critical";
  labels?: Record<string, string>;
  metrics?: Record<string, number>;
  occurredAt: string;
}

export interface CentralLicenseProjection {
  status: "inactive" | "active" | "grace" | "blocked";
  productCode: CentralProductCode;
  installationId: string | null;
  expiresAt: string | null;
  blockedReason: string | null;
}

export interface CentralSupportSession {
  id: string;
  organizationId: string;
  productId: string;
  installationId: string;
  status: "active" | "closed" | "expired";
  scopes: string[];
  managedPaths: string[];
  reason: string;
  startedAt: string;
  expiresAt: string;
  closedAt: string | null;
  forcedClosedReason: string | null;
}

export interface CentralPlatformPort {
  pair(pairingCode: string): Promise<CentralLicenseProjection>;
  rotateCredential(): Promise<CentralLicenseProjection>;
  readLicenseProjection(): Promise<CentralLicenseProjection>;
  publishHeartbeat(input: {
    productVersion: string;
    sdkVersion: string;
    healthStatus: CentralHealthStatus;
    capabilities: string[];
    checks?: Array<{ name: string; status: CentralHealthStatus; detail?: string | null }>;
  }): Promise<void>;
  publishAggregateEvent(event: CentralAggregateEvent): Promise<void>;
  processRemoteCommands(
    handlers: Partial<Record<string, (payload: Record<string, unknown>) => Promise<CentralCommandResult>>>,
  ): Promise<number>;
  listSupportSessions(): Promise<CentralSupportSession[]>;
  checkRelease(input: { productVersion: string; freeSpaceMb?: number }): Promise<unknown>;
  publishBackupManifest(input: {
    backupId: string;
    formatVersion: string;
    createdAt: string;
    sizeBytes: number;
    sha256: string;
    storageReference: string;
    compatibility?: Record<string, string>;
  }): Promise<unknown>;
}

export interface CentralCommandResult {
  summary: string;
  artifacts?: Array<{ reference: string; sha256?: string }>;
}
