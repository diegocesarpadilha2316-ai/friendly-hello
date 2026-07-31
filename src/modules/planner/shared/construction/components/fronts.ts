/**
 * Componentes de FRENTE: porta de abrir, porta de correr, frente de gaveta.
 * Puros — devolvem peças + ferragens + rig de animação.
 */
import type {
  ConstructionComponent,
  ConstructionContext,
  ConstructionHardwareRef,
  ConstructionMotion,
  ConstructionPiece,
  ConstructionResult,
  ConstructionWarning,
} from "../types";
import type {
  DoorSlidingParams,
  DoorSwingParams,
  DrawerFrontParams,
  FrontSubstrate,
} from "../params";
import {
  box,
  clamp,
  divideSpan,
  grainOf,
  intIn,
  positive,
  recommendedHinges,
  round,
  unionBox,
  warn,
} from "../geometry";

function substrateOf(s: FrontSubstrate): ConstructionPiece["substrate"] {
  if (s === "vidro" || s === "aluminio-vidro") return "vidro";
  if (s === "espelho") return "espelho";
  return "chapa";
}

function handleHardware(handle: DoorSwingParams["handle"], qty: number): ConstructionHardwareRef[] {
  if (handle === "push")
    return [
      {
        id: "push",
        kind: "amortecedor",
        qty,
        itemId: "alugold-perfil-tipone",
        notes: "push-to-open",
      },
    ];
  if (handle === "cava")
    return [
      { id: "cava", kind: "puxador", qty, itemId: "dioris-cava-128", notes: "usinagem na frente" },
    ];
  if (handle === "perfil-gola")
    return [{ id: "gola", kind: "puxador", qty, itemId: "dioris-perfil-gola" }];
  return [{ id: handle, kind: "puxador", qty }];
}

/* ───────────────────────────── PORTA DE ABRIR ───────────────────────────── */

export const doorSwing: ConstructionComponent<DoorSwingParams> = {
  id: "porta-abrir",
  label: "Porta de abrir",
  family: "frente",
  description: "Folha com dobradiças, abertura lateral ou basculante.",
  motionKind: "hinge",
  defaults: {
    widthMm: 450,
    heightMm: 700,
    thicknessMm: 18,
    swing: "esquerda",
    hinge: "caneco-35",
    hingeCount: 0,
    handle: "perfil-gola",
    opening: "softclose",
    substrate: "mdf",
    gapTopMm: 2,
    gapBottomMm: 2,
    gapSideMm: 2,
    maxAngleDeg: 110,
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-1-0",
    grain: "vertical",
  },
  normalize(p, ctx) {
    const d = doorSwing.defaults;
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 80, 1200),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 100, 2900),
      thicknessMm: clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 6, 30),
      swing: p.swing ?? d.swing,
      hinge: p.hinge ?? d.hinge,
      hingeCount: intIn(p.hingeCount, 0, 8, d.hingeCount),
      handle: p.handle ?? d.handle,
      opening: p.opening ?? d.opening,
      substrate: p.substrate ?? d.substrate,
      gapTopMm: clamp(p.gapTopMm ?? ctx.revealMm ?? d.gapTopMm, 0, 12),
      gapBottomMm: clamp(p.gapBottomMm ?? ctx.revealMm ?? d.gapBottomMm, 0, 12),
      gapSideMm: clamp(p.gapSideMm ?? ctx.revealMm ?? d.gapSideMm, 0, 12),
      maxAngleDeg: clamp(p.maxAngleDeg ?? d.maxAngleDeg, 45, 180),
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, ctx.grain),
    };
  },
  build(p, ctx) {
    const warnings: ConstructionWarning[] = [];
    const w = p.widthMm - p.gapSideMm * 2;
    const h = p.heightMm - p.gapTopMm - p.gapBottomMm;
    const hinges = p.hingeCount > 0 ? p.hingeCount : recommendedHinges(h, p.thicknessMm);

    if (w > 600 && p.swing !== "superior") {
      warnings.push(
        warn(
          "porta-larga",
          "Folha acima de 600 mm — considere duas folhas ou dobradiça reforçada.",
        ),
      );
    }
    if (h > 2400)
      warnings.push(
        warn("porta-alta", "Folha acima de 2400 mm — avaliar empenamento e nº de dobradiças."),
      );

    const pieceId = `${ctx.instanceId}:folha`;
    const piece: ConstructionPiece = {
      id: pieceId,
      partKind: "porta",
      label: "Folha de porta",
      box: box(p.gapSideMm, p.gapBottomMm, 0, w, h, p.thicknessMm),
      thicknessMm: p.thicknessMm,
      grain: p.grain,
      finishId: p.finishId,
      substrate: substrateOf(p.substrate),
    };

    const hardware: ConstructionHardwareRef[] = [
      {
        id: "dobradica",
        kind: "dobradica",
        qty: hinges,
        itemId: p.hinge === "caneco-35" ? "blum-clip-top" : undefined,
        notes: p.hinge,
      },
      ...handleHardware(p.handle, 1),
    ];
    if (p.opening === "softclose")
      hardware.push({
        id: "softclose",
        kind: "amortecedor",
        qty: hinges,
        itemId: "blum-blumotion",
      });
    if (p.swing === "superior")
      hardware.push({ id: "pistao", kind: "pistao", qty: 2, itemId: "blum-aventos-hf" });

    const vertical = p.swing === "esquerda" || p.swing === "direita";
    const motion: ConstructionMotion = {
      pieceId,
      kind: p.swing === "superior" ? "lift" : "hinge",
      axis: vertical ? "y" : "x",
      pivot:
        p.swing === "direita"
          ? [p.gapSideMm + w, 0, 0]
          : p.swing === "superior"
            ? [0, p.gapBottomMm + h, 0]
            : [p.gapSideMm, 0, 0],
      maxAngleDeg: p.maxAngleDeg,
      direction: p.swing === "direita" || p.swing === "inferior" ? -1 : 1,
      durationMs: p.opening === "softclose" ? 900 : 550,
      easing: p.opening === "softclose" ? "soft-close" : "ease-out",
    };

    return {
      componentId: "porta-abrir",
      instanceId: ctx.instanceId,
      envelope: box(0, 0, 0, p.widthMm, p.heightMm, p.thicknessMm),
      pieces: [piece],
      hardware,
      motions: [motion],
      warnings,
    };
  },
};

