export type PlaySessionAlertStatus = "normal" | "warning" | "overtime";

export interface PlaySessionPricingInput {
  startedAt: string;
  now: string;
  includedMinutes: number;
  basePriceCents: number;
  extraMinuteCents: number;
  alertThresholdMinutes: number;
}

export interface PlaySessionPricingSnapshot {
  elapsedSeconds: number;
  elapsedMinutesRounded: number;
  remainingSeconds: number;
  overtimeMinutes: number;
  totalTimeCents: number;
  status: PlaySessionAlertStatus;
}

export class MonitoringSessionPricingPolicy {
  snapshot(input: PlaySessionPricingInput): PlaySessionPricingSnapshot {
    if (input.includedMinutes <= 0) {
      throw new Error("Tempo contratado deve ser maior que zero.");
    }

    if (input.basePriceCents < 0 || input.extraMinuteCents < 0) {
      throw new Error("Valores de sessao devem ser positivos.");
    }

    const elapsedSeconds = Math.max(0, Math.floor((new Date(input.now).getTime() - new Date(input.startedAt).getTime()) / 1000));
    const elapsedMinutesRounded = Math.max(1, Math.ceil(elapsedSeconds / 60));
    const includedSeconds = input.includedMinutes * 60;
    const remainingSeconds = Math.max(0, includedSeconds - elapsedSeconds);
    const overtimeMinutes = Math.max(0, elapsedMinutesRounded - input.includedMinutes);
    const totalTimeCents = input.basePriceCents + overtimeMinutes * input.extraMinuteCents;
    const warningSeconds = input.alertThresholdMinutes * 60;
    const status: PlaySessionAlertStatus = overtimeMinutes > 0
      ? "overtime"
      : remainingSeconds <= warningSeconds
        ? "warning"
        : "normal";

    return {
      elapsedSeconds,
      elapsedMinutesRounded,
      remainingSeconds,
      overtimeMinutes,
      totalTimeCents,
      status
    };
  }
}
