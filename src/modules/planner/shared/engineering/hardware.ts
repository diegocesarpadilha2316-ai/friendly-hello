/**
 * Catálogo semente de ferragens (Fase 3.5).
 */
import type { HardwareItem, HardwareKind } from "./types";

function hw(
  id: string,
  brand: string,
  kind: HardwareKind,
  label: string,
  extras: Partial<HardwareItem> = {},
): HardwareItem {
  return { id, brand, kind, label, ...extras };
}

export const HARDWARE_ITEMS: readonly HardwareItem[] = [
  hw("blum-clip-top", "Blum", "dobradica", "Clip Top 110°", { code: "71B3550", capacityKg: 8 }),
  hw("hettich-sensys", "Hettich", "dobradica", "Sensys 110°", { capacityKg: 8 }),
  hw("hafele-metalla", "Häfele", "dobradica", "Metalla 110°", { capacityKg: 7 }),
  hw("fgvtn-caneco", "FGV", "dobradica", "Caneco 35mm", { capacityKg: 6 }),
  hw("blum-tandembox", "Blum", "corredica", "Tandembox Antaro", { capacityKg: 30, sizeMm: 500 }),
  hw("blum-legrabox", "Blum", "corredica", "Legrabox Pure", { capacityKg: 40, sizeMm: 500 }),
  hw("hettich-quadro", "Hettich", "corredica", "Quadro V6", { capacityKg: 30, sizeMm: 500 }),
  hw("fgv-telescopica", "FGV", "corredica", "Telescópica Slim", { capacityKg: 25, sizeMm: 500 }),
  hw("blum-aventos-hf", "Blum", "pistao", "Aventos HF", { capacityKg: 12 }),
  hw("hettich-lift-advanced", "Hettich", "pistao", "Lift Advanced HL", { capacityKg: 10 }),
  hw("hafele-trilho-slid", "Häfele", "trilho", "Slido Classic 40", { capacityKg: 40, sizeMm: 2000 }),
  hw("fgv-trilho-embutido", "FGV", "trilho", "Trilho Embutido 3m", { sizeMm: 3000 }),
  hw("dioris-cabid-ret", "Dioris", "cabideiro", "Cabideiro Retangular", { sizeMm: 1000 }),
  hw("dioris-cabid-oval", "Dioris", "cabideiro", "Cabideiro Oval", { sizeMm: 1000 }),
  hw("alugold-perfil-h", "Alugold", "perfil", "Perfil H Alumínio", { sizeMm: 2900 }),
  hw("alugold-perfil-tipone", "Alugold", "perfil", "Perfil Tip-On", { sizeMm: 2900 }),
  hw("dioris-cava-64", "Dioris", "puxador", "Cava 64mm", { sizeMm: 64 }),
  hw("dioris-cava-128", "Dioris", "puxador", "Cava 128mm", { sizeMm: 128 }),
  hw("dioris-perfil-gola", "Dioris", "puxador", "Perfil Gola", { sizeMm: 2900 }),
  hw("blum-blumotion", "Blum", "amortecedor", "Blumotion 973A", {}),
  hw("hettich-silent-system", "Hettich", "amortecedor", "Silent System", {}),
];

export function listHardware(kind: HardwareKind): readonly HardwareItem[] {
  return HARDWARE_ITEMS.filter((h) => h.kind === kind);
}

export function findHardware(id: string): HardwareItem | null {
  return HARDWARE_ITEMS.find((h) => h.id === id) ?? null;
}