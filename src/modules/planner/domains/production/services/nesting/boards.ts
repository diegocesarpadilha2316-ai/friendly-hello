/**
 * Catálogo de chapas industriais padrão + utilitários.
 * Puro; consumido pelo optimizer. Sem localStorage próprio.
 */
import type { NestingBoardSpec } from "./types";

export const STANDARD_BOARDS: readonly NestingBoardSpec[] = [
  {
    id: "duratex-mdf-18-branco-tx",
    material: "MDF",
    brand: "Duratex",
    color: "Branco TX",
    thicknessMm: 18,
    lengthMm: 2750,
    widthMm: 1850,
    supplier: "Duratex",
    weightKg: 52,
    price: 320,
    grain: "vertical",
  },
  {
    id: "duratex-mdp-15-carvalho",
    material: "MDP",
    brand: "Duratex",
    color: "Carvalho Rústico",
    thicknessMm: 15,
    lengthMm: 2750,
    widthMm: 1850,
    supplier: "Duratex",
    weightKg: 45,
    price: 285,
    grain: "vertical",
  },
  {
    id: "arauco-mdf-25-preto",
    material: "MDF",
    brand: "Arauco",
    color: "Preto",
    thicknessMm: 25,
    lengthMm: 2750,
    widthMm: 1850,
    supplier: "Arauco",
    weightKg: 72,
    price: 480,
    grain: "vertical",
  },
  {
    id: "eucatex-mdf-6-branco",
    material: "MDF",
    brand: "Eucatex",
    color: "Branco",
    thicknessMm: 6,
    lengthMm: 2750,
    widthMm: 1850,
    supplier: "Eucatex",
    weightKg: 21,
    price: 145,
    grain: "none",
  },
];

export function findBoard(id: string): NestingBoardSpec | undefined {
  return STANDARD_BOARDS.find((b) => b.id === id);
}

export function pickBoardFor(material: string, thicknessMm: number): NestingBoardSpec {
  const found = STANDARD_BOARDS.find(
    (b) => b.material.toLowerCase() === material.toLowerCase() && b.thicknessMm === thicknessMm,
  );
  return found ?? STANDARD_BOARDS[0];
}

export function boardAreaM2(spec: NestingBoardSpec): number {
  return (spec.lengthMm * spec.widthMm) / 1_000_000;
}
