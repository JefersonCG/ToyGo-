import type { LicenseActivationRequest, LicenseServerResponse, LicenseStatusRequest, LicenseTransport, LocalLicenseState, LocalLicenseStore } from "./license-types";

export class HttpLicenseTransport implements LicenseTransport {
  constructor(private readonly baseUrl: string) {}

  async activate(request: LicenseActivationRequest): Promise<LicenseServerResponse> {
    return this.post("/api/licenses/activate", request);
  }

  async checkBlockStatus(request: LicenseStatusRequest): Promise<LicenseServerResponse> {
    return this.post("/api/licenses/status", request);
  }

  private async post(path: string, body: unknown): Promise<LicenseServerResponse> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Servidor de licenca respondeu HTTP ${response.status}.`);
    }

    return response.json() as Promise<LicenseServerResponse>;
  }
}

export class HybridLicenseEngine {
  constructor(
    private readonly store: LocalLicenseStore,
    private readonly transport: LicenseTransport,
    private readonly options: { machineId: string; appVersion: string; offlineGraceDays: number }
  ) {}

  async getLocalStatus(): Promise<LocalLicenseState> {
    const current = await this.store.read();
    if (!current) {
      return { machineId: this.options.machineId, status: "inactive" };
    }

    if (current.status === "active" && this.isPastGrace(current.lastSuccessfulCheckAt)) {
      return { ...current, status: "grace" };
    }

    return current;
  }

  async activate(licenseKey: string): Promise<LocalLicenseState> {
    const response = await this.transport.activate({
      licenseKey,
      machineId: this.options.machineId,
      appVersion: this.options.appVersion
    });

    const state: LocalLicenseState = {
      licenseKey,
      machineId: this.options.machineId,
      status: response.status,
      activatedAt: new Date().toISOString(),
      expiresAt: response.expiresAt,
      lastSuccessfulCheckAt: new Date().toISOString(),
      blockedReason: response.blockedReason,
      payment: response.payment
    };

    await this.store.write(state);
    return state;
  }

  async verifyBlockStatus(): Promise<LocalLicenseState> {
    const current = await this.getLocalStatus();
    if (!current.licenseKey) {
      return current;
    }

    try {
      const response = await this.transport.checkBlockStatus({
        licenseKey: current.licenseKey,
        machineId: this.options.machineId,
        appVersion: this.options.appVersion
      });

      const next: LocalLicenseState = {
        ...current,
        status: response.status,
        expiresAt: response.expiresAt,
        blockedReason: response.blockedReason,
        payment: response.payment,
        lastSuccessfulCheckAt: new Date().toISOString()
      };
      await this.store.write(next);
      return next;
    } catch {
      return this.isPastGrace(current.lastSuccessfulCheckAt)
        ? { ...current, status: "grace" }
        : current;
    }
  }

  private isPastGrace(lastSuccessfulCheckAt?: string): boolean {
    if (!lastSuccessfulCheckAt) {
      return true;
    }

    const elapsedMs = Date.now() - new Date(lastSuccessfulCheckAt).getTime();
    return elapsedMs > this.options.offlineGraceDays * 86_400_000;
  }
}
