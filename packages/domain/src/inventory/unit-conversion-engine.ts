import type { UnitConversionRule } from "./types";

export class UnitConversionEngine {
  private readonly rules = new Map<string, UnitConversionRule>();

  constructor(rules: UnitConversionRule[] = []) {
    rules.forEach((rule) => this.register(rule));
  }

  register(rule: UnitConversionRule): void {
    if (rule.factorToBase <= 0) {
      throw new Error("O fator de conversao deve ser maior que zero.");
    }

    this.rules.set(this.key(rule.itemId, rule.fromUnit), rule);
  }

  toBaseUnits(input: { itemId: string; quantity: number; fromUnit: string }): {
    quantityBaseUnits: number;
    baseUnit: string;
  } {
    if (input.quantity <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    const rule = this.rules.get(this.key(input.itemId, input.fromUnit));
    if (!rule) {
      throw new Error(`Conversao nao cadastrada para item ${input.itemId} em ${input.fromUnit}.`);
    }

    return {
      quantityBaseUnits: this.round(input.quantity * rule.factorToBase),
      baseUnit: rule.toBaseUnit
    };
  }

  private key(itemId: string, unit: string): string {
    return `${itemId}:${unit.toLowerCase()}`;
  }

  private round(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
  }
}
