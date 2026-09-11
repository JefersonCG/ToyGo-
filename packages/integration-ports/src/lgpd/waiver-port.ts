export interface WaiverSignaturePayload {
  tenantId: string;
  guardianName: string;
  guardianDocument?: string;
  childName: string;
  termsVersion: string;
  signedAt: string;
}

export interface WaiverPort {
  signWaiver(payload: WaiverSignaturePayload): Promise<{ waiverId: string; signedPayloadHash: string }>;
  revokeConsent(input: { waiverId: string; reason: string; revokedAt: string }): Promise<void>;
}
