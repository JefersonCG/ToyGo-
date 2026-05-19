export type LicenseStatus = "inactive" | "active" | "grace" | "blocked" | "expired";

export interface LocalLicenseState {
  licenseKey?: string;
  machineId: string;
  status: LicenseStatus;
  activatedAt?: string;
  expiresAt?: string;
  lastSuccessfulCheckAt?: string;
  blockedReason?: string;
  payment?: LicensePaymentInstruction;
}

export interface LicensePaymentInstruction {
  type: "pix" | "boleto";
  amountCents: number;
  copyPasteCode?: string;
  barcode?: string;
  expiresAt: string;
}

export interface LicenseActivationRequest {
  licenseKey: string;
  machineId: string;
  appVersion: string;
}

export interface LicenseStatusRequest {
  licenseKey: string;
  machineId: string;
  appVersion: string;
}

export interface LicenseServerResponse {
  status: LicenseStatus;
  expiresAt?: string;
  blockedReason?: string;
  payment?: LicensePaymentInstruction;
}

export interface LicenseTransport {
  activate(request: LicenseActivationRequest): Promise<LicenseServerResponse>;
  checkBlockStatus(request: LicenseStatusRequest): Promise<LicenseServerResponse>;
}

export interface LocalLicenseStore {
  read(): Promise<LocalLicenseState | null>;
  write(state: LocalLicenseState): Promise<void>;
}
