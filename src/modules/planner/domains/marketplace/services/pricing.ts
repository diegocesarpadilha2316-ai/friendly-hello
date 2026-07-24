/** Fase 3.25 — Regras de precificação do Marketplace. */
import type { MarketplaceItem } from "../types";

export function formatBRL(amount: number): string {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function priceLabel(item: MarketplaceItem): string {
  return item.pricing.kind === "free" ? "Gratuito" : formatBRL(item.pricing.amount);
}

export function isFree(item: MarketplaceItem): boolean {
  return item.pricing.kind === "free";
}

export function isPremium(item: MarketplaceItem): boolean {
  return item.license === "premium" || item.license === "marketplace" || item.license === "empresa";
}
