import { readFile, writeFile } from "node:fs/promises";
import { createHash, webcrypto } from "node:crypto";
import type {
  CentralCommandResult,
  CentralHealthStatus,
  CentralLicenseProjection,
  CentralPlatformPort,
  CentralSupportSession
} from "@toygo/integration-ports";

type FetchLike = typeof fetch;

export interface CentralInstallationState {
  installationId: string;
  organizationId: string;
  productCode: string;
  credential: string;
  privateKeyPkcs8: string;
  commandPublicKey: string;
  credentialExpiresAt: string;
  lastSuccessfulAt: string;
  nextEventSequence: number;
  queuedEvents: CentralEventWire[];
  blockedReason?: string | null;
}

interface CentralEventWire {
  event_id: string;
  event_type: string;
  sensitivity_class: "technical" | "operational_metadata";
  payload: {
    component: string;
    summary: string;
    severity?: "info" | "warning" | "critical";
    labels?: Record<string, string>;
    metrics?: Record<string, number>;
  };
  sequence: number;
  occurred_at: string;
}

export interface CentralInstallationStore {
  read(): Promise<CentralInstallationState | null>;
  write(state: CentralInstallationState): Promise<void>;
}

export interface ProtectedValueCodec {
  protect(value: string): string;
  reveal(value: string): string;
}

export class FileCentralInstallationStore implements CentralInstallationStore {
  constructor(
    private readonly filePath: string,
    private readonly codec: ProtectedValueCodec,
  ) {}

  async read(): Promise<CentralInstallationState | null> {
    try {
      const value = JSON.parse(await readFile(this.filePath, "utf8")) as CentralInstallationState;
      return {
        ...value,
        credential: this.codec.reveal(value.credential),
        privateKeyPkcs8: this.codec.reveal(value.privateKeyPkcs8),
      };
    } catch {
      return null;
    }
  }

  async write(state: CentralInstallationState): Promise<void> {
    await writeFile(
      this.filePath,
      JSON.stringify({
        ...state,
        credential: this.codec.protect(state.credential),
        privateKeyPkcs8: this.codec.protect(state.privateKeyPkcs8),
      }, null, 2),
      "utf8",
    );
  }
}

export class MemoryProtectedValueCodec implements ProtectedValueCodec {
  protect(value: string): string {
    return `protected:${Buffer.from(value).toString("base64url")}`;
  }

  reveal(value: string): string {
    return value.startsWith("protected:")
      ? Buffer.from(value.slice("protected:".length), "base64url").toString("utf8")
      : value;
  }
}

export class MemoryCentralInstallationStore implements CentralInstallationStore {
  private state: CentralInstallationState | null = null;

  async read(): Promise<CentralInstallationState | null> {
    return this.state ? structuredClone(this.state) : null;
  }

  async write(state: CentralInstallationState): Promise<void> {
    this.state = structuredClone(state);
  }
}

export interface CentralSdkAdapterOptions {
  baseUrl: string;
  organizationId: string;
  productCode: string;
  installationLabel: string;
  sdkVersion: string;
  store: CentralInstallationStore;
  fetch?: FetchLike;
  now?: () => Date;
  offlineGraceHours?: number;
  allowInsecureDevelopment?: boolean;
}

interface CentralSupportSessionWire {
  id: string;
  organization_id: string;
  product_id: string;
  installation_id: string;
  status: "active" | "closed" | "expired";
  scopes: string[];
  managed_paths: string[];
  reason: string;
  started_at: string;
  expires_at: string;
  closed_at: string | null;
  forced_closed_reason: string | null;
}

function supportSessionFromWire(wire: CentralSupportSessionWire): CentralSupportSession {
  return {
    id: wire.id,
    organizationId: wire.organization_id,
    productId: wire.product_id,
    installationId: wire.installation_id,
    status: wire.status,
    scopes: wire.scopes,
    managedPaths: wire.managed_paths,
    reason: wire.reason,
    startedAt: wire.started_at,
    expiresAt: wire.expires_at,
    closedAt: wire.closed_at,
    forcedClosedReason: wire.forced_closed_reason,
  };
}

