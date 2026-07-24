/**
 * Fase 3.24 — Contrato de sincronização com ERP / Marketplace / Fornecedores.
 *
 * Determinístico e agnóstico. Nenhuma chamada de rede aqui — apenas os
 * shapes que outras camadas (server functions do Core) irão implementar.
 */
import type { CatalogItem } from "./types";

export type CatalogSyncSource = "erp" | "marketplace" | "supplier" | "manual";

export interface CatalogSyncEnvelope {
  readonly source: CatalogSyncSource;
  readonly generatedAt: string;
  readonly items: readonly CatalogItem[];
  readonly checksum: string;
}

function checksum(items: readonly CatalogItem[]): string {
  let hash = 0;
  for (const item of items) {
    for (const ch of `${item.id}:${item.sku}:${item.basePrice}`) {
      hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    }
  }
  return `dr-${(hash >>> 0).toString(16)}`;
}

export function buildSyncEnvelope(source: CatalogSyncSource, items: readonly CatalogItem[]): CatalogSyncEnvelope {
  return {
    source,
    generatedAt: new Date().toISOString(),
    items,
    checksum: checksum(items),
  };
}

export function verifySyncEnvelope(env: CatalogSyncEnvelope): boolean {
  return env.checksum === checksum(env.items);
}