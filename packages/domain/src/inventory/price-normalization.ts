import { UnitConversionEngine } from "./unit-conversion-engine";
import type { PriceNormalizationResult } from "./types";

export class PriceNormalization {
  constructor(private readonly unitConversionEngine: UnitConversionEngine) {}

  normalize(input: {
    itemId: string;
    quantity: number;
    fromUnit: string;
    totalValueCents: number;
  }): PriceNormalizationResult {
    if (!Number.isInteger(input.totalValueCents) || input.totalValueCents < 0) {
      throw new Error("O valor total deve ser informado em centavos inteiros e nao pode ser negativo.");
    }

    const converted = this.unitConversionEngine.toBaseUnits(input);
    const unitValueBaseCents = converted.quantityBaseUnits === 0
      ? 0
      : Math.round((input.totalValueCents / converted.quantityBaseUnits) * 10_000) / 10_000;

    return {
      ...converted,
      unitValueBaseCents,
      totalValueCents: input.totalValueCents
    };
  }
}
