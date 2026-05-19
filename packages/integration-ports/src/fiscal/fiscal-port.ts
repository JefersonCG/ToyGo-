export interface FiscalDocumentRequest {
  tenantId: string;
  operationalUnitId: string;
  checkoutId: string;
  amountCents: number;
  customerDocument?: string;
  items: Array<{ description: string; quantity: number; unitValueCents: number; fiscalCode?: string }>;
}

export interface FiscalPort {
  issueNfce(request: FiscalDocumentRequest): Promise<{ authorizationKey: string; xml: string }>;
  cancelFiscalDocument(request: { authorizationKey: string; reason: string }): Promise<void>;
}

export interface TefPort {
  authorizePayment(request: { amountCents: number; method: "credit" | "debit" | "pix" }): Promise<{ nsu: string; approved: boolean }>;
}
