/**
 * Componentes INTERNOS: gaveta, prateleira, divisória vertical,
 * cabideiro, maleiro e nicho.
 */
import type {
  ConstructionComponent,
  ConstructionHardwareRef,
  ConstructionPiece,
  ConstructionWarning,
} from "../types";
import type {
  DividerParams,
  DrawerParams,
  HangerRodParams,
  NicheParams,
  ShelfParams,
  TopBoxParams,
} from "../params";
import {
  box,
  clamp,
  divideSpan,
  grainOf,
  intIn,
  positive,
  recommendedShelfSupports,
  round,
  shelfDeflection,
  unionBox,
  warn,
} from "../geometry";

/* ────────────────────────────────  GAVETA  ──────────────────────────────── */

export const drawer: ConstructionComponent<DrawerParams> = {
  id: "gaveta",
  label: "Gaveta",
  family: "interno",
  description: "Caixa de gaveta com corrediça, opcionalmente com frente integrada.",
  motionKind: "slide",
  defaults: {
    widthMm: 600,
    heightMm: 200,
    depthMm: 500,
    thicknessMm: 15,
    bottomThicknessMm: 6,
    slide: "oculta-softclose",
    slideLengthMm: 0,
    opening: "softclose",
    withFront: true,
    handle: "perfil-gola",
    capacityKg: 30,
    materialId: "mdf-15",
    finishId: "branco-tx",
    edge: "pvc-0-45",
    grain: "livre",
  },
  normalize(p, ctx) {
    const d = drawer.defaults;
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 150, 1600),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 60, 600),
      depthMm: clamp(positive(p.depthMm, d.depthMm), 200, 800),
      thicknessMm: clamp(positive(p.thicknessMm, d.thicknessMm), 9, 25),
      bottomThicknessMm: clamp(
        positive(p.bottomThicknessMm, ctx.backThicknessMm || d.bottomThicknessMm),
        3,
        18,
      ),
      slide: p.slide ?? d.slide,
      slideLengthMm: clamp(p.slideLengthMm ?? 0, 0, 800),
      opening: p.opening ?? d.opening,
      withFront: p.withFront ?? d.withFront,
      handle: p.handle ?? d.handle,
      capacityKg: clamp(p.capacityKg ?? d.capacityKg, 5, 80),
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, "livre"),
    };
  },
  build(p, ctx) {
    const warnings: ConstructionWarning[] = [];
    const t = p.thicknessMm;
    // Corrediça consome folga lateral (13 mm por lado no padrão telescópico).
    const sideClearance = p.slide === "roldana" ? 12.5 : 13;
    const boxW = round(p.widthMm - sideClearance * 2);
    const boxD = round(p.depthMm - 10);
    const boxH = round(Math.max(60, p.heightMm - 20));
    const slideLen = p.slideLengthMm > 0 ? p.slideLengthMm : Math.floor(boxD / 50) * 50;

    if (p.capacityKg > 40 && p.slide !== "tandem") {
      warnings.push(
        warn("carga-corredica", "Carga acima de 40 kg — indicar corrediça tandem/legrabox."),
      );
    }
    if (boxW > 1000)
      warnings.push(warn("gaveta-larga", "Gaveta acima de 1000 mm — usar corrediça sincronizada."));

    const pieces: ConstructionPiece[] = [
      {
        id: `${ctx.instanceId}:lateral-e`,
        partKind: "gaveta-lateral",
        label: "Lateral esquerda",
        box: box(0, 0, 0, t, boxH, boxD),
        thicknessMm: t,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:lateral-d`,
        partKind: "gaveta-lateral",
        label: "Lateral direita",
        box: box(boxW - t, 0, 0, t, boxH, boxD),
        thicknessMm: t,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:costa`,
        partKind: "gaveta-fundo",
        label: "Costa",
        box: box(t, 0, 0, boxW - t * 2, boxH, t),
        thicknessMm: t,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:travessa`,
        partKind: "gaveta-fundo",
        label: "Travessa frontal",
        box: box(t, 0, boxD - t, boxW - t * 2, boxH, t),
        thicknessMm: t,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:base`,
        partKind: "gaveta-base",
        label: "Base da gaveta",
        box: box(t, 0, t, boxW - t * 2, p.bottomThicknessMm, boxD - t * 2),
        thicknessMm: p.bottomThicknessMm,
        grain: "livre",
        finishId: p.finishId,
        substrate: "chapa",
      },
    ];

    if (p.withFront) {
      pieces.push({
        id: `${ctx.instanceId}:frente`,
        partKind: "gaveta-frente",
        label: "Frente integrada",
        box: box(-sideClearance, -10, boxD, p.widthMm, p.heightMm, 18),
        thicknessMm: 18,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      });
    }

    const hardware: ConstructionHardwareRef[] = [
      {
        id: "corredica",
        kind: "corredica",
        qty: 2,
        itemId:
          p.slide === "tandem"
            ? "blum-tandembox"
            : p.slide === "oculta-softclose"
              ? "blum-legrabox"
              : "fgv-telescopica",
        notes: `${slideLen} mm • ${p.capacityKg} kg`,
      },
    ];
    if (p.opening === "push-to-open")
      hardware.push({ id: "tipon", kind: "amortecedor", qty: 2, itemId: "alugold-perfil-tipone" });
    else if (p.opening === "softclose")
      hardware.push({ id: "softclose", kind: "amortecedor", qty: 2, itemId: "blum-blumotion" });
    if (p.withFront && p.handle !== "push")
      hardware.push({ id: "puxador", kind: "puxador", qty: 1, notes: p.handle });

    return {
      componentId: "gaveta",
      instanceId: ctx.instanceId,
      envelope: box(0, 0, 0, p.widthMm, p.heightMm, p.depthMm),
      pieces,
      hardware,
      // Todas as peças da gaveta deslizam juntas: rig por peça, mesmo curso.
      motions: pieces.map((pc) => ({
        pieceId: pc.id,
        kind: "slide" as const,
        axis: "z" as const,
        maxTravelMm: slideLen,
        direction: 1 as const,
        durationMs: p.opening === "softclose" ? 950 : 650,
        easing: p.opening === "softclose" ? ("soft-close" as const) : ("ease-out" as const),
      })),
      warnings,
    };
  },
};

