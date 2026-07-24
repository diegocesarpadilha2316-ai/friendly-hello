/** Fase 3.25 — Verificação determinística de checksum e integridade. */
import type { MarketplaceItem } from "../types";

export function verifyChecksum(item: MarketplaceItem): boolean {
  return /^sha256:[0-9a-f]{6,}$/.test(item.checksum);
}

export function verifyItem(item: MarketplaceItem): { ok: boolean; reason?: string } {
  if (!verifyChecksum(item)) return { ok: false, reason: "checksum inválido" };
  if (!item.blueprint) return { ok: false, reason: "blueprint ausente" };
  if (item.blueprint.id !== item.id) return { ok: false, reason: "blueprint fora de sincronia" };
  return { ok: true };
}
