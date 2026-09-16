import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  CentralSdkAdapter,
  FileCentralInstallationStore,
  MemoryCentralInstallationStore,
  MemoryProtectedValueCodec,
  type CentralInstallationState,
} from "./central-adapter";

const now = new Date("2026-09-12T12:00:00.000Z");

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function adapter(
  fetchImpl: typeof fetch,
  store = new MemoryCentralInstallationStore(),
  installationLabel = "toygo-desktop-1",
): CentralSdkAdapter {
  return new CentralSdkAdapter({
    baseUrl: "http://127.0.0.1:8000",
    organizationId: "org-1",
    productCode: "toygo",
    installationLabel,
    sdkVersion: "1.0.0",
    store,
    fetch: fetchImpl,
    now: () => now,
    allowInsecureDevelopment: true,
  });
}

function initialState(overrides: Partial<CentralInstallationState> = {}): CentralInstallationState {
  return {
    installationId: "installation-1",
    organizationId: "org-1",
    productCode: "toygo",
    credential: "credential.secret",
    privateKeyPkcs8: "private-key",
    commandPublicKey: "command-public-key",
    credentialExpiresAt: "2026-10-12T12:00:00.000Z",
    lastSuccessfulAt: now.toISOString(),
    nextEventSequence: 1,
    queuedEvents: [],
    blockedReason: null,
    ...overrides,
  };
}

describe("CentralSdkAdapter", () => {
  it("pairs through the generic Central endpoint and persists only the local installation state", async () => {
    const store = new MemoryCentralInstallationStore();
    const requests: Request[] = [];
    const client = adapter(async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (request.url.endsWith("/.well-known/multisistemas")) {
        return response({
          api_versions: ["v1"],
          requires_tls: true,
          command_public_key: "command-public-key",
          endpoints: { pairing: "/api/v1/installations/pair" },
        });
      }
      return response({
        installation_id: "installation-1",
        organization_id: "org-1",
        product_id: "product-1",
        product_code: "toygo",
        credential: "credential.secret",
        token_type: "bearer",
        audience: "central-installation",
        expires_at: "2026-10-12T12:00:00.000Z",
      }, 201);
    }, store);

    const projection = await client.pair("PAIR-123");
    const state = await store.read();
    const pairingBody = JSON.parse(await requests[1].clone().text()) as Record<string, unknown>;

    expect(projection).toMatchObject({ status: "active", productCode: "toygo", installationId: "installation-1" });
    expect(pairingBody).toMatchObject({ organization_id: "org-1", product_code: "toygo", pairing_code: "PAIR-123" });
    expect(pairingBody).not.toHaveProperty("private_key");
    expect(state).toMatchObject({ credential: "credential.secret", productCode: "toygo" });
    expect(state?.privateKeyPkcs8).toBeTruthy();
  });

  it("rejects visitor, guardian, child and rental data before the event leaves the product", async () => {
    const store = new MemoryCentralInstallationStore();
    await store.write(initialState());
    let sent = false;
    const client = adapter(async () => {
      sent = true;
      return response({ accepted_count: 1 });
    }, store);

    await expect(client.publishAggregateEvent({
      eventId: "event-1",
      eventType: "toygo.capacity.warning",
      sensitivityClass: "operational_metadata",
      component: "capacity",
      summary: "Crianca Amanda aguardando no playground",
      metrics: { occupancy: 4 },
      occurredAt: now.toISOString(),
    })).rejects.toThrow("dado operacional proibido");
    expect(sent).toBe(false);
  });

  it("publishes only authorized aggregates and keeps raw child data out of the wire payload", async () => {
    const store = new MemoryCentralInstallationStore();
    await store.write(initialState());
    let body: Record<string, unknown> | null = null;
    const client = adapter(async (_input, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return response({ accepted_count: 1 });
    }, store);

    await client.publishAggregateEvent({
      eventId: "event-2",
      eventType: "toygo.cart.return_overdue",
      sensitivityClass: "technical",
      component: "cart-monitor",
      summary: "Carrinho aguardando devolucao",
      labels: { unit: "unit-1", status: "overdue" },
      metrics: { carts_overdue: 1 },
      occurredAt: now.toISOString(),
    });

    const encoded = JSON.stringify(body);
    expect(encoded).toContain("carts_overdue");
    expect(encoded).not.toContain("guardian");
    expect(encoded).not.toContain("child");
    expect(encoded).not.toContain("visitor");
  });

  it("verifies the Central Ed25519 command before leasing and acknowledging it", async () => {
    const keyPair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair;
    const publicKey = base64Url(await webcrypto.subtle.exportKey("raw", keyPair.publicKey));
    const command = await makeCommand(publicKey, keyPair.privateKey);
    const store = new MemoryCentralInstallationStore();
    await store.write(initialState({ commandPublicKey: publicKey }));
    const calls: string[] = [];
    let ack: Record<string, unknown> | null = null;
    const client = adapter(async (input, init) => {
      const request = new Request(input, init);
      calls.push(`${request.method} ${new URL(request.url).pathname}`);
      if (request.url.endsWith("/commands")) return response([command]);
      if (request.url.endsWith("/lease")) return response(command);
      ack = JSON.parse(await request.text()) as Record<string, unknown>;
      return response({ status: "succeeded" });
    }, store);

    const processed = await client.processRemoteCommands({
      "diagnostics.collect": async () => ({ summary: "Diagnostico tecnico agregado." }),
    });

    expect(processed).toBe(1);
    expect(calls).toEqual([
      "GET /api/v1/installations/commands",
      "POST /api/v1/installations/commands/command-1/lease",
      "POST /api/v1/installations/commands/command-1/result",
    ]);
    expect(ack).toMatchObject({ status: "succeeded", execution_id: "exec-command-1" });
  });

  it("lists support sessions normalized to camelCase, without leaking the wire shape", async () => {
    const store = new MemoryCentralInstallationStore();
    await store.write(initialState());
    const client = adapter(async (input) => {
      const request = new Request(input);
      expect(request.url).toContain("/api/v1/installations/support-sessions");
      return response([{
        id: "support-1",
        organization_id: "org-1",
        product_id: "product-1",
        installation_id: "installation-1",
        status: "active",
        scopes: ["diagnostics"],
        managed_paths: ["/var/log/toygo"],
        reason: "Investigacao de heartbeat degradado",
        started_at: "2026-09-15T12:00:00.000Z",
        expires_at: "2026-09-15T13:00:00.000Z",
        closed_at: null,
        forced_closed_reason: null,
      }]);
    }, store);

    const sessions = await client.listSupportSessions();

    expect(sessions).toEqual([{
      id: "support-1",
      organizationId: "org-1",
      productId: "product-1",
      installationId: "installation-1",
      status: "active",
      scopes: ["diagnostics"],
      managedPaths: ["/var/log/toygo"],
      reason: "Investigacao de heartbeat degradado",
      startedAt: "2026-09-15T12:00:00.000Z",
      expiresAt: "2026-09-15T13:00:00.000Z",
      closedAt: null,
      forcedClosedReason: null,
    }]);
  });

  it("sanitizes a human-readable installation label into a wire-safe agent_id", async () => {
    // Regressao: a Central exige agent_id casando com
    // ^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$, mas installationLabel e um rotulo
    // livre ("ToyGo Desktop", com espaco) -- sem essa sanitizacao, todo
    // lease/ack de comando remoto falhava com 422 contra uma Central real.
    const keyPair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair;
    const publicKey = base64Url(await webcrypto.subtle.exportKey("raw", keyPair.publicKey));
    const command = await makeCommand(publicKey, keyPair.privateKey);
    const store = new MemoryCentralInstallationStore();
    await store.write(initialState({ commandPublicKey: publicKey }));
    const agentIds: string[] = [];
    const client = adapter(async (input, init) => {
      const request = new Request(input, init);
      if (request.url.endsWith("/commands")) return response([command]);
      if (request.url.endsWith("/lease")) {
        agentIds.push((JSON.parse(await request.text()) as { agent_id: string }).agent_id);
        return response(command);
      }
      agentIds.push((JSON.parse(await request.text()) as { agent_id: string }).agent_id);
      return response({ status: "succeeded" });
    }, store, "ToyGo Desktop");

    await client.processRemoteCommands({
      "diagnostics.collect": async () => ({ summary: "Diagnostico tecnico agregado." }),
    });

    expect(agentIds).toEqual(["ToyGo-Desktop", "ToyGo-Desktop"]);
    for (const agentId of agentIds) {
      expect(agentId).toMatch(/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/);
    }
  });

  it("encrypts installation credentials before writing the local file", async () => {
    const path = `${process.env.TEMP ?? "."}/toygo-central-installation-${Date.now()}.json`;
    const store = new FileCentralInstallationStore(path, new MemoryProtectedValueCodec());
    await store.write(initialState());
    const raw = await readFile(path, "utf8");
    const state = await store.read();

    expect(raw).not.toContain("credential.secret");
    expect(raw).not.toContain("private-key");
    expect(state).toMatchObject({ credential: "credential.secret", privateKeyPkcs8: "private-key" });
  });
});

