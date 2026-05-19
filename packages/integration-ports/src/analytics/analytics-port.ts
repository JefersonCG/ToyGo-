export interface AnalyticsEvent {
  tenantId: string;
  operationalUnitId?: string;
  name: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface AnalyticsPort {
  publish(event: AnalyticsEvent): Promise<void>;
}
