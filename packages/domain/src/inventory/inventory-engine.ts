import type { FinanceLedgerService } from "../finance/finance-ledger";
import { PriceNormalization } from "./price-normalization";
import type { BalanceProvider } from "./balance-provider";
import type { MovementIdFactory, MovementWriter, StockMovement, StockMovementSource } from "./types";

export class InventoryEngine {
  constructor(
    private readonly movementWriter: MovementWriter,
    private readonly balanceProvider: BalanceProvider,
    private readonly priceNormalization: PriceNormalization,
    private readonly financeLedger: FinanceLedgerService,
    private readonly idFactory: MovementIdFactory
  ) {}

  async registerIncomingStock(input: InventoryCommand & {
    source: "purchase" | "opening_balance" | "manual_adjustment";
    quantity: number;
    unit: string;
    totalValueCents: number;
    paymentMethod?: "cash" | "pix" | "card" | "boleto" | "internal";
  }): Promise<StockMovement> {
    const movement = this.createMovement(input, "in");
    await this.persistAndProject(movement);

    if (input.source === "purchase" && input.totalValueCents > 0) {
      await this.financeLedger.append({
        id: this.idFactory.createId("fin"),
        tenantId: input.tenantId,
        operationalUnitId: input.operationalUnitId,
        direction: "debit",
        source: "inventory_purchase",
        sourceId: movement.id,
        amountCents: input.totalValueCents,
        paymentMethod: input.paymentMethod ?? "internal",
        occurredAt: input.occurredAt,
        createdAt: movement.createdAt,
        createdByUserId: input.createdByUserId
      });
    }

    return movement;
  }

  async registerConsumption(input: InventoryCommand & {
    source: "play_session_sale" | "cross_sell" | "maintenance" | "manual_adjustment";
    quantity: number;
    unit: string;
    totalValueCents: number;
  }): Promise<StockMovement> {
    const movement = this.createMovement(input, "out");
    await this.persistAndProject(movement);

    if (input.source === "play_session_sale" || input.source === "cross_sell") {
      await this.financeLedger.append({
        id: this.idFactory.createId("fin"),
        tenantId: input.tenantId,
        operationalUnitId: input.operationalUnitId,
        direction: "credit",
        source: input.source === "cross_sell" ? "cross_sell" : "play_session_checkout",
        sourceId: movement.id,
        amountCents: input.totalValueCents,
        paymentMethod: "internal",
        occurredAt: input.occurredAt,
        createdAt: movement.createdAt,
        createdByUserId: input.createdByUserId
      });
    }

    return movement;
  }

  async reverseMovement(input: InventoryCommand & {
    originalMovement: StockMovement;
    reason: string;
  }): Promise<StockMovement> {
    const reverseDirection = input.originalMovement.direction === "in" ? "out" : "in";
    const reversal: StockMovement = {
      ...input.originalMovement,
      id: this.idFactory.createId("mov"),
      direction: reverseDirection,
      source: "reversal",
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      createdAt: new Date().toISOString(),
      createdByUserId: input.createdByUserId,
      reversalOfMovementId: input.originalMovement.id,
      metadata: { reason: input.reason }
    };

    await this.persistAndProject(reversal);
    return reversal;
  }

  private createMovement(input: InventoryCommand & {
    source: StockMovementSource;
    quantity: number;
    unit: string;
    totalValueCents: number;
  }, direction: "in" | "out"): StockMovement {
    const normalized = this.priceNormalization.normalize({
      itemId: input.itemId,
      quantity: input.quantity,
      fromUnit: input.unit,
      totalValueCents: input.totalValueCents
    });

    return {
      id: this.idFactory.createId("mov"),
      tenantId: input.tenantId,
      operationalUnitId: input.operationalUnitId,
      itemId: input.itemId,
      direction,
      source: input.source,
      sourceId: input.sourceId,
      quantityBaseUnits: normalized.quantityBaseUnits,
      baseUnit: normalized.baseUnit,
      unitValueBaseCents: normalized.unitValueBaseCents,
      totalValueCents: normalized.totalValueCents,
      occurredAt: input.occurredAt,
      createdAt: new Date().toISOString(),
      createdByUserId: input.createdByUserId,
      metadata: input.metadata
    };
  }

  private async persistAndProject(movement: StockMovement): Promise<void> {
    await this.movementWriter.appendMovement(movement);
    await this.balanceProvider.projectMovement(movement);
  }
}

interface InventoryCommand {
  tenantId: string;
  operationalUnitId: string;
  itemId: string;
  sourceId: string;
  occurredAt: string;
  createdByUserId: string;
  metadata?: Record<string, unknown>;
}
