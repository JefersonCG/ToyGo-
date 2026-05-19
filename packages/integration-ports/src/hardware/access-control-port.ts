export interface AccessCredential {
  type: "rfid" | "nfc" | "qr_code" | "manual";
  value: string;
}

export interface AccessControlPort {
  bindCredential(input: { playSessionId: string; credential: AccessCredential }): Promise<void>;
  releaseCredential(input: { playSessionId: string; credential: AccessCredential }): Promise<void>;
  openGate(input: { gateId: string; reason: "entry" | "exit" | "manual_override" }): Promise<void>;
}
