/**
 * Componentes ESTRUTURAIS: rodapé, tampo, lateral, fundo, base e painel.
 */
import type { ConstructionComponent, ConstructionPiece, ConstructionWarning } from "../types";
import type {
  BackParams,
  BaseParams,
  PanelParams,
  PlinthParams,
  SideParams,
  TopParams,
} from "../params";
import { box, clamp, grainOf, intIn, positive, round, unionBox, warn } from "../geometry";

/* ────────────────────────────────  RODAPÉ  ──────────────────────────────── */

export const plinth: ConstructionComponent<PlinthParams> = {
  id: "rodape",
  label: "Rodapé",
  family: "estrutura",
  description: "Sapata frontal recuada, removível ou fixa.",
  motionKind: "static",
  defaults: {
    widthMm: 1200,
    heightMm: 100,
    thicknessMm: 18,
    recessMm: 50,
    removable: true,
    materialId: "mdf-18",
    finishId: "preto-tx",
    edge: "pvc-0-45",
    grain: "horizontal",
  },
  normalize(p, ctx) {
    const d = plinth.defaults;
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 100, 6000),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 30, 300),
      thicknessMm: clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 9, 30),
      recessMm: clamp(p.recessMm ?? d.recessMm, 0, 200),
      removable: p.removable ?? d.removable,
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, "horizontal"),
    };
  },
  build(p, ctx) {
    return {
      componentId: "rodape",
      instanceId: ctx.instanceId,
      envelope: box(0, 0, 0, p.widthMm, p.heightMm, p.thicknessMm),
      pieces: [
        {
          id: `${ctx.instanceId}:rodape`,
          partKind: "rodape",
          label: "Rodapé",
          box: box(0, 0, p.recessMm, p.widthMm, p.heightMm, p.thicknessMm),
          thicknessMm: p.thicknessMm,
          grain: p.grain,
          finishId: p.finishId,
          substrate: "chapa",
          notes: p.removable ? "removível (clipe)" : "fixo",
        },
      ],
      hardware: p.removable
        ? [
            {
              id: "clipe",
              kind: "perfil",
              qty: Math.max(2, Math.round(p.widthMm / 500)),
              notes: "clipe de rodapé",
            },
          ]
        : [],
      motions: [],
      warnings: [],
    };
  },
};

/* ─────────────────────────────────  TAMPO  ──────────────────────────────── */

export const top: ConstructionComponent<TopParams> = {
  id: "tampo",
  label: "Tampo",
  family: "estrutura",
  description: "Chapa horizontal superior, com saliência frontal/lateral opcional.",
  motionKind: "static",
  defaults: {
    widthMm: 1200,
    heightMm: 25,
    depthMm: 600,
    thicknessMm: 25,
    overhangFrontMm: 20,
    overhangSideMm: 0,
    postformado: false,
    materialId: "mdf-25",
    finishId: "carvalho-natural",
    edge: "pvc-1-0",
    grain: "horizontal",
  },
  normalize(p, ctx) {
    const d = top.defaults;
    const t = clamp(positive(p.thicknessMm, d.thicknessMm), 12, 60);
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 200, 6000),
      heightMm: t,
      depthMm: clamp(positive(p.depthMm, d.depthMm), 200, 1200),
      thicknessMm: t,
      overhangFrontMm: clamp(p.overhangFrontMm ?? d.overhangFrontMm, 0, 120),
      overhangSideMm: clamp(p.overhangSideMm ?? d.overhangSideMm, 0, 120),
      postformado: p.postformado ?? d.postformado,
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, "horizontal"),
    };
  },
  build(p, ctx) {
    const w = p.widthMm + p.overhangSideMm * 2;
    const dpt = p.depthMm + p.overhangFrontMm;
    return {
      componentId: "tampo",
      instanceId: ctx.instanceId,
      envelope: box(-p.overhangSideMm, 0, 0, w, p.thicknessMm, dpt),
      pieces: [
        {
          id: `${ctx.instanceId}:tampo`,
          partKind: "tampo",
          label: p.postformado ? "Tampo postformado" : "Tampo",
          box: box(-p.overhangSideMm, 0, 0, w, p.thicknessMm, dpt),
          thicknessMm: p.thicknessMm,
          grain: p.grain,
          finishId: p.finishId,
          substrate: "chapa",
        },
      ],
      hardware: [],
      motions: [],
      warnings:
        w > 3000 ? [warn("tampo-emenda", "Tampo acima de 3000 mm — prever emenda de chapa.")] : [],
    };
  },
};

/* ────────────────────────────────  LATERAL  ─────────────────────────────── */