/* ──────────────────────────────  PRATELEIRA  ────────────────────────────── */

export const shelf: ConstructionComponent<ShelfParams> = {
  id: "prateleira",
  label: "Prateleira",
  family: "interno",
  description: "Chapa horizontal, fixa ou removível, com suportes calculados.",
  motionKind: "static",
  defaults: {
    widthMm: 600,
    depthMm: 500,
    thicknessMm: 18,
    positionMm: 400,
    fixed: false,
    supportCount: 0,
    supportType: "pino",
    loadKg: 20,
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-0-45",
    grain: "livre",
  },
  normalize(p, ctx) {
    const d = shelf.defaults;
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 100, 2000),
      depthMm: clamp(positive(p.depthMm, d.depthMm), 100, 900),
      thicknessMm: clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 9, 40),
      positionMm: clamp(p.positionMm ?? d.positionMm, 0, 3000),
      fixed: p.fixed ?? d.fixed,
      supportCount: intIn(p.supportCount, 0, 20, d.supportCount),
      supportType: p.supportType ?? d.supportType,
      loadKg: clamp(p.loadKg ?? d.loadKg, 1, 120),
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, ctx.grain),
    };
  },
  build(p, ctx) {
    const warnings: ConstructionWarning[] = [];
    const supports =
      p.supportCount > 0 ? p.supportCount : recommendedShelfSupports(p.widthMm, p.loadKg);
    const deflection = shelfDeflection(p.widthMm, p.thicknessMm, p.loadKg);
    if (deflection > 3) {
      warnings.push(
        warn(
          "flecha",
          `Flecha estimada de ${deflection} mm — reduzir vão, engrossar chapa ou usar reforço.`,
        ),
      );
    }
    return {
      componentId: "prateleira",
      instanceId: ctx.instanceId,
      envelope: box(0, p.positionMm, 0, p.widthMm, p.thicknessMm, p.depthMm),
      pieces: [
        {
          id: `${ctx.instanceId}:prateleira`,
          partKind: "prateleira",
          label: p.fixed ? "Prateleira fixa" : "Prateleira removível",
          box: box(0, p.positionMm, 0, p.widthMm, p.thicknessMm, p.depthMm),
          thicknessMm: p.thicknessMm,
          grain: p.grain,
          finishId: p.finishId,
          substrate: "chapa",
          notes: `${supports} suportes (${p.supportType})`,
        },
      ],
      hardware: p.fixed
        ? [{ id: "cavilha", kind: "dobradica", qty: supports, notes: "fixação cavilha/minifix" }]
        : [{ id: "suporte", kind: "perfil", qty: supports, notes: p.supportType }],
      motions: [],
      warnings,
    };
  },
};

