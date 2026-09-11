export interface BillingInstruction {
  type: "pix" | "boleto";
  amountCents: number;
  expiresAt: string;
  copyPasteCode?: string;
  barcode?: string;
}

export interface BillingPort {
  createLicenseCharge(input: { tenantId: string; licenseId: string; amountCents: number }): Promise<BillingInstruction>;
  checkChargeStatus(input: { chargeId: string }): Promise<{ paid: boolean; paidAt?: string }>;
}
