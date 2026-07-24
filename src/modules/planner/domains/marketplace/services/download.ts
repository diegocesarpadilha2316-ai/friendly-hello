/** Fase 3.25 — Download determinístico (sem rede). */
import type { MarketplaceItem } from "../types";
import { getItem } from "./publish";
import { verifyItem } from "./verification";

export interface MarketplaceDownloadResult {
  readonly ok: boolean;
  readonly item?: MarketplaceItem;
  readonly reason?: string;
}

export function download(itemId: string): MarketplaceDownloadResult {
  const item = getItem(itemId);
  if (!item) return { ok: false, reason: "item não encontrado" };
  const verification = verifyItem(item);
  if (!verification.ok) return { ok: false, reason: verification.reason };
  return { ok: true, item };
}