export interface CentralRemoteCommand {
  command_id: string;
  idempotency_key: string;
  schema_version: "1.0.0";
  type: string;
  product_code: string;
  organization_id: string;
  installation_id: string;
  issued_at: string;
  expires_at: string;
  risk_level: "L0" | "L1" | "L2" | "L3";
  required_approvals: number;
  payload: Record<string, unknown>;
  payload_sha256: string;
  signature: string;
  public_key: string;
  algorithm: "Ed25519";
  status: "available" | "leased";
  lease_expires_at: string | null;
}

interface CentralApiErrorBody {
  detail?: unknown;
}

const TOYGO_EVENT_TYPES = new Set([
  "toygo.capacity.warning",
  "toygo.cart.return_overdue",
  "toygo.device.offline",
  "toygo.backup.completed",
  "toygo.sync.failed",
]);

const FORBIDDEN_DATA = /visitor|visitante|child|crianc|guardian|respons[aá]vel|minor|menor|rental|loca[cç][aã]o|waiver|document|email|phone|telefone|session|sess[aã]o|name|nome/i;

// A Central exige um identificador tecnico estavel para agent_id
// (^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$), mas installationLabel e um rotulo
// livre para exibicao humana (ex.: "ToyGo Desktop", com espaco) -- nunca
// bate com esse padrao. Sem essa normalizacao, todo lease/ack de comando
// remoto falha com 422 contra uma Central real.
const DIACRITICS_PATTERN = new RegExp("[̀-ͯ]", "g");