/* ────────────────────────────  DIVISÓRIA VERTICAL  ──────────────────────── */

export const divider: ConstructionComponent<DividerParams> = {
  id: "divisoria-vertical",
  label: "Divisória vertical",
  family: "estrutura",
  description: "Chapa vertical interna que separa colunas do módulo.",
  motionKind: "static",
  defaults: {
    heightMm: 700,
    depthMm: 500,
    thicknessMm: 18,
    positionMm: 300,
    fullHeight: true,
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-0-45",
    grain: "vertical",
  },
  normalize(p, ctx) {
    const d = divider.defaults;
    return {
      heightMm: clamp(positive(p.heightMm, d.heightMm), 100, 3000),
      depthMm: clamp(positive(p.depthMm, d.depthMm), 100, 900),
      thicknessMm: clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 9, 40),
      positionMm: clamp(p.positionMm ?? d.positionMm, 0, 6000),
      fullHeight: p.fullHeight ?? d.fullHeight,
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, ctx.grain),
    };
  },
  build(p, ctx) {
    const h = p.fullHeight ? p.heightMm : round(p.heightMm * 0.6);
    return {
      componentId: "divisoria-vertical",
      instanceId: ctx.instanceId,
      envelope: box(p.positionMm, 0, 0, p.thicknessMm, h, p.depthMm),
      pieces: [
        {
          id: `${ctx.instanceId}:divisoria`,
          partKind: "divisoria",
          label: "Divisória vertical",
          box: box(p.positionMm, 0, 0, p.thicknessMm, h, p.depthMm),
          thicknessMm: p.thicknessMm,
          grain: p.grain,
          finishId: p.finishId,
          substrate: "chapa",
        },
      ],
      hardware: [{ id: "uniao", kind: "dobradica", qty: 4, notes: "minifix/cavilha de união" }],
      motions: [],
      warnings: [],
    };
  },
};

/* ───────────────────────────────  CABIDEIRO  ────────────────────────────── */

export const hangerRod: ConstructionComponent<HangerRodParams> = {
  id: "cabideiro",
  label: "Cabideiro",
  family: "acessorio",
  description: "Barra de pendurar com suportes; perfil oval, redondo ou LED.",
  motionKind: "static",
  defaults: {
    widthMm: 900,
    heightMm: 1600,
    depthOffsetMm: 250,
    profile: "oval",
    diameterMm: 30,
    finish: "inox",
    supports: 0,
    loadKg: 25,
  },
  normalize(p) {
    const d = hangerRod.defaults;
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 200, 2000),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 200, 2900),
      depthOffsetMm: clamp(p.depthOffsetMm ?? d.depthOffsetMm, 50, 800),
      profile: p.profile ?? d.profile,
      diameterMm: clamp(p.diameterMm ?? d.diameterMm, 10, 60),
      finish: p.finish ?? d.finish,
      supports: intIn(p.supports, 0, 8, d.supports),
      loadKg: clamp(p.loadKg ?? d.loadKg, 5, 80),
    };
  },
  build(p, ctx) {
    const warnings: ConstructionWarning[] = [];
    const supports = p.supports > 0 ? p.supports : p.widthMm > 1000 ? 3 : 2;
    if (p.widthMm > 1200 && supports < 3) {
      warnings.push(warn("cabideiro-vao", "Vão acima de 1200 mm exige suporte central."));
    }
    return {
      componentId: "cabideiro",
      instanceId: ctx.instanceId,
      envelope: box(0, p.heightMm, p.depthOffsetMm, p.widthMm, p.diameterMm, p.diameterMm),
      pieces: [
        {
          id: `${ctx.instanceId}:barra`,
          partKind: "travessa",
          label: `Cabideiro ${p.profile}`,
          box: box(0, p.heightMm, p.depthOffsetMm, p.widthMm, p.diameterMm, p.diameterMm),
          thicknessMm: p.diameterMm,
          grain: "livre",
          substrate: p.profile === "led" ? "perfil" : "metal",
          notes: `${p.finish} • ${p.loadKg} kg`,
        },
      ],
      hardware: [
        {
          id: "cabideiro",
          kind: "cabideiro",
          qty: 1,
          itemId: p.profile === "oval" ? "dioris-cabid-oval" : "dioris-cabid-ret",
        },
        { id: "suporte", kind: "perfil", qty: supports, notes: "flange de apoio" },
      ],
      motions: [],
      warnings,
    };
  },
};