/* ──────────────────────────── PORTA DE CORRER ───────────────────────────── */

export const doorSliding: ConstructionComponent<DoorSlidingParams> = {
  id: "porta-correr",
  label: "Porta de correr",
  family: "frente",
  description: "Conjunto de folhas em trilho, com sobreposição entre folhas.",
  motionKind: "slide",
  defaults: {
    widthMm: 2700,
    heightMm: 2400,
    thicknessMm: 18,
    leaves: 3,
    tracks: 3,
    system: "embutido",
    handle: "perfil-gola",
    substrate: "mdf",
    overlapMm: 30,
    softClose: true,
    gapTopMm: 3,
    gapBottomMm: 6,
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-1-0",
    grain: "vertical",
  },
  normalize(p, ctx) {
    const d = doorSliding.defaults;
    const leaves = intIn(p.leaves, 2, 6, d.leaves);
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 800, 6000),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 600, 3000),
      thicknessMm: clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 6, 30),
      leaves,
      tracks: intIn(p.tracks, 2, leaves, Math.min(leaves, d.tracks)),
      system: p.system ?? d.system,
      handle: p.handle ?? d.handle,
      substrate: p.substrate ?? d.substrate,
      overlapMm: clamp(p.overlapMm ?? d.overlapMm, 0, 80),
      softClose: p.softClose ?? d.softClose,
      gapTopMm: clamp(p.gapTopMm ?? d.gapTopMm, 0, 20),
      gapBottomMm: clamp(p.gapBottomMm ?? d.gapBottomMm, 0, 30),
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, ctx.grain),
    };
  },
  build(p, ctx) {
    const warnings: ConstructionWarning[] = [];
    const h = p.heightMm - p.gapTopMm - p.gapBottomMm;
    // Folhas se sobrepõem: largura da folha = (vão + sobreposições) / nº folhas.
    const leafW = round((p.widthMm + p.overlapMm * (p.leaves - 1)) / p.leaves);
    if (leafW > 1200)
      warnings.push(
        warn(
          "folha-larga",
          "Folha acima de 1200 mm — usar perfil de alumínio e roldana reforçada.",
        ),
      );
    if (p.tracks < p.leaves && p.overlapMm < 20) {
      warnings.push(
        warn(
          "sobreposicao-baixa",
          "Sobreposição menor que 20 mm pode deixar vão aparente entre folhas.",
        ),
      );
    }

    const pieces: ConstructionPiece[] = [];
    const motions: ConstructionMotion[] = [];
    const trackDepth = p.thicknessMm + 6;

    for (let i = 0; i < p.leaves; i++) {
      const x = round(i * (leafW - p.overlapMm));
      const track = i % p.tracks;
      const id = `${ctx.instanceId}:folha-${i + 1}`;
      pieces.push({
        id,
        partKind: "porta",
        label: `Folha ${i + 1}`,
        box: box(x, p.gapBottomMm, track * trackDepth, leafW, h, p.thicknessMm),
        thicknessMm: p.thicknessMm,
        grain: p.grain,
        finishId: p.finishId,
        substrate: substrateOf(p.substrate),
        notes: `trilho ${track + 1}`,
      });
      // A folha corre até encostar no limite do vão — nunca para fora do móvel.
      const toRight = round(p.widthMm - leafW - x);
      const toLeft = round(x);
      const goesLeft = i === p.leaves - 1 || toLeft > toRight;
      motions.push({
        pieceId: id,
        kind: "slide",
        axis: "x",
        maxTravelMm: Math.max(0, goesLeft ? toLeft : toRight),
        direction: goesLeft ? -1 : 1,
        durationMs: p.softClose ? 1100 : 700,
        easing: p.softClose ? "soft-close" : "ease-out",
      });
    }

    const hardware: ConstructionHardwareRef[] = [
      {
        id: "trilho",
        kind: "trilho",
        qty: p.tracks,
        itemId: p.system === "embutido" ? "fgv-trilho-embutido" : "hafele-trilho-slid",
      },
      { id: "roldana", kind: "corredica", qty: p.leaves * 2, notes: "roldanas superior/inferior" },
      ...handleHardware(p.handle, p.leaves),
    ];
    if (p.softClose)
      hardware.push({
        id: "softclose",
        kind: "amortecedor",
        qty: p.leaves,
        itemId: "hettich-silent-system",
      });
    if (p.substrate === "aluminio-vidro")
      hardware.push({ id: "perfil", kind: "perfil", qty: p.leaves, itemId: "alugold-perfil-h" });

    return {
      componentId: "porta-correr",
      instanceId: ctx.instanceId,
      envelope: unionBox(pieces.map((x) => x.box)),
      pieces,
      hardware,
      motions,
      warnings,
    };
  },
};

