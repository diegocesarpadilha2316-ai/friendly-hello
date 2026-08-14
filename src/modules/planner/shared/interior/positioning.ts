/**
 * POSICIONAMENTO — traduz uma intenção de inserção (coluna, linha, nicho,
 * vão ou coordenada) numa caixa concreta dentro do vão, já respeitando
 * folgas, dimensões mínimas/máximas e ancoragem do módulo.
 */
import type { ConstructionBox } from "../construction";
import { box, clamp, round, warn } from "../construction";
import type { InteriorCavity, InteriorIssue, InteriorModuleDef, InteriorPosition } from "./types";

export interface ResolveOptions {
  /** Sub-vãos nomeados (usados por `{kind:"nicho"}`). */
  readonly niches?: readonly InteriorCavity[];
  /** Folga entre colunas/linhas (mm). */
  readonly gapMm?: number;
}

export interface ResolvedBox {
  readonly box: ConstructionBox;
  readonly warnings: readonly InteriorIssue[];
}

function fitDims(
  def: InteriorModuleDef,
  widthMm: number,
  heightMm: number,
  depthMm: number,
): [number, number, number] {
  return [
    clamp(widthMm, def.min.widthMm, def.max.widthMm),
    clamp(heightMm, def.min.heightMm, def.max.heightMm),
    clamp(depthMm, def.min.depthMm, def.max.depthMm),
  ];
}

/**
 * Aplica ancoragem do módulo dentro do vão.
 * "base" é PREFERÊNCIA (regra de aviso), nunca imposição: empilhar duas
 * sapateiras não pode colapsar as duas no piso do vão.
 */
function anchorY(def: InteriorModuleDef, cavity: InteriorCavity, y: number, h: number): number {
  if (def.anchor === "topo") return round(cavity.y + cavity.heightMm - h);
  return round(y);
}

function anchorX(def: InteriorModuleDef, cavity: InteriorCavity, x: number, w: number): number {
  if (def.anchor === "esquerda") return round(cavity.x);
  if (def.anchor === "direita") return round(cavity.x + cavity.widthMm - w);
  return round(x);
}

/** Resolve a caixa final do módulo dentro do vão. Nunca lança. */
export function resolveInteriorBox(
  cavity: InteriorCavity,
  def: InteriorModuleDef,
  position: InteriorPosition,
  opts: ResolveOptions = {},
): ResolvedBox {
  const warnings: InteriorIssue[] = [];
  const gap = opts.gapMm ?? 0;
  const side = def.clearances.sideMm;
  const front = def.clearances.frontMm;
  const usableDepth = Math.max(1, cavity.depthMm - front);

  let x = cavity.x + side;
  let y = cavity.y;
  let width = cavity.widthMm - side * 2;
  let height = cavity.heightMm;
  let depth = usableDepth;

  switch (position.kind) {
    case "coluna": {
      const of = Math.max(1, Math.round(position.of));
      const idx = clamp(Math.round(position.index), 0, of - 1);
      const each = (cavity.widthMm - gap * (of - 1)) / of;
      x = round(cavity.x + idx * (each + gap) + side);
      width = round(each - side * 2);
      break;
    }
    case "linha": {
      const of = Math.max(1, Math.round(position.of));
      const idx = clamp(Math.round(position.index), 0, of - 1);
      const each = (cavity.heightMm - gap * (of - 1)) / of;
      y = round(cavity.y + idx * (each + gap));
      height = round(each);
      break;
    }
    case "nicho": {
      const niche = (opts.niches ?? []).find((n) => n.id === position.nicheId);
      if (!niche) {
        warnings.push({
          level: "warn",
          code: "nicho-inexistente",
          message: `Nicho "${position.nicheId}" não existe — módulo posicionado no vão inteiro.`,
        });
        break;
      }
      x = round(niche.x + side);
      y = round(niche.y);
      width = round(niche.widthMm - side * 2);
      height = niche.heightMm;
      depth = Math.max(1, niche.depthMm - front);
      break;
    }
    case "vao": {
      const from = Math.min(position.fromYMm, position.toYMm);
      const to = Math.max(position.fromYMm, position.toYMm);
      y = round(cavity.y + from);
      height = round(Math.max(1, to - from));
      break;
    }
    case "coordenada": {
      const [ax, ay, az] = position.at;
      x = round(cavity.x + ax);
      y = round(cavity.y + ay);
      const s = position.size;
      width = s?.widthMm ?? def.preferred.widthMm;
      height = s?.heightMm ?? def.preferred.heightMm;
      depth = Math.min(usableDepth, s?.depthMm ?? def.preferred.depthMm);
      return {
        box: sized(def, cavity, x, y, round(cavity.z + az), width, height, depth, warnings),
        warnings,
      };
    }
  }

  return { box: sized(def, cavity, x, y, cavity.z, width, height, depth, warnings), warnings };
}

function sized(
  def: InteriorModuleDef,
  cavity: InteriorCavity,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  warnings: InteriorIssue[],
): ConstructionBox {
  const [fw, fh, fd] = fitDims(def, w, h, d);
  if (fw !== round(w) || fh !== round(h) || fd !== round(d)) {
    const wr = warn(
      "dimensao-ajustada",
      `${def.name}: dimensões ajustadas aos limites do módulo (${fw}×${fh}×${fd} mm).`,
    );
    warnings.push({ level: "warn", code: wr.code, message: wr.message });
  }
  return box(anchorX(def, cavity, x, fw), anchorY(def, cavity, y, fh), z, fw, fh, fd);
}

/** Divide um vão em N sub-vãos verticais nomeados (colunas). */
export function splitCavityColumns(
  cavity: InteriorCavity,
  count: number,
  gapMm = 0,
): readonly InteriorCavity[] {
  const n = Math.max(1, Math.round(count));
  const each = (cavity.widthMm - gapMm * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({
    ...cavity,
    id: `${cavity.id}:col-${i + 1}`,
    label: `Coluna ${i + 1}`,
    x: round(cavity.x + i * (each + gapMm)),
    widthMm: round(each),
  }));
}

/** Divide um vão em N sub-vãos horizontais nomeados (linhas/nichos). */
export function splitCavityRows(
  cavity: InteriorCavity,
  count: number,
  gapMm = 0,
): readonly InteriorCavity[] {
  const n = Math.max(1, Math.round(count));
  const each = (cavity.heightMm - gapMm * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({
    ...cavity,
    id: `${cavity.id}:row-${i + 1}`,
    label: `Linha ${i + 1}`,
    y: round(cavity.y + i * (each + gapMm)),
    heightMm: round(each),
  }));
}
