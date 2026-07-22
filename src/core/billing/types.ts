/**
 * Billing (Fase 1.6) — tipos canônicos.
 * Consumido pelo Dashboard (CreditsCard/SubscriptionCard) e por qualquer
 * módulo que precise cobrar créditos (IA, Render, Marketplace, etc.).
 */
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled";
export type CreditKind = "grant" | "consume" | "refund" | "adjustment" | "expire";

export interface PlanDefinition {
  readonly key: string;
  readonly label: string;
  readonly monthlyCredits: number;
  readonly priceCents: number;
  readonly currency: string;
  readonly features: ReadonlyArray<string>;
  readonly sortOrder: number;
}

export interface TenantSubscription {
  readonly id: string;
  readonly companyId: string;
  readonly planKey: string;
  readonly status: SubscriptionStatus;
  readonly trialEndsAt: string | null;
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly cancelAtPeriodEnd: boolean;
  readonly externalProvider: string | null;
}

export interface CreditLedgerEntry {
  readonly id: string;
  readonly companyId: string;
  readonly kind: CreditKind;
  readonly amount: number;
  readonly reason: string | null;
  readonly reference: string | null;
  readonly createdAt: string;
}

export interface BillingSummary {
  readonly plan: PlanDefinition | null;
  readonly subscription: TenantSubscription | null;
  readonly balance: number;
  readonly usedThisPeriod: number;
  readonly resetsAt: string | null;
}