/* ─────────────────────────── FRENTE DE GAVETA ───────────────────────────── */

export const drawerFront: ConstructionComponent<DrawerFrontParams> = {
  id: "frente-gaveta",
  label: "Frente de gaveta",
  family: "frente",
  description: "Frente independente, sobreposta ou embutida, com pega própria.",
  motionKind: "slide",
  defaults: {
    widthMm: 600,
    heightMm: 200,
    thicknessMm: 18,
    handle: "perfil-gola",
    substrate: "mdf",
    gapSideMm: 2,
    gapTopMm: 2,
    mounting: "sobreposta",
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-1-0",
    grain: "horizontal",
  },
  normalize(p, ctx) {
    const d = drawerFront.defaults;
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 100, 1600),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 60, 900),
      thicknessMm: clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 6, 30),
      handle: p.handle ?? d.handle,
      substrate: p.substrate ?? d.substrate,
      gapSideMm: clamp(p.gapSideMm ?? ctx.revealMm ?? d.gapSideMm, 0, 12),
      gapTopMm: clamp(p.gapTopMm ?? ctx.revealMm ?? d.gapTopMm, 0, 12),
      mounting: p.mounting ?? d.mounting,
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, ctx.grain),
    };
  },
  build(p, ctx): ConstructionResult {
    const w = p.widthMm - p.gapSideMm * 2;
    const h = p.heightMm - p.gapTopMm * 2;
    const id = `${ctx.instanceId}:frente`;
    const warnings: ConstructionWarning[] = [];
    if (h > 400)
      warnings.push(
        warn("gavetao", "Frente acima de 400 mm — gavetão: usar corrediça de maior capacidade."),
      );
    return {
      componentId: "frente-gaveta",
      instanceId: ctx.instanceId,
      envelope: box(0, 0, 0, p.widthMm, p.heightMm, p.thicknessMm),
      pieces: [
        {
          id,
          partKind: "gaveta-frente",
          label: "Frente de gaveta",
          box: box(p.gapSideMm, p.gapTopMm, 0, w, h, p.thicknessMm),
          thicknessMm: p.thicknessMm,
          grain: p.grain,
          finishId: p.finishId,
          substrate: substrateOf(p.substrate),
          notes: p.mounting,
        },
      ],
      hardware: handleHardware(p.handle, 1),
      motions: [
        {
          pieceId: id,
          kind: "slide",
          axis: "z",
          maxTravelMm: 500,
          direction: 1,
          durationMs: 900,
          easing: "soft-close",
        },
      ],
      warnings,
    };
  },
};

export const FRONT_COMPONENTS = [doorSwing, doorSliding, drawerFront] as const;