function sanitizeAgentId(label: string): string {
  let value = label
    .normalize("NFKD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(/[^A-Za-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (value.length === 0) value = "agent";
  if (!/^[A-Za-z0-9]/.test(value)) value = `a-${value}`;
  if (value.length < 2) value = `${value}-agent`;
  return value.slice(0, 120);
}

export class CentralSdkAdapter implements CentralPlatformPort {
  readonly #baseUrl: URL;
  readonly #fetch: FetchLike;
  readonly #options: CentralSdkAdapterOptions;
  readonly #now: () => Date;
  readonly #offlineGraceHours: number;
  readonly #agentId: string;

  constructor(options: CentralSdkAdapterOptions) {
    this.#agentId = sanitizeAgentId(options.installationLabel);
    this.#baseUrl = new URL(options.baseUrl);
    if (
      this.#baseUrl.protocol !== "https:" &&
      !(options.allowInsecureDevelopment === true && ["localhost", "127.0.0.1"].includes(this.#baseUrl.hostname))
    ) {
      throw new Error("Central exige HTTPS fora do desenvolvimento local.");
    }
    this.#fetch = options.fetch ?? fetch;
    this.#options = options;
    this.#now = options.now ?? (() => new Date());
    this.#offlineGraceHours = options.offlineGraceHours ?? 168;
  }

  async pair(pairingCode: string): Promise<CentralLicenseProjection> {
    if (!pairingCode.trim()) throw new Error("Codigo de pareamento obrigatorio.");
    const discovery = await this.request<CentralDiscoveryWire>("/.well-known/multisistemas");
    if (!discovery.requires_tls || !discovery.api_versions.includes("v1") || !discovery.endpoints.pairing) {
      throw new Error("Descoberta da Central incompativel com o contrato v1.");
    }
    const keys = await createInstallationKeyPair();
    const issued = await this.request<CentralCredentialWire>(discovery.endpoints.pairing, {
      method: "POST",
      body: JSON.stringify({
        organization_id: this.#options.organizationId,
        product_code: this.#options.productCode,
        pairing_code: pairingCode.trim(),
        public_key: keys.publicKey,
        sdk_version: this.#options.sdkVersion,
        installation_label: this.#options.installationLabel,
      }),
    });
    await this.#options.store.write({
      installationId: issued.installation_id,
      organizationId: issued.organization_id,
      productCode: issued.product_code,
      credential: issued.credential,
      privateKeyPkcs8: keys.privateKeyPkcs8,
      commandPublicKey: discovery.command_public_key,
      credentialExpiresAt: issued.expires_at,
      lastSuccessfulAt: this.#now().toISOString(),
      nextEventSequence: 1,
      queuedEvents: [],
      blockedReason: null,
    });
    return this.readLicenseProjection();
  }

  async readLicenseProjection(): Promise<CentralLicenseProjection> {
    const state = await this.#options.store.read();
    if (!state) {
      return {
        status: "inactive",
        productCode: this.#options.productCode,
        installationId: null,
        expiresAt: null,
        blockedReason: null,
      };
    }
    if (state.blockedReason) {
      return {
        status: "blocked",
        productCode: state.productCode,
        installationId: state.installationId,
        expiresAt: state.credentialExpiresAt,
        blockedReason: state.blockedReason,
      };
    }
    const elapsedHours = (this.#now().getTime() - Date.parse(state.lastSuccessfulAt)) / 3_600_000;
    return {
      status: elapsedHours > this.#offlineGraceHours ? "grace" : "active",
      productCode: state.productCode,
      installationId: state.installationId,
      expiresAt: state.credentialExpiresAt,
      blockedReason: null,
    };
  }

  async rotateCredential(): Promise<CentralLicenseProjection> {
    const state = await this.requireState();
    const challenge = await this.request<{ challenge_id: string; nonce: string }>(
      "/api/v1/installations/rotation-challenges",
      { method: "POST" },
      state.credential,
    );
    const privateKey = await webcrypto.subtle.importKey(
      "pkcs8",
      fromBase64Url(state.privateKeyPkcs8),
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const signature = await webcrypto.subtle.sign(
      { name: "Ed25519" },
      privateKey,
      new TextEncoder().encode(challenge.nonce),
    );
    const issued = await this.request<CentralCredentialWire>(
      "/api/v1/installations/credentials/rotate",
      {
        method: "POST",
        body: JSON.stringify({
          challenge_id: challenge.challenge_id,
          nonce: challenge.nonce,
          signature: base64Url(signature),
        }),
      },
      state.credential,
    );
    state.credential = issued.credential;
    state.credentialExpiresAt = issued.expires_at;
    await this.saveSuccessful(state);
    return this.readLicenseProjection();
  }

  async publishHeartbeat(input: {
    productVersion: string;
    sdkVersion: string;
    healthStatus: CentralHealthStatus;
    capabilities: string[];
    checks?: Array<{ name: string; status: CentralHealthStatus; detail?: string | null }>;
  }): Promise<void> {
    const state = await this.requireState();
    await this.request("/api/v1/installations/heartbeat", {
      method: "POST",
      headers: { "Idempotency-Key": `heartbeat-${state.installationId}-${this.#now().toISOString()}` },
      body: JSON.stringify({
        product_version: input.productVersion,
        sdk_version: input.sdkVersion,
        health_status: input.healthStatus,
        capabilities: input.capabilities,
        checks: input.checks?.map((check) => ({ ...check, observed_at: this.#now().toISOString() })),
        observed_at: this.#now().toISOString(),
      }),
    }, state.credential);
    await this.flushQueuedEvents(state);
    await this.saveSuccessful(state);
  }

  async publishAggregateEvent(event: {
    eventId: string;
    eventType: string;
    sensitivityClass: "technical" | "operational_metadata";
    component: string;
    summary: string;
    severity?: "info" | "warning" | "critical";
    labels?: Record<string, string>;
    metrics?: Record<string, number>;
    occurredAt: string;
  }): Promise<void> {
    const state = await this.requireState();
    const eventWire = this.toEventWire(event, state.nextEventSequence);
    try {
      await this.sendEvents(state, [eventWire]);
      state.nextEventSequence += 1;
      await this.saveSuccessful(state);
    } catch (error) {
      if (error instanceof CentralHttpError && error.status < 500) throw error;
      state.queuedEvents.push(eventWire);
      state.nextEventSequence += 1;
      await this.#options.store.write(state);
    }
  }

  async processRemoteCommands(
    handlers: Partial<Record<string, (payload: Record<string, unknown>) => Promise<CentralCommandResult>>>,
  ): Promise<number> {
    const state = await this.requireState();
    const commands = await this.request<CentralRemoteCommand[]>("/api/v1/installations/commands", undefined, state.credential);
    let processed = 0;
    for (const command of commands) {
      await verifyRemoteCommand(command, state.commandPublicKey, this.#now());
      const leased = await this.request<CentralRemoteCommand>(
        `/api/v1/installations/commands/${encodeURIComponent(command.command_id)}/lease`,
        { method: "POST", body: JSON.stringify({ agent_id: this.#agentId, lease_seconds: 120 }) },
        state.credential,
      );
      const handler = handlers[leased.type];
      const result = handler
        ? await handler(leased.payload)
        : { summary: `Comando ${leased.type} nao possui handler local.` };
      await this.request(
        `/api/v1/installations/commands/${encodeURIComponent(leased.command_id)}/result`,
        {
          method: "POST",
          headers: { "Idempotency-Key": `ack-${leased.command_id}` },
          body: JSON.stringify({
            agent_id: this.#agentId,
            execution_id: `exec-${leased.command_id}`,
            status: handler ? "succeeded" : "failed",
            evidence: { summary: result.summary, artifacts: result.artifacts ?? [] },
            failure_reason: handler ? null : "handler_unconfigured",
          }),
        },
        state.credential,
      );
      processed += 1;
    }
    await this.saveSuccessful(state);
    return processed;
  }

  async listSupportSessions(): Promise<CentralSupportSession[]> {
    const state = await this.requireState();
    const wire = await this.request<CentralSupportSessionWire[]>(
      "/api/v1/installations/support-sessions",
      undefined,
      state.credential,
    );
    return wire.map(supportSessionFromWire);
  }

  async checkRelease(input: { productVersion: string; freeSpaceMb?: number }): Promise<unknown> {
    const state = await this.requireState();
    const params = new URLSearchParams({ product_version: input.productVersion, channel: "stable" });
    if (input.freeSpaceMb !== undefined) params.set("free_space_mb", String(input.freeSpaceMb));
    return this.request(`/api/v1/releases/eligible?${params.toString()}`, undefined, state.credential);
  }

  async publishBackupManifest(input: {
    backupId: string;
    formatVersion: string;
    createdAt: string;
    sizeBytes: number;
    sha256: string;
    storageReference: string;
    compatibility?: Record<string, string>;
  }): Promise<unknown> {
    const state = await this.requireState();
    const result = await this.request(
      "/api/v1/backups/manifests",
      {
        method: "POST",
        headers: { "Idempotency-Key": `backup-${input.backupId}` },
        body: JSON.stringify({
          backup_id: input.backupId,
          format_version: input.formatVersion,
          created_at: input.createdAt,
          size_bytes: input.sizeBytes,
          sha256: input.sha256,
          storage_reference: input.storageReference,
          compatibility: input.compatibility ?? {},
        }),
      },
      state.credential,
    );
    await this.saveSuccessful(state);
    return result;
  }

  private async requireState(): Promise<CentralInstallationState> {
    const state = await this.#options.store.read();
    if (!state) throw new Error("Instalacao ToyGo ainda nao foi pareada com a Central.");
    if (state.blockedReason) throw new Error(state.blockedReason);
    return state;
  }

  private async saveSuccessful(state: CentralInstallationState): Promise<void> {
    state.lastSuccessfulAt = this.#now().toISOString();
    await this.#options.store.write(state);
  }

  private toEventWire(event: {
    eventId: string;
    eventType: string;
    sensitivityClass: "technical" | "operational_metadata";
    component: string;
    summary: string;
    severity?: "info" | "warning" | "critical";
    labels?: Record<string, string>;
    metrics?: Record<string, number>;
    occurredAt: string;
  }, sequence: number): CentralEventWire {
    if (!TOYGO_EVENT_TYPES.has(event.eventType)) throw new Error("Evento ToyGo nao esta no manifesto publicado.");
    assertSafeTelemetry(event);
    return {
      event_id: event.eventId,
      event_type: event.eventType,
      sensitivity_class: event.sensitivityClass,
      payload: {
        component: event.component,
        summary: event.summary,
        severity: event.severity,
        labels: event.labels,
        metrics: event.metrics,
      },
      sequence,
      occurred_at: event.occurredAt,
    };
  }

  private async sendEvents(state: CentralInstallationState, events: CentralEventWire[]): Promise<void> {
    await this.request(
      "/api/v1/installations/events/batch",
      {
        method: "POST",
        headers: { "Idempotency-Key": `events-${events.map((event) => event.event_id).join("-")}` },
        body: JSON.stringify({ events }),
      },
      state.credential,
    );
  }

  private async flushQueuedEvents(state: CentralInstallationState): Promise<void> {
    if (state.queuedEvents.length === 0) return;
    await this.sendEvents(state, state.queuedEvents);
    state.queuedEvents = [];
  }

  private async request<T>(path: string, init?: RequestInit, credential?: string): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (init?.body !== undefined) headers.set("Content-Type", "application/json");
    if (credential) headers.set("Authorization", `Bearer ${credential}`);
    let response: Response;
    try {
      response = await this.#fetch(new URL(path, this.#baseUrl), { ...init, headers });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Central indisponivel.");
    }
    if (!response.ok) {
      let detail = `Central respondeu HTTP ${response.status}.`;
      try {
        const body = await response.json() as CentralApiErrorBody;
        if (typeof body.detail === "string") detail = body.detail;
      } catch {
        // HTTP status remains the reliable error.
      }
      throw new CentralHttpError(detail, response.status);
    }
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }
}

class CentralHttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface CentralDiscoveryWire {
  api_versions: string[];
  requires_tls: boolean;
  command_public_key: string;
  endpoints: { pairing?: string };
}

interface CentralCredentialWire {
  installation_id: string;
  organization_id: string;
  product_code: string;
  credential: string;
  expires_at: string;
}

async function createInstallationKeyPair(): Promise<{ publicKey: string; privateKeyPkcs8: string }> {
  const pair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const publicKey = await webcrypto.subtle.exportKey("raw", pair.publicKey);
  const privateKeyPkcs8 = await webcrypto.subtle.exportKey("pkcs8", pair.privateKey);
  return { publicKey: base64Url(publicKey), privateKeyPkcs8: base64Url(privateKeyPkcs8) };
}

async function verifyRemoteCommand(command: CentralRemoteCommand, trustedPublicKey: string, now: Date): Promise<void> {
  if (command.algorithm !== "Ed25519" || command.public_key !== trustedPublicKey) throw new Error("Comando remoto rejeitado.");
  if (Date.parse(command.expires_at) <= now.getTime()) throw new Error("Comando remoto expirado.");
  const payloadHash = createHash("sha256").update(canonicalJson(command.payload)).digest("hex");
  if (payloadHash !== command.payload_sha256) throw new Error("Hash do comando remoto divergente.");
  const signingPayload = {
    command_id: command.command_id,
    idempotency_key: command.idempotency_key,
    schema_version: command.schema_version,
    type: command.type,
    product_code: command.product_code,
    organization_id: command.organization_id,
    installation_id: command.installation_id,
    issued_at: command.issued_at,
    expires_at: command.expires_at,
    risk_level: command.risk_level,
    required_approvals: command.required_approvals,
    payload: command.payload,
    payload_sha256: command.payload_sha256,
  };
  const publicKey = await webcrypto.subtle.importKey("raw", fromBase64Url(trustedPublicKey), { name: "Ed25519" }, false, ["verify"]);
  const valid = await webcrypto.subtle.verify(
    { name: "Ed25519" },
    publicKey,
    fromBase64Url(command.signature),
    new TextEncoder().encode(canonicalJson(signingPayload)),
  );
  if (!valid) throw new Error("Assinatura do comando remoto invalida.");
}

function assertSafeTelemetry(event: {
  component: string;
  summary: string;
  labels?: Record<string, string>;
  metrics?: Record<string, number>;
}): void {
  if (FORBIDDEN_DATA.test(event.component) || FORBIDDEN_DATA.test(event.summary)) throw new Error("Telemetria contem dado operacional proibido.");
  for (const key of Object.keys(event.labels ?? {})) {
    if (FORBIDDEN_DATA.test(key)) throw new Error("Telemetria contem chave sensivel.");
  }
  for (const key of Object.keys(event.metrics ?? {})) {
    if (FORBIDDEN_DATA.test(key)) throw new Error("Telemetria contem metrica sensivel.");
  }
  if (/\b\d{11,14}\b|[^\s]+@[^\s]+/.test(event.summary)) throw new Error("Telemetria contem identificador pessoal.");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
}

function base64Url(value: ArrayBuffer): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}
