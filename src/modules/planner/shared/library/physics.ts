/**
 * Constantes físicas compartilhadas entre inserção manual (drag/drop)
 * e o motor de layout da IA. Centralizadas aqui para eliminar
 * duplicação (auditoria Parte 2).
 *
 * Todas as unidades em milímetros.
 */

/** Espessura útil da parede (centralizada) + folga do fundo do móvel. */
export const WALL_OFFSET_MM = 52;

/** Margem mínima entre móveis adjacentes ao longo da parede. */
export const CLEARANCE_MM = 20;

/**
 * Profundidades reais de marcenaria por subtype (mm). Sobrescreve o
 * default do catálogo quando este vier fora do padrão de mercado.
 */
export const REAL_DEPTH_BY_SUBTYPE: Readonly<Record<string, number>> = {
  aereo: 350,
  prateleira: 300,
  nicho: 300,
  painel: 40,
  balcao: 600,
  tampo: 600,
  bancada: 600,
  ilha: 900,
  torre: 600,
  gaveteiro: 500,
  closet: 600,
  roupeiro: 600,
  armario: 600,
  "guarda-roupa": 600,
  cristaleira: 400,
};

/** Subtypes considerados "marcenaria" que aceitam snap-to-wall. */
export const CABINET_SUBTYPES: ReadonlySet<string> = new Set([
  "aereo",
  "balcao",
  "torre",
  "gaveteiro",
  "closet",
  "roupeiro",
  "armario",
  "guarda-roupa",
  "cristaleira",
  "prateleira",
  "nicho",
  "painel",
  "tampo",
  "bancada",
  "ilha",
]);

export interface AABB {
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation?: number;
}

/**
 * AABB do bounding-box "footprint" (top-down) de uma peça posicionada
 * pelo canto superior esquerdo `(x,y)`. Para rotações 90/270 troca
 * largura↔profundidade e recentra em torno do centro original.
 */
export function footprintAABB(p: AABB): { x0: number; y0: number; x1: number; y1: number } {
  const rot = (((p.rotation ?? 0) % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const w = swap ? p.depth : p.width;
  const d = swap ? p.width : p.depth;
  const cx = p.x + p.width / 2;
  const cy = p.y + p.depth / 2;
  return { x0: cx - w / 2, y0: cy - d / 2, x1: cx + w / 2, y1: cy + d / 2 };
}

/** Retorna true se dois AABBs se sobrepõem (com folga opcional). */
export function aabbOverlap(a: AABB, b: AABB, clearance = 0): boolean {
  const A = footprintAABB(a);
  const B = footprintAABB(b);
  return !(
    A.x1 + clearance <= B.x0 ||
    B.x1 + clearance <= A.x0 ||
    A.y1 + clearance <= B.y0 ||
    B.y1 + clearance <= A.y0
  );
}
