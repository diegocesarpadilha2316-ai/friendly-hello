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

  /* ── divisórias verticais (colunas proporcionais) ── */
  for (let i = 1; i < cols; i++) {
    slots.push({
      id: `divisoria-${i}`,
      component: "divisoria-vertical",
      at: [colX(i) - t, interiorY0, 0],
      role: `divisória ${i}`,
      params: {
        heightMm: interiorH,
        depthMm: interiorD,
        thicknessMm: t,
        positionMm: 0,
        fullHeight: true,
        finishId: spec.finishId,
      },
    });
  }

  /* ── gavetas internas (empilhadas na coluna designada) ── */
  const drawerH = 200;
  const drawerGap = 3;
  const drawerStackH = spec.drawers > 0 ? spec.drawers * drawerH + (spec.drawers - 1) * drawerGap : 0;
  for (let k = 0; k < spec.drawers; k++) {
    slots.push({
      id: `gaveta-${k + 1}`,
      component: "gaveta",
      at: [colX(spec.drawerColumn), interiorY0 + 10 + k * (drawerH + drawerGap), bt],
      role: `gaveta ${k + 1}`,
      params: {
        widthMm: colW,
        heightMm: drawerH,
        depthMm: Math.max(200, interiorD - 30),
        handle,
        withFront: true,
        finishId: spec.finishId,
      },
    });
  }

  /* ── nichos abertos (topo das últimas colunas) ── */
  const nicheH = 320;
  const nicheColumns: number[] = [];
  for (let n = 0; n < spec.niches; n++) {
    const c = cols === 1 ? 0 : (Math.floor((cols - 1) / 2) + n) % cols;
    nicheColumns.push(c);
    slots.push({
      id: `nicho-${n + 1}`,
      component: "nicho",
      at: [colX(c), interiorY0 + interiorH - nicheH * (nicheColumns.filter((x) => x === c).length), bt],
      role: `nicho ${n + 1}`,
      params: {
        widthMm: colW,
        heightMm: nicheH,
        depthMm: Math.max(120, interiorD - 20),
        thicknessMm: t,
        withBack: false,
        finishId: spec.finishId,
      },
    });
  }

  /* ── cabideiros (colunas sem gaveteiro têm prioridade) ── */
  const hangerColumns: number[] = [];
  const preferred = Array.from({ length: cols }, (_, i) => i).filter(
    (i) => !(spec.drawers > 0 && i === spec.drawerColumn),
  );
  const pool = preferred.length > 0 ? preferred : Array.from({ length: cols }, (_, i) => i);
  for (let n = 0; n < spec.hangers; n++) hangerColumns.push(pool[n % pool.length]);
  hangerColumns.forEach((c, n) => {
    const inColumn = hangerColumns.slice(0, n).filter((x) => x === c).length;
    const nicheOffset = nicheColumns.includes(c) ? nicheH : 0;
    const y = interiorY0 + interiorH - nicheOffset - 80 - inColumn * Math.max(600, interiorH / 2.4);
    slots.push({
      id: `cabideiro-${n + 1}`,
      component: "cabideiro",
      at: [colX(c), 0, 0],
      role: `cabideiro ${n + 1}`,
      params: {
        widthMm: colW,
        heightMm: Math.max(interiorY0 + 300, y),
        depthOffsetMm: Math.max(60, interiorD / 2),
      },
    });
  });

  /* ── prateleiras (acima do gaveteiro / abaixo do cabideiro) ── */
  for (let c = 0; c < cols; c++) {
    const n = spec.shelvesPerColumn;
    if (n <= 0) continue;
    const isDrawerColumn = spec.drawers > 0 && c === spec.drawerColumn;
    const yStart = interiorY0 + (isDrawerColumn ? drawerStackH + 30 : 0);
    const nicheOffset = nicheColumns.includes(c) ? nicheH : 0;
    const yEnd = interiorY0 + interiorH - nicheOffset;
    const region = yEnd - yStart;
    if (region < 200) continue;
    const step = region / (n + 1);
    for (let k = 1; k <= n; k++) {
      slots.push({
        id: `prateleira-${c}-${k}`,
        component: "prateleira",
        at: [colX(c), yStart + step * k, bt],
        role: `prateleira coluna ${c + 1}`,
        params: {
          widthMm: colW,
          depthMm: Math.max(150, interiorD - 20),
          thicknessMm: t,
          positionMm: 0,
          finishId: spec.finishId,
        },
      });
    }
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

  return { spec, assembly, layout };
}
