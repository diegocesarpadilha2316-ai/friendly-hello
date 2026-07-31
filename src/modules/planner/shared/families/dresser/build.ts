/**
 * FAMÍLIA GAVETEIRO — montagem 100% pela Biblioteca Construtiva.
 *
 * Mesma arquitetura do roupeiro: este arquivo só decide QUAIS componentes
 * existem, ONDE ficam e COM QUAIS parâmetros. Caixa, corrediças, folgas,
 * rig de movimento e ferragens vêm inteiramente dos componentes
 * (`lateral`, `base`, `tampo`, `fundo`, `rodape`, `gaveta`) e do
 * `AssemblyComposer`. Nenhuma geometria própria é criada aqui.
 */
import {
  buildAssembly,
  type AssemblyResult,
  type AssemblySlot,
  type ConstructionPiece,
} from "../../construction";
import type { FamilyBuildResult } from "../types";
import { handleType } from "../handles";
import { normalizeDresserSpec, type DresserSpec } from "./spec";

export interface DresserLayout extends Record<string, number> {
  plinthHeightMm: number;
  caseY0: number;
  caseHeightMm: number;
  innerWidthMm: number;
  interiorY0: number;
  interiorHeightMm: number;
  drawerPitchMm: number;
  frontZMm: number;
}

/** Alturas das gavetas: iguais ou progressivas (menor em cima). */
export function drawerHeights(spec: DresserSpec, regionMm: number, gapMm: number): number[] {
  const n = spec.drawers;
  const usable = Math.max(60 * n, regionMm - gapMm * (n - 1));
  if (spec.distribution === "iguais" || n === 1) {
    return Array.from({ length: n }, () => usable / n);
  }
  // Progressiva: a de baixo é ~1,6× a de cima, crescimento linear.
  const weights = Array.from({ length: n }, (_, i) => 1 + (0.6 * (n - 1 - i)) / Math.max(1, n - 1));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => (usable * w) / total);
}

/** Monta o gaveteiro. Puro e determinístico. */
export function buildDresser(input: Partial<DresserSpec> = {}): FamilyBuildResult<DresserSpec> & {
  layout: DresserLayout;
} {
  const spec = normalizeDresserSpec(input);
  const { widthMm: W, heightMm: H, depthMm: D, thicknessMm: t, backThicknessMm: bt } = spec;
  const P = spec.plinthHeightMm;
  const handle = handleType(spec.handle);

  const caseY0 = P;
  const caseH = Math.max(150, H - P);
  const innerW = W - 2 * t;
  const interiorY0 = caseY0 + t;
  const interiorH = Math.max(100, caseH - 2 * t);
  const interiorD = D - bt;
  const frontZ = D - t;

  const gap = 3;
  const heights = drawerHeights(spec, interiorH, gap);
  const drawerDepth = Math.max(200, interiorD - 20);

  const slots: AssemblySlot[] = [];

  /* ── caixa (batente + laterais + base + tampo + fundo) ── */
  if (spec.base === "rodape" && P > 0) {
    slots.push({
      id: "rodape",
      component: "rodape",
      at: [0, 0, 0],
      role: "batente",
      params: {
        widthMm: W,
        heightMm: P,
        thicknessMm: t,
        recessMm: spec.plinthRecessMm,
        finishId: spec.finishId,
      },
    });
  }
  slots.push(
    {
      id: "lateral-e",
      component: "lateral",
      at: [0, caseY0, 0],
      role: "lateral esquerda",
      params: { heightMm: caseH, depthMm: D, thicknessMm: t, side: "esquerda", finishId: spec.finishId },
    },
    {
      id: "lateral-d",
      component: "lateral",
      at: [W - t, caseY0, 0],
      role: "lateral direita",
      params: { heightMm: caseH, depthMm: D, thicknessMm: t, side: "direita", finishId: spec.finishId },
    },
    {
      id: "base",
      component: "base",
      at: [t, caseY0, 0],
      role: "base",
      params: {
        widthMm: innerW,
        depthMm: interiorD,
        thicknessMm: t,
        support: spec.base === "rodape" ? "rodape" : "pes",
        finishId: spec.finishId,
      },
    },
    {
      id: "tampo",
      component: "tampo",
      at: [t, caseY0 + caseH - t, 0],
      role: "tampo",
      params: {
        widthMm: innerW,
        depthMm: D,
        thicknessMm: t,
        overhangFrontMm: spec.topOverhangMm,
        overhangSideMm: spec.topOverhangMm,
        finishId: spec.finishId,
      },
    },
    {
      id: "fundo",
      component: "fundo",
      at: [0, caseY0, 0],
      role: "fundo",
      params: { widthMm: W, heightMm: caseH, thicknessMm: bt, mounting: "encaixado", finishId: spec.finishId },
    },
  );

  /* ── gavetas empilhadas (1 a N) ── */
  let y = interiorY0;
  heights.forEach((h, k) => {
    slots.push({
      id: `gaveta-${k + 1}`,
      component: "gaveta",
      at: [t, y, Math.max(bt, D - 8 - drawerDepth)],
      role: `gaveta ${k + 1}`,
      params: {
        widthMm: innerW,
        heightMm: h,
        depthMm: drawerDepth,
        thicknessMm: Math.min(15, t),
        bottomThicknessMm: bt,
        slide: spec.slide,
        opening: spec.opening,
        withFront: true,
        handle,
        finishId: spec.finishId,
      },
    });
    y += h + gap;
  });

  let assembly: AssemblyResult = buildAssembly({
    id: "gaveteiro",
    label: "Gaveteiro",
    slots,
    context: {
      thicknessMm: t,
      backThicknessMm: bt,
      finishId: spec.finishId,
      clearanceMm: 3,
      revealMm: 2,
      grain: "horizontal",
    },
  });

  /**
   * Frente SOBREPOSTA: a caixa da gaveta continua sendo a do componente
   * (folga de corrediça inclusa); só a frente passa a cobrir a largura
   * total do móvel, como manda a marcenaria. Nada de geometria nova.
   */
  if (spec.front === "sobreposta") {
    const pieces: ConstructionPiece[] = assembly.pieces.map((p) =>
      p.partKind === "gaveta-frente"
        ? { ...p, box: { ...p.box, x: 0, width: W } }
        : p,
    );
    assembly = { ...assembly, pieces };
  }

  const layout: DresserLayout = {
    plinthHeightMm: P,
    caseY0,
    caseHeightMm: caseH,
    innerWidthMm: innerW,
    interiorY0,
    interiorHeightMm: interiorH,
    drawerPitchMm: heights[0] ?? 0,
    frontZMm: frontZ,
  };

  return { spec, assembly, layout };
}