export const side: ConstructionComponent<SideParams> = {
  id: "lateral",
  label: "Lateral",
  family: "estrutura",
  description: "Chapa vertical estrutural, com furação de sistema opcional.",
  motionKind: "static",
  defaults: {
    widthMm: 18,
    heightMm: 700,
    depthMm: 560,
    thicknessMm: 18,
    side: "esquerda",
    furada: true,
    rowPitchMm: 32,
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-0-45",
    grain: "vertical",
  },
  normalize(p, ctx) {
    const d = side.defaults;
    const t = clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 9, 40);
    return {
      widthMm: t,
      heightMm: clamp(positive(p.heightMm, d.heightMm), 100, 3000),
      depthMm: clamp(positive(p.depthMm, d.depthMm), 100, 1000),
      thicknessMm: t,
      side: p.side ?? d.side,
      furada: p.furada ?? d.furada,
      rowPitchMm: clamp(p.rowPitchMm ?? d.rowPitchMm, 16, 96),
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, "vertical"),
    };
  },
  build(p, ctx) {
    const holes = p.furada ? Math.max(0, Math.floor((p.heightMm - 100) / p.rowPitchMm) * 2) : 0;
    return {
      componentId: "lateral",
      instanceId: ctx.instanceId,
      envelope: box(0, 0, 0, p.thicknessMm, p.heightMm, p.depthMm),
      pieces: [
        {
          id: `${ctx.instanceId}:lateral`,
          partKind: "lateral",
          label: `Lateral ${p.side}`,
          box: box(0, 0, 0, p.thicknessMm, p.heightMm, p.depthMm),
          thicknessMm: p.thicknessMm,
          grain: p.grain,
          finishId: p.finishId,
          substrate: "chapa",
          notes: p.furada ? `sistema ${p.rowPitchMm} mm • ${holes} furos` : undefined,
        },
      ],
      hardware: [],
      motions: [],
      warnings: [],
    };
  },
};

/* ─────────────────────────────────  FUNDO  ──────────────────────────────── */

export const back: ConstructionComponent<BackParams> = {
  id: "fundo",
  label: "Fundo",
  family: "estrutura",
  description: "Chapa traseira — pregada, encaixada, em canal ou rebaixada.",
  motionKind: "static",
  defaults: {
    widthMm: 1200,
    heightMm: 700,
    depthMm: 6,
    thicknessMm: 6,
    mounting: "encaixado",
    materialId: "mdf-6",
    finishId: "branco-tx",
    edge: "sem-fita",
    grain: "livre",
  },
  normalize(p, ctx) {
    const d = back.defaults;
    const t = clamp(positive(p.thicknessMm, ctx.backThicknessMm || d.thicknessMm), 3, 18);
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 100, 6000),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 100, 3000),
      depthMm: t,
      thicknessMm: t,
      mounting: p.mounting ?? d.mounting,
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, "livre"),
    };
  },
  build(p, ctx) {
    const inset = p.mounting === "rebaixado" ? ctx.thicknessMm : p.mounting === "encaixado" ? 8 : 0;
    return {
      componentId: "fundo",
      instanceId: ctx.instanceId,
      envelope: box(0, 0, 0, p.widthMm, p.heightMm, p.thicknessMm),
      pieces: [
        {
          id: `${ctx.instanceId}:fundo`,
          partKind: "fundo",
          label: "Fundo",
          box: box(inset, inset, 0, p.widthMm - inset * 2, p.heightMm - inset * 2, p.thicknessMm),
          thicknessMm: p.thicknessMm,
          grain: p.grain,
          finishId: p.finishId,
          substrate: "chapa",
          notes: p.mounting,
        },
      ],
      hardware: [],
      motions: [],
      warnings:
        p.widthMm > 1800 && p.thicknessMm <= 6
          ? [warn("fundo-fino", "Fundo largo com 6 mm — prever travessa de reforço.")]
          : [],
    };
  },
};

/* ─────────────────────────────────  BASE  ───────────────────────────────── */

export const baseBoard: ConstructionComponent<BaseParams> = {
  id: "base",
  label: "Base",
  family: "estrutura",
  description: "Chapa horizontal inferior do módulo, com tipo de apoio.",
  motionKind: "static",
  defaults: {
    widthMm: 1200,
    heightMm: 18,
    depthMm: 560,
    thicknessMm: 18,
    support: "pe-regulavel",
    materialId: "mdf-18",
    finishId: "branco-tx",
    edge: "pvc-0-45",
    grain: "livre",
  },
  normalize(p, ctx) {
    const d = baseBoard.defaults;
    const t = clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 9, 40);
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 100, 6000),
      heightMm: t,
      depthMm: clamp(positive(p.depthMm, d.depthMm), 100, 1000),
      thicknessMm: t,
      support: p.support ?? d.support,
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, "livre"),
    };
  },
  build(p, ctx) {
    const feet = p.support === "pe-regulavel" ? Math.max(4, Math.round(p.widthMm / 600) * 2) : 0;
    return {
      componentId: "base",
      instanceId: ctx.instanceId,
      envelope: box(0, 0, 0, p.widthMm, p.thicknessMm, p.depthMm),
      pieces: [
        {
          id: `${ctx.instanceId}:base`,
          partKind: "base",
          label: "Base",
          box: box(0, 0, 0, p.widthMm, p.thicknessMm, p.depthMm),
          thicknessMm: p.thicknessMm,
          grain: p.grain,
          finishId: p.finishId,
          substrate: "chapa",
          notes: p.support,
        },
      ],
      hardware: feet > 0 ? [{ id: "pe", kind: "perfil", qty: feet, notes: "pé regulável" }] : [],
      motions: [],
      warnings: [],
    };
  },
};

