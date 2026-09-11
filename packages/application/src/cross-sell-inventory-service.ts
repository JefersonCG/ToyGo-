import type { InventoryEngine, StockMovement } from "@toygo/domain";
import type { InventoryFinancePolicy } from "./inventory-finance-policy";

export interface RegisterCrossSellInput {
  tenantId: string;
  operationalUnitId: string;
  itemId: string;
  sessionId: string;
  quantity: number;
  unit: string;
  totalValueCents: number;
  occurredAt: string;
  createdByUserId: string;
}

export class CrossSellInventoryService {
  constructor(
    private readonly inventoryEngine: InventoryEngine,
    private readonly financePolicy: InventoryFinancePolicy
  ) {}

  async register(input: RegisterCrossSellInput): Promise<StockMovement> {
    const movement = await this.inventoryEngine.registerConsumption({
      tenantId: input.tenantId,
      operationalUnitId: input.operationalUnitId,
      itemId: input.itemId,
      source: "cross_sell",
      sourceId: input.sessionId,
      quantity: input.quantity,
      unit: input.unit,
      totalValueCents: input.totalValueCents,
      occurredAt: input.occurredAt,
      createdByUserId: input.createdByUserId,
      paymentMethod: "internal",
      metadata: {
        playSessionId: input.sessionId
      }
    });

    await this.financePolicy.recordFinancialEffect(movement);
    return movement;
  }
}