/* ────────────────────────────────  MALEIRO  ─────────────────────────────── */

export const topBox: ConstructionComponent<TopBoxParams> = {
  id: "maleiro",
  label: "Maleiro",
  family: "estrutura",
  description: "Caixa superior independente, geralmente com portas próprias.",
  motionKind: "static",
  defaults: {
    widthMm: 1200,
    heightMm: 400,
    depthMm: 600,
    thicknessMm: 18,
    doors: 2,
    withShelf: false,
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-0-45",
    grain: "vertical",
  },
  normalize(p, ctx) {
    const d = topBox.defaults;
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 300, 4000),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 200, 900),
      depthMm: clamp(positive(p.depthMm, d.depthMm), 200, 900),
      thicknessMm: clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 9, 40),
      doors: intIn(p.doors, 0, 8, d.doors),
      withShelf: p.withShelf ?? d.withShelf,
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, ctx.grain),
    };
  },
  build(p, ctx) {
    const t = p.thicknessMm;
    const pieces: ConstructionPiece[] = [
      {
        id: `${ctx.instanceId}:lat-e`,
        partKind: "lateral",
        label: "Lateral esquerda",
        box: box(0, 0, 0, t, p.heightMm, p.depthMm),
        thicknessMm: t,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:lat-d`,
        partKind: "lateral",
        label: "Lateral direita",
        box: box(p.widthMm - t, 0, 0, t, p.heightMm, p.depthMm),
        thicknessMm: t,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:base`,
        partKind: "base",
        label: "Base do maleiro",
        box: box(t, 0, 0, p.widthMm - 2 * t, t, p.depthMm),
        thicknessMm: t,
        grain: "livre",
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:tampo`,
        partKind: "tampo",
        label: "Tampo do maleiro",
        box: box(t, p.heightMm - t, 0, p.widthMm - 2 * t, t, p.depthMm),
        thicknessMm: t,
        grain: "livre",
        finishId: p.finishId,
        substrate: "chapa",
      },
    ];
    if (p.withShelf) {
      pieces.push({
        id: `${ctx.instanceId}:prateleira`,
        partKind: "prateleira",
        label: "Prateleira interna",
        box: box(t, round(p.heightMm / 2), 0, p.widthMm - 2 * t, t, p.depthMm - 10),
        thicknessMm: t,
        grain: "livre",
        finishId: p.finishId,
        substrate: "chapa",
      });
    }
    const doorWidths = p.doors > 0 ? divideSpan(p.widthMm, p.doors, 3) : [];
    doorWidths.forEach((w, i) => {
      pieces.push({
        id: `${ctx.instanceId}:porta-${i + 1}`,
        partKind: "porta",
        label: `Porta maleiro ${i + 1}`,
        box: box(3 + i * (w + 3), 3, p.depthMm, w, p.heightMm - 6, 18),
        thicknessMm: 18,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      });
    });
    return {
      componentId: "maleiro",
      instanceId: ctx.instanceId,
      envelope: unionBox(pieces.map((x) => x.box)),
      pieces,
      hardware:
        p.doors > 0
          ? [
              { id: "dobradica", kind: "dobradica", qty: p.doors * 2, itemId: "blum-clip-top" },
              {
                id: "pistao",
                kind: "pistao",
                qty: p.doors,
                itemId: "blum-aventos-hf",
                notes: "abertura basculante opcional",
              },
            ]
          : [],
      motions: doorWidths.map((_, i) => ({
        pieceId: `${ctx.instanceId}:porta-${i + 1}`,
        kind: "hinge" as const,
        axis: "y" as const,
        maxAngleDeg: 110,
        direction: (i % 2 === 0 ? 1 : -1) as 1 | -1,
        durationMs: 800,
        easing: "soft-close" as const,
      })),
      warnings:
        p.heightMm > 700
          ? [warn("maleiro-alto", "Maleiro acima de 700 mm — avaliar acesso e basculante.")]
          : [],
    };
  },
};

/* ─────────────────────────────────  NICHO  ──────────────────────────────── */

export const niche: ConstructionComponent<NicheParams> = {
  id: "nicho",
  label: "Nicho",
  family: "interno",
  description: "Vão aberto com opção de fundo, prateleiras e fita LED.",
  motionKind: "static",
  defaults: {
    widthMm: 400,
    heightMm: 400,
    depthMm: 350,
    thicknessMm: 18,
    withBack: true,
    ledStrip: false,
    shelves: 0,
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-0-45",
    grain: "livre",
  },
  normalize(p, ctx) {
    const d = niche.defaults;
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 100, 2000),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 100, 2000),
      depthMm: clamp(positive(p.depthMm, d.depthMm), 80, 800),
      thicknessMm: clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 9, 40),
      withBack: p.withBack ?? d.withBack,
      ledStrip: p.ledStrip ?? d.ledStrip,
      shelves: intIn(p.shelves, 0, 10, d.shelves),
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, ctx.grain),
    };
  },
  build(p, ctx) {
    const t = p.thicknessMm;
    const pieces: ConstructionPiece[] = [
      {
        id: `${ctx.instanceId}:lat-e`,
        partKind: "lateral",
        label: "Lateral do nicho",
        box: box(0, 0, 0, t, p.heightMm, p.depthMm),
        thicknessMm: t,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:lat-d`,
        partKind: "lateral",
        label: "Lateral do nicho",
        box: box(p.widthMm - t, 0, 0, t, p.heightMm, p.depthMm),
        thicknessMm: t,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:base`,
        partKind: "base",
        label: "Base do nicho",
        box: box(t, 0, 0, p.widthMm - 2 * t, t, p.depthMm),
        thicknessMm: t,
        grain: "livre",
        finishId: p.finishId,
        substrate: "chapa",
      },
      {
        id: `${ctx.instanceId}:topo`,
        partKind: "tampo",
        label: "Topo do nicho",
        box: box(t, p.heightMm - t, 0, p.widthMm - 2 * t, t, p.depthMm),
        thicknessMm: t,
        grain: "livre",
        finishId: p.finishId,
        substrate: "chapa",
      },
    ];
    if (p.withBack) {
      pieces.push({
        id: `${ctx.instanceId}:fundo`,
        partKind: "fundo",
        label: "Fundo do nicho",
        box: box(t, t, 0, p.widthMm - 2 * t, p.heightMm - 2 * t, ctx.backThicknessMm || 6),
        thicknessMm: ctx.backThicknessMm || 6,
        grain: "livre",
        finishId: p.finishId,
        substrate: "chapa",
      });
    }
    const gap = (p.heightMm - 2 * t) / (p.shelves + 1);
    for (let i = 1; i <= p.shelves; i++) {
      pieces.push({
        id: `${ctx.instanceId}:prat-${i}`,
        partKind: "prateleira",
        label: `Prateleira ${i}`,
        box: box(t, round(t + gap * i), 0, p.widthMm - 2 * t, t, p.depthMm - 5),
        thicknessMm: t,
        grain: "livre",
        finishId: p.finishId,
        substrate: "chapa",
      });
    }
    return {
      componentId: "nicho",
      instanceId: ctx.instanceId,
      envelope: box(0, 0, 0, p.widthMm, p.heightMm, p.depthMm),
      pieces,
      hardware: p.ledStrip
        ? [{ id: "led", kind: "perfil", qty: 1, notes: "fita LED + perfil de embutir" }]
        : [],
      motions: [],
      warnings: [],
    };
  },
};

export const INTERIOR_COMPONENTS = [drawer, shelf, divider, hangerRod, topBox, niche] as const;