/* ─────────────────────────────────  PAINEL  ─────────────────────────────── */

export const panel: ConstructionComponent<PanelParams> = {
  id: "painel",
  label: "Painel",
  family: "frente",
  description: "Chapa livre (TV, cabeceira, revestimento) lisa, ripada ou canelada.",
  motionKind: "static",
  defaults: {
    widthMm: 2000,
    heightMm: 2400,
    depthMm: 18,
    thicknessMm: 18,
    treatment: "ripado",
    slats: 0,
    slatDepthMm: 18,
    orientation: "vertical",
    fixedRole: "painel-fixo",
    materialId: "mdf-18",
    finishId: "freijo",
    edge: "pvc-0-45",
    grain: "vertical",
  },
  normalize(p, ctx) {
    const d = panel.defaults;
    const t = clamp(positive(p.thicknessMm, ctx.thicknessMm || d.thicknessMm), 6, 40);
    return {
      widthMm: clamp(positive(p.widthMm, d.widthMm), 100, 8000),
      heightMm: clamp(positive(p.heightMm, d.heightMm), 100, 3200),
      depthMm: t,
      thicknessMm: t,
      treatment: p.treatment ?? d.treatment,
      slats: intIn(p.slats, 0, 200, d.slats),
      slatDepthMm: clamp(p.slatDepthMm ?? d.slatDepthMm, 5, 60),
      orientation: p.orientation ?? d.orientation,
      fixedRole: p.fixedRole ?? d.fixedRole,
      materialId: p.materialId ?? d.materialId,
      finishId: p.finishId ?? ctx.finishId ?? d.finishId,
      edge: p.edge ?? d.edge,
      grain: grainOf(p.grain, ctx.grain),
    };
  },
  build(p, ctx) {
    // Um painel é SEMPRE uma frente fixa: não tem mecanismo, não recebe
    // dobradiça e não responde a "Abrir portas". Emiti-lo como `porta`
    // (comportamento antigo) fazia o sistema tratá-lo como folha móvel.
    const isFiller = p.fixedRole === "tapa-vao";
    const pieces: ConstructionPiece[] = [
      {
        id: `${ctx.instanceId}:painel`,
        partKind: isFiller ? "tapa-vao" : "frente-fixa",
        frontRole: p.fixedRole,
        label:
          p.fixedRole === "aba-canto"
            ? "Aba fixa de canto"
            : isFiller
              ? "Tapa-vão"
              : "Painel fixo",
        box: box(0, 0, 0, p.widthMm, p.heightMm, p.thicknessMm),
        thicknessMm: p.thicknessMm,
        grain: p.grain,
        finishId: p.finishId,
        substrate: "chapa",
      },
    ];

    if (p.treatment === "ripado" || p.treatment === "canelado") {
      const pitch = p.treatment === "canelado" ? 30 : 60;
      const span = p.orientation === "vertical" ? p.widthMm : p.heightMm;
      const count = p.slats > 0 ? p.slats : Math.max(2, Math.floor(span / pitch));
      const slatW = round((span / count) * 0.6);
      for (let i = 0; i < count; i++) {
        const at = round(i * (span / count) + (span / count - slatW) / 2);
        pieces.push({
          id: `${ctx.instanceId}:ripa-${i + 1}`,
          partKind: "travessa",
          label: `Ripa ${i + 1}`,
          box:
            p.orientation === "vertical"
              ? box(at, 0, p.thicknessMm, slatW, p.heightMm, p.slatDepthMm)
              : box(0, at, p.thicknessMm, p.widthMm, slatW, p.slatDepthMm),
          thicknessMm: p.slatDepthMm,
          grain: p.orientation === "vertical" ? "vertical" : "horizontal",
          finishId: p.finishId,
          substrate: "chapa",
        });
      }
    }

    return {
      componentId: "painel",
      instanceId: ctx.instanceId,
      envelope: unionBox(pieces.map((x) => x.box)),
      pieces,
      hardware: [
        {
          id: "fixacao",
          kind: "perfil",
          qty: Math.max(2, Math.round(p.widthMm / 800)),
          notes: "fixação em parede",
        },
      ],
      motions: [],
      warnings: [],
    };
  },
};

export const STRUCTURE_COMPONENTS = [plinth, top, side, back, baseBoard, panel] as const;
