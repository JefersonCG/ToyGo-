import { randomUUID } from "node:crypto";

export type ToygoId = string;

export type StockMovementDirection = "in" | "out" | "neutral";

export type StockMovementSource =
  | "purchase"
  | "play_session_sale"
  | "cross_sell"
  | "maintenance"
  | "manual_adjustment"
  | "reversal"
  | "opening_balance";

export interface UnitConversionRule {
  itemId: ToygoId;
  fromUnit: string;
  toBaseUnit: string;
  factorToBase: number;
}

export interface PriceNormalizationResult {
  quantityBaseUnits: number;
  unitValueBaseCents: number;
  totalValueCents: number;
  baseUnit: string;
}

export interface StockMovement {
  id: ToygoId;
  tenantId: ToygoId;
  operationalUnitId: ToygoId;
  itemId: ToygoId;
  direction: StockMovementDirection;
  source: StockMovementSource;
  sourceId: ToygoId;
  quantityBaseUnits: number;
  baseUnit: string;
  unitValueBaseCents: number;
  totalValueCents: number;
  occurredAt: string;
  createdAt: string;
  createdByUserId: ToygoId;
  reversalOfMovementId?: ToygoId;
  metadata?: Record<string, unknown>;
}

export interface StockBalance {
  tenantId: ToygoId;
  operationalUnitId: ToygoId;
  itemId: ToygoId;
  quantityBaseUnits: number;
  averageUnitValueBaseCents: number;
  baseUnit: string;
  updatedAt: string;
}

export interface MovementWriter {
  appendMovement(movement: StockMovement): Promise<void>;
}

export interface MovementIdFactory {
  createId(prefix: string): ToygoId;
}

export class DefaultMovementIdFactory implements MovementIdFactory {
  createId(prefix: string): ToygoId {
    return `${prefix}_${randomUUID()}`;
  }
}
