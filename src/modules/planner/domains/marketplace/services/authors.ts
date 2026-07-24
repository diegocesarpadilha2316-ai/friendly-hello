/** Fase 3.25 — Autores/empresas parceiras do Marketplace. */
import type { MarketplaceAuthor } from "../types";

export const MARKETPLACE_AUTHORS: readonly MarketplaceAuthor[] = [
  { id: "aut-dioris", name: "Estúdio Dioris", company: "Dioris", verified: true },
  { id: "aut-duratex", name: "Duratex Design", company: "Duratex", verified: true },
  { id: "aut-arauco", name: "Arauco Colecciones", company: "Arauco", verified: true },
  { id: "aut-guararapes", name: "Guararapes Studio", company: "Guararapes", verified: true },
  { id: "aut-berneck", name: "Berneck Interiores", company: "Berneck", verified: true },
  { id: "aut-sudati", name: "Sudati Design", company: "Sudati", verified: true },
  { id: "aut-blum", name: "Blum Engineering", company: "Blum", verified: true },
  { id: "aut-hettich", name: "Hettich Systems", company: "Hettich", verified: true },
  { id: "aut-fgv", name: "FGV Superiore", company: "FGV", verified: true },
  { id: "aut-hafele", name: "Häfele Iberia", company: "Häfele", verified: true },
  { id: "aut-zen", name: "Zen Ferragens", company: "Zen", verified: true },
  { id: "aut-metalnox", name: "Metalnox Studio", company: "Metalnox", verified: true },
];

export function listAuthors(): readonly MarketplaceAuthor[] {
  return MARKETPLACE_AUTHORS;
}

export function getAuthor(id: string): MarketplaceAuthor | undefined {
  return MARKETPLACE_AUTHORS.find((a) => a.id === id);
}
