import type { FinanceLedgerService, PaymentMethod } from "@toygo/domain";
import type { MovementIdFactory, StockMovement } from "@toygo/domain";

export class InventoryFinancePolicy {
  constructor(
    private readonly financeLedger: FinanceLedgerService,
    private readonly idFactory: MovementIdFactory
  ) {}

  async recordFinancialEffect(movement: StockMovement): Promise<void> {
    if (movement.totalValueCents <= 0) {
      return;
    }

    if (movement.direction === "in" && movement.source === "purchase") {
      await this.financeLedger.append({
        id: this.idFactory.createId("fin"),
        tenantId: movement.tenantId,
        operationalUnitId: movement.operationalUnitId,
        direction: "debit",
        source: "inventory_purchase",
        sourceId: movement.id,
        amountCents: movement.totalValueCents,
        paymentMethod: readPaymentMethod(movement.metadata) ?? "internal",
        occurredAt: movement.occurredAt,
        createdAt: new Date().toISOString(),
        createdByUserId: movement.createdByUserId
      });
      return;
    }

    if (movement.direction === "out" && (movement.source === "play_session_sale" || movement.source === "cross_sell")) {
      await this.financeLedger.append({
        id: this.idFactory.createId("fin"),
        tenantId: movement.tenantId,
        operationalUnitId: movement.operationalUnitId,
        direction: "credit",
        source: movement.source === "cross_sell" ? "cross_sell" : "play_session_checkout",
        sourceId: movement.id,
        amountCents: movement.totalValueCents,
        paymentMethod: readPaymentMethod(movement.metadata) ?? "internal",
        occurredAt: movement.occurredAt,
        createdAt: new Date().toISOString(),
        createdByUserId: movement.createdByUserId
      });
    }
  }
}

function readPaymentMethod(metadata: Record<string, unknown> | undefined): PaymentMethod | undefined {
  const value = metadata?.paymentMethod;
  return value === "cash" || value === "pix" || value === "card" || value === "boleto" || value === "internal"
    ? value
    : undefined;
}
