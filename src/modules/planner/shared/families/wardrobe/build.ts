/**
 * FAMÍLIA ROUPEIRO — montagem 100% pela Biblioteca Construtiva.
 *
 * Este arquivo NÃO desenha nada. Ele apenas decide QUAIS componentes
 * existem, ONDE ficam e COM QUAIS parâmetros. Toda geometria, folga,
 * dobradiça, corrediça, trilho e furação vem dos componentes.
 */
import {
  buildAssembly,
  type AssemblyResult,
  type AssemblySlot,
  type ConstructionPiece,
} from "../../construction";
import type { FamilyBuildResult } from "../types";
import { handleType } from "../handles";
import { normalizeWardrobeSpec, type WardrobeSpec } from "./spec";
import { resolveWardrobeInterior, type WardrobeInteriorResult } from "./interior";

/** Quais folhas recebem espelho, conforme a ficha. */
export function mirroredDoorIndexes(spec: WardrobeSpec): ReadonlySet<number> {
  if (!spec.mirror.has || spec.doors === 0) return new Set();
  const { position } = spec.mirror;
  if (position === "todas") return new Set(Array.from({ length: spec.doors }, (_, i) => i));
  if (position === "lateral") return new Set([0, spec.doors - 1]);
  // "central" e "interna" espelham a folha do meio.
  return new Set([Math.floor((spec.doors - 1) / 2)]);
}

export interface WardrobeLayout extends Record<string, number> {
  plinthHeightMm: number;
  caseY0: number;
  caseHeightMm: number;
  innerWidthMm: number;
  columnWidthMm: number;
  interiorY0: number;
  interiorHeightMm: number;
  maleiroHeightMm: number;
  frontZMm: number;
}

/** Monta o roupeiro. Puro e determinístico. */
export function buildWardrobe(input: Partial<WardrobeSpec> = {}): FamilyBuildResult<WardrobeSpec> & {
  layout: WardrobeLayout;
  interior: WardrobeInteriorResult;
} {
  const spec = normalizeWardrobeSpec(input);
  const { widthMm: W, heightMm: H, depthMm: D, thicknessMm: t, backThicknessMm: bt } = spec;
  const P = spec.plinthHeightMm;
  const handle = handleType(spec.handle);

  const maleiroExternal = spec.maleiro && spec.opening !== "correr";
  const maleiroInternal = spec.maleiro && spec.opening === "correr";
  const maleiroH = spec.maleiro ? spec.maleiroHeightMm : 0;

  const caseY0 = P;
  const caseH = Math.max(400, H - P - (maleiroExternal ? maleiroH : 0));
  const innerW = W - 2 * t;
  const cols = spec.columns;
  const colW = (innerW - (cols - 1) * t) / cols;
  const colX = (i: number) => t + i * (colW + t);

  const interiorY0 = caseY0 + t;
  const interiorH = Math.max(200, caseH - 2 * t - (maleiroInternal ? maleiroH : 0));
  const interiorD = D - bt;
  const frontZ = D - t;

  const slots: AssemblySlot[] = [];

  /* ── caixa ── */
  if (P > 0) {
    slots.push({
      id: "rodape",
      component: "rodape",
      at: [0, 0, 0],
      role: "rodapé",
      params: { widthMm: W, heightMm: P, thicknessMm: t, recessMm: 40, finishId: spec.finishId },
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
      params: { widthMm: innerW, depthMm: interiorD, thicknessMm: t, support: "rodape", finishId: spec.finishId },
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
        overhangFrontMm: 0,
        overhangSideMm: 0,
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

  /* ── INTERIOR PARAMÉTRICO ──────────────────────────────────────────────
   * Nada é desenhado aqui: divisórias, prateleiras, cabideiros, gavetas,
   * nichos e sapateiras vêm do Layout Engine da Biblioteca de Interiores,
   * já convertidos em slots da Biblioteca Construtiva.
   */
  const interior = resolveWardrobeInterior(spec, {
    interiorY0,
    interiorHeightMm: interiorH,
    innerWidthMm: innerW,
  });
  for (const slot of interior.slots) {
    slots.push({
      ...slot,
      params: { finishId: spec.finishId, handle, ...(slot.params ?? {}) },
    });
  }

  /* ── maleiro ── */
  if (maleiroExternal) {
    slots.push({
      id: "maleiro",
      component: "maleiro",
      at: [0, caseY0 + caseH, 0],
      role: "maleiro",
      params: {
        widthMm: W,
        heightMm: maleiroH,
        depthMm: D,
        thicknessMm: t,
        doors: spec.opening === "abrir" ? spec.doors : 0,
        finishId: spec.finishId,
      },
    });
  } else if (maleiroInternal) {
    slots.push({
      id: "maleiro",
      component: "maleiro",
      at: [t, interiorY0 + interiorH, 0],
      role: "maleiro interno",
      params: {
        widthMm: innerW,
        heightMm: maleiroH,
        depthMm: interiorD,
        thicknessMm: t,
        doors: 0,
        finishId: spec.finishId,
      },
    });
  }

  /* ── frentes ── */
  const mirrored = mirroredDoorIndexes(spec);
  if (spec.opening === "abrir") {
    const doorW = W / spec.doors;
    for (let i = 0; i < spec.doors; i++) {
      slots.push({
        id: `porta-${i + 1}`,
        component: "porta-abrir",
        at: [i * doorW, caseY0, frontZ],
        role: `porta ${i + 1}`,
        params: {
          widthMm: doorW,
          heightMm: caseH,
          thicknessMm: t,
          swing: i < spec.doors / 2 ? "esquerda" : "direita",
          handle,
          substrate: mirrored.has(i) ? "espelho" : "mdf",
          finishId: spec.finishId,
        },
      });
    }
  } else if (spec.opening === "correr") {
    const tracks = spec.doors >= 3 ? 3 : 2;
    slots.push({
      id: "portas-correr",
      component: "porta-correr",
      at: [0, caseY0, D - (t + 6 * tracks)],
      role: "portas de correr",
      params: {
        widthMm: W,
        heightMm: caseH,
        thicknessMm: t,
        leaves: spec.doors,
        tracks,
        handle,
        finishId: spec.finishId,
      },
    });
  }

  let assembly: AssemblyResult = buildAssembly({
    id: "roupeiro",
    label: "Roupeiro",
    slots,
    context: {
      thicknessMm: t,
      backThicknessMm: bt,
      finishId: spec.finishId,
      clearanceMm: 3,
      revealMm: 2,
      grain: "vertical",
    },
  });

  // Espelho nas folhas de correr: a geometria e os trilhos continuam vindo
  // do componente; aqui só trocamos o substrato da folha indicada.
  if (spec.opening === "correr" && mirrored.size > 0) {
    let leaf = -1;
    const pieces: ConstructionPiece[] = assembly.pieces.map((p) => {
      if (p.partKind !== "porta") return p;
      leaf += 1;
      return mirrored.has(leaf) ? { ...p, substrate: "espelho" as const, label: `${p.label} espelhada` } : p;
    });
    assembly = { ...assembly, pieces };
  }

  const layout: WardrobeLayout = {
    plinthHeightMm: P,
    caseY0,
    caseHeightMm: caseH,
    innerWidthMm: innerW,
    columnWidthMm: colW,
    interiorY0,
    interiorHeightMm: interiorH,
    maleiroHeightMm: maleiroH,
    frontZMm: frontZ,
  };

  return { spec, assembly, layout, interior };
}
