import type { ToygoId } from "../inventory/types";

export type FinanceLedgerDirection = "debit" | "credit";

export type FinanceLedgerSource =
  | "play_session_checkout"
  | "cross_sell"
  | "pix_receivable"
  | "cash_withdrawal"
  | "cash_supply"
  | "inventory_purchase"
  | "maintenance_cost"
  | "license_fee"
  | "reversal";

export interface FinanceLedgerEntry {
  id: ToygoId;
  tenantId: ToygoId;
  operationalUnitId: ToygoId;
  direction: FinanceLedgerDirection;
  source: FinanceLedgerSource;
  sourceId: ToygoId;
  amountCents: number;
  paymentMethod?: "cash" | "pix" | "card" | "boleto" | "internal";
  occurredAt: string;
  createdAt: string;
  createdByUserId: ToygoId;
  reversalOfEntryId?: ToygoId;
  metadata?: Record<string, unknown>;
}

export interface FinanceLedgerWriter {
  appendFinanceEntry(entry: FinanceLedgerEntry): Promise<void>;
}

export class FinanceLedgerService {
  constructor(private readonly writer: FinanceLedgerWriter) {}

  async append(entry: FinanceLedgerEntry): Promise<void> {
    if (!Number.isInteger(entry.amountCents) || entry.amountCents < 0) {
      throw new Error("Lancamento financeiro deve usar centavos inteiros positivos.");
    }

    await this.writer.appendFinanceEntry(entry);
  }
}
