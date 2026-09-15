# ToyGo! Central SDK Adapter

The Desktop integration is an adapter around the Central v1 control-plane
contract. The ToyGo domain never imports transport, license, heartbeat or
command code.

## Shared flows

- Pairing sends the product code, organization, pairing code and Ed25519 public
  key. The private key is generated and retained locally.
- The local license value is a projection of the Central installation state; it
  is not a second license authority.
- Heartbeats carry version, health, capabilities and technical checks only.
- Events are limited to manifest-declared ToyGo aggregate events. The adapter
  rejects child, guardian, visitor, contact, document, waiver and session data.
- Commands are signature-verified, leased and acknowledged through the common
  channel. Handlers are injected by local services, so no Central rule knows
  the meaning of a ToyGo rental or playground session.
- Release eligibility and backup manifests use the common v1 endpoints. The
  release and backup commands use the same command channel as every product.

## Local-first behavior

When the Central is unavailable, the local operation remains available. Events
are queued with sequence numbers and retried on the next successful heartbeat.
The local projection enters grace after the configured offline window. No
visitor, guardian or child record is queued for Central delivery.
