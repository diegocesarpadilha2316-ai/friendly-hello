/** Fase 3.25 — Preparação de sincronização (Marketplace Dioris, ERP, Distribuidores). */
import type { MarketplaceItem } from "../types";
import { PLANNER_VERSION } from "../types";

export interface MarketplaceSyncTarget {
  readonly id: "marketplace-dioris" | "erp" | "distribuidor" | "fabricante";
  readonly label: string;
  readonly description: string;
  readonly plannerVersion: string;
}

export const MARKETPLACE_SYNC_TARGETS: readonly MarketplaceSyncTarget[] = [
  { id: "marketplace-dioris", label: "Marketplace Dioris", description: "Distribuição oficial Dioris", plannerVersion: PLANNER_VERSION },
  { id: "erp", label: "ERP", description: "Sincronização com o ERP da empresa", plannerVersion: PLANNER_VERSION },
  { id: "distribuidor", label: "Distribuidor", description: "Rede de distribuidores homologados", plannerVersion: PLANNER_VERSION },
  { id: "fabricante", label: "Fabricante", description: "Portal do fabricante", plannerVersion: PLANNER_VERSION },
];

export interface MarketplaceSyncManifest {
  readonly target: MarketplaceSyncTarget;
  readonly plannerVersion: string;
  readonly items: readonly { readonly id: string; readonly version: string; readonly checksum: string }[];
  readonly generatedAt: string;
}

export function buildManifest(target: MarketplaceSyncTarget["id"], items: readonly MarketplaceItem[]): MarketplaceSyncManifest {
  const found = MARKETPLACE_SYNC_TARGETS.find((t) => t.id === target)!;
  return {
    target: found,
    plannerVersion: PLANNER_VERSION,
    items: items.map((i) => ({ id: i.id, version: i.version, checksum: i.checksum })),
    generatedAt: new Date().toISOString(),
  };
}

export function listTargets(): readonly MarketplaceSyncTarget[] {
  return MARKETPLACE_SYNC_TARGETS;
}
