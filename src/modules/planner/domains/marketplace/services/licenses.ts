/** Fase 3.25 — Definição das licenças oferecidas. */
import type { MarketplaceLicense } from "../types";

export interface MarketplaceLicenseInfo {
  readonly id: MarketplaceLicense;
  readonly label: string;
  readonly description: string;
}

export const MARKETPLACE_LICENSES: readonly MarketplaceLicenseInfo[] = [
  { id: "free", label: "Free", description: "Uso ilimitado, sem custos." },
  { id: "premium", label: "Premium", description: "Assinatura Dioris Premium." },
  { id: "empresa", label: "Empresa", description: "Licença corporativa por CNPJ." },
  { id: "marketplace", label: "Marketplace", description: "Distribuído pelo Marketplace Dioris." },
];

export function listLicenses(): readonly MarketplaceLicenseInfo[] {
  return MARKETPLACE_LICENSES;
}
