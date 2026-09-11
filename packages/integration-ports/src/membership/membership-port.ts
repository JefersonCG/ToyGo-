export interface MembershipPlanSnapshot {
  id: string;
  name: string;
  billingCycle: "monthly" | "quarterly" | "annual";
  includedMinutes: number;
  priceCents: number;
}

export interface MembershipPort {
  activateMembership(input: { familyId: string; planId: string; startsAt: string }): Promise<{ membershipId: string }>;
  consumeBenefit(input: { membershipId: string; playSessionId: string; minutes: number }): Promise<void>;
  listPlans(): Promise<MembershipPlanSnapshot[]>;
}