async function makeCommand(publicKey: string, privateKey: CryptoKey): Promise<CentralRemoteCommandLike> {
  const payload = { reason: "technical" };
  const payloadSha256 = createHash("sha256").update(canonicalJson(payload)).digest("hex");
  const command = {
    command_id: "command-1",
    idempotency_key: "idempotency-1",
    schema_version: "1.0.0" as const,
    type: "diagnostics.collect",
    product_code: "toygo",
    organization_id: "org-1",
    installation_id: "installation-1",
    issued_at: "2026-09-12T11:59:00.000Z",
    expires_at: "2026-09-12T12:05:00.000Z",
    risk_level: "L0" as const,
    required_approvals: 0,
    payload,
    payload_sha256: payloadSha256,
    signature: "",
    public_key: publicKey,
    algorithm: "Ed25519" as const,
    status: "available" as const,
    lease_expires_at: null,
  };
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
  return commandWithSignature(command, privateKey, signingPayload);
}

async function commandWithSignature(command: CentralRemoteCommandLike, privateKey: CryptoKey, signingPayload: unknown): Promise<CentralRemoteCommandLike> {
  const signature = await webcrypto.subtle.sign(
    { name: "Ed25519" },
    privateKey,
    new TextEncoder().encode(canonicalJson(signingPayload)),
  );
  return { ...command, signature: base64Url(signature) };
}

type CentralRemoteCommandLike = {
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
};

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
}

function base64Url(value: ArrayBuffer): string {
  return Buffer.from(value).toString("base64url");
}
