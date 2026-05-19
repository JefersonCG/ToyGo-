import type { StockBalance, StockMovement } from "./types";

export interface BalanceProvider {
  getBalance(input: {
    tenantId: string;
    operationalUnitId: string;
    itemId: string;
  }): Promise<StockBalance | null>;

  projectMovement(movement: StockMovement): Promise<StockBalance>;
}

export class InMemoryBalanceProvider implements BalanceProvider {
  private readonly balances = new Map<string, StockBalance>();

  async getBalance(input: { tenantId: string; operationalUnitId: string; itemId: string }): Promise<StockBalance | null> {
    return this.balances.get(this.key(input)) ?? null;
  }

  async projectMovement(movement: StockMovement): Promise<StockBalance> {
    const key = this.key(movement);
    const current = this.balances.get(key);
    const signedQuantity = movement.direction === "in"
      ? movement.quantityBaseUnits
      : movement.direction === "out"
        ? -movement.quantityBaseUnits
        : 0;

    const nextQuantity = (current?.quantityBaseUnits ?? 0) + signedQuantity;
    if (nextQuantity < 0) {
      throw new Error("Saldo insuficiente para concluir a movimentacao.");
    }

    const nextAverage = this.calculateAverage(current, movement, nextQuantity);
    const projected: StockBalance = {
      tenantId: movement.tenantId,
      operationalUnitId: movement.operationalUnitId,
      itemId: movement.itemId,
      quantityBaseUnits: nextQuantity,
      averageUnitValueBaseCents: nextAverage,
      baseUnit: movement.baseUnit,
      updatedAt: movement.createdAt
    };

    this.balances.set(key, projected);
    return projected;
  }

  private calculateAverage(current: StockBalance | undefined, movement: StockMovement, nextQuantity: number): number {
    if (movement.direction !== "in") {
      return current?.averageUnitValueBaseCents ?? movement.unitValueBaseCents;
    }

    const currentQuantity = current?.quantityBaseUnits ?? 0;
    const currentValue = currentQuantity * (current?.averageUnitValueBaseCents ?? 0);
    const incomingValue = movement.quantityBaseUnits * movement.unitValueBaseCents;
    return nextQuantity === 0 ? 0 : Math.round(((currentValue + incomingValue) / nextQuantity) * 10_000) / 10_000;
  }

  private key(input: { tenantId: string; operationalUnitId: string; itemId: string }): string {
    return `${input.tenantId}:${input.operationalUnitId}:${input.itemId}`;
  }
}
