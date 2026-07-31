/**
 * RECEITAS DOS MÓDULOS DE LAVANDERIA.
 *
 * Nenhuma geometria nova é criada aqui: a receita apenas posiciona
 * componentes da Biblioteca Construtiva. Folgas, ferragens e rigs pertencem
 * exclusivamente aos componentes — igual roupeiro, gaveteiro, cozinha e
 * banheiro.
 *
 * O que é específico da lavanderia:
 *  • volumes técnicos de eletrodomésticos (envelope, abertura, ventilação,
 *    manutenção, água, esgoto e ponto elétrico);
 *  • hidráulica do tanque (reaproveitada do banheiro);
 *  • reserva vertical de vassouras;
 *  • cestos (basculante, deslizante, removível) e tábua de passar;
 *  • tapa-vão e rodabanca como peças reais.
 */
import type { AssemblySlot } from "../../construction";
import { makeFiller, fillerSlot } from "../filler";
import {
  applianceCenterMm,
  applianceEnvelopeMm,
  isTopLoader,
  normalizeAppliance,
  type LaundryAppliance,
} from "./appliances";
import { tubCentersMm, tubDropMm } from "./tub";
import {
  laundryHandle,
  LAUNDRY_MODULE_PROFILES,
  type LaundryModuleSpec,
} from "./spec";

export interface LaundryGeometry extends Record<string, number> {
  floorGapMm: number;
  plinthHeightMm: number;
  countertopThicknessMm: number;
  caseY0: number;
  caseHeightMm: number;
  caseDepthMm: number;
  innerWidthMm: number;
  interiorY0: number;
  interiorHeightMm: number;
  interiorDepthMm: number;
  frontZMm: number;
  topOfCaseMm: number;
  topOfCountertopMm: number;
}

export function laundryGeometry(spec: LaundryModuleSpec): LaundryGeometry {
  const { widthMm: W, heightMm: H, depthMm: D, thicknessMm: t, backThicknessMm: bt } = spec;
  const gap = spec.install === "suspenso" || spec.install === "pes" ? spec.floorGapMm : 0;
  const P = spec.install === "rodape" ? spec.plinth.heightMm : 0;
  const CT = spec.countertop.thicknessMm;

  const frontReserve = spec.opening === "correr" ? t + 12 : spec.opening === "aberto" ? 0 : t;
  const caseD = Math.max(100, D - frontReserve - spec.recessMm);
  const caseY0 = gap + P;
  const caseH = Math.max(80, H - P - CT);

  return {
    floorGapMm: gap,
    plinthHeightMm: P,
    countertopThicknessMm: CT,
    caseY0,
    caseHeightMm: caseH,
    caseDepthMm: caseD,
    innerWidthMm: Math.max(80, W - 2 * t),
    interiorY0: caseY0 + t,
    interiorHeightMm: Math.max(60, caseH - 2 * t),
    interiorDepthMm: Math.max(80, caseD - bt),
    frontZMm: caseD,
    topOfCaseMm: caseY0 + caseH,
    topOfCountertopMm: caseY0 + caseH + CT,
  };
}

/* ─────────────────────── aparelhos da composição ─────────────────────── */

/**
 * A torre é um CONJUNTO: máquina embaixo e secadora em cima. A ficha guarda
 * o aparelho "torre" como envelope total; aqui ele é aberto nos dois
 * aparelhos reais, cada um com o próprio volume técnico.
 */
export function laundryAppliances(spec: LaundryModuleSpec): readonly LaundryAppliance[] {
  if (spec.appliance.kind === "nenhum") return [];
  if (spec.appliance.kind !== "torre") return [spec.appliance];
  return [
    normalizeAppliance({ kind: "lavadora-frontal", hingeSide: spec.appliance.hingeSide }),
    normalizeAppliance({ kind: "secadora", hingeSide: spec.appliance.hingeSide }),
  ];
}

/** Altura interna exigida pelo conjunto de aparelhos deste módulo. */
export function appliancesStackHeightMm(spec: LaundryModuleSpec): number {
  const list = laundryAppliances(spec);
  if (list.length === 0) return 0;
  const shelfCount = Math.max(0, list.length - 1);
  return (
    list.reduce((a, x) => a + applianceEnvelopeMm(x).heightMm, 0) + shelfCount * spec.thicknessMm
  );
}

/* ─────────────────────────── volumes técnicos ────────────────────────── */

export type LaundryReservationKind =
  | "cuba"
  | "sifao"
  | "valvula"
  | "tubulacao"
  | "agua"
  | "esgoto"
  | "aparelho"
  | "abertura-porta"
  | "abertura-superior"
  | "ventilacao"
  | "manutencao"
  | "eletrico"
  | "vassoura"
  | "cesto"
  | "tabua";

export interface LaundryReservation {
  readonly id: string;
  readonly kind: LaundryReservationKind;
  readonly box: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly width: number;
    readonly height: number;
    readonly depth: number;
  };
  readonly note: string;
}

/** Base vertical de cada aparelho empilhado no módulo. */
export function applianceStackY(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
): readonly { readonly appliance: LaundryAppliance; readonly y0: number }[] {
  const list = laundryAppliances(spec);
  const out: { appliance: LaundryAppliance; y0: number }[] = [];
  let y = g.interiorY0;
  for (const a of list) {
    out.push({ appliance: a, y0: Math.round(y) });
    y += applianceEnvelopeMm(a).heightMm + spec.thicknessMm;
  }
  return out;
}

/**
 * Volumes que NENHUMA peça pode invadir. O desenho realista do aparelho e
 * da louça é outro assunto: aqui o que precisa estar correto é o volume.
 */
export function laundryReservedVolumes(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
): readonly LaundryReservation[] {
  const out: LaundryReservation[] = [];

  /* ── tanque (hidráulica reaproveitada do banheiro) ── */
  if (spec.tub.type !== "nenhum") {
    const s = spec.tub;
    const drop = tubDropMm(s);
    tubCentersMm(s, spec.widthMm).forEach((cx, i) => {
      const sfx = i > 0 ? `-${i + 1}` : "";
      const zBack = Math.max(0, g.caseDepthMm - s.zMm - s.depthMm);
      out.push({
        id: `cuba${sfx}`,
        kind: "cuba",
        box: {
          x: Math.round(cx - s.widthMm / 2),
          y: Math.max(g.caseY0, g.topOfCaseMm - Math.max(drop, s.heightMm)),
          z: zBack,
          width: s.widthMm,
          height: Math.max(drop, s.heightMm),
          depth: s.depthMm,
        },
        note: `volume do tanque ${s.type}`,
      });
      const sifX = Math.round(cx - s.siphonMm / 2);
      out.push({
        id: `sifao${sfx}`,
        kind: "sifao",
        box: {
          x: sifX,
          y: Math.max(g.caseY0, g.topOfCaseMm - s.hydraulicHeightMm),
          z: Math.max(0, g.caseDepthMm - s.zMm - s.siphonMm),
          width: s.siphonMm,
          height: s.hydraulicHeightMm,
          depth: s.siphonMm,
        },
        note: "curva/sifão do tanque — nenhuma peça pode atravessar",
      });
      out.push({
        id: `valvula${sfx}`,
        kind: "valvula",
        box: {
          x: Math.round(cx - 60),
          y: g.topOfCaseMm - Math.max(drop, s.heightMm) - 80,
          z: zBack,
          width: 120,
          height: 80,
          depth: 120,
        },
        note: "válvula e ligação flexível do tanque",
      });
      out.push({
        id: `agua${sfx}`,
        kind: "agua",
        box: { x: Math.round(cx - 150), y: g.caseY0, z: 0, width: 300, height: g.caseHeightMm, depth: 100 },
        note: "entrada de água do tanque",
      });
      out.push({
        id: `esgoto${sfx}`,
        kind: "esgoto",
        box: { x: sifX - 20, y: g.caseY0, z: 0, width: s.siphonMm + 40, height: g.caseHeightMm, depth: 120 },
        note: "saída de esgoto do tanque",
      });
    });
  }

  /* ── eletrodomésticos ── */
  applianceStackY(spec, g).forEach(({ appliance: a, y0 }, i) => {
    const sfx = i > 0 ? `-${i + 1}` : "";
    const env = applianceEnvelopeMm(a);
    const cx = applianceCenterMm(a, spec.widthMm);
    const x = Math.round(cx - a.widthMm / 2);
    const zBack = Math.max(a.backClearanceMm, a.ventilation ? a.ventClearanceMm : 0);

    out.push({
      id: `aparelho${sfx}`,
      kind: "aparelho",
      box: { x, y: y0, z: zBack, width: a.widthMm, height: a.heightMm, depth: a.depthMm },
      note: `${a.label} — envelope do corpo`,
    });

    if (a.doorOpening === "frontal") {
      out.push({
        id: `abertura${sfx}`,
        kind: "abertura-porta",
        box: {
          x,
          y: y0,
          z: zBack + a.depthMm,
          width: a.widthMm,
          height: a.heightMm,
          depth: Math.max(0, g.frontZMm - (zBack + a.depthMm)) + a.doorArcMm,
        },
        note: `${a.label} — curso da porta frontal (${a.doorArcMm} mm)`,
      });
    }

    if (a.doorOpening === "superior") {
      out.push({
        id: `tampa${sfx}`,
        kind: "abertura-superior",
        box: {
          x,
          y: y0 + a.heightMm,
          z: zBack,
          width: a.widthMm,
          height: a.topLidMm,
          depth: a.depthMm,
        },
        note: `${a.label} — abertura da tampa (${a.topLidMm} mm livres acima)`,
      });
    }

    out.push({
      id: `manutencao${sfx}`,
      kind: "manutencao",
      box: { x, y: y0, z: g.frontZMm, width: a.widthMm, height: a.heightMm, depth: a.serviceMm },
      note: `${a.label} — área frontal de manutenção`,
    });

    if (a.ventilation) {
      out.push({
        id: `ventilacao${sfx}`,
        kind: "ventilacao",
        box: {
          x,
          y: y0,
          z: 0,
          width: a.widthMm,
          height: env.heightMm,
          depth: Math.max(a.ventClearanceMm, a.backClearanceMm),
        },
        note: `${a.label} — ventilação traseira (${a.ventClearanceMm} mm)`,
      });
    }

    if (a.water) {
      out.push({
        id: `agua-aparelho${sfx}`,
        kind: "agua",
        box: { x, y: y0, z: 0, width: Math.min(300, a.widthMm), height: a.heightMm, depth: 90 },
        note: `${a.label} — entrada de água (mangueira sem esmagamento)`,
      });
    }
    if (a.drain) {
      out.push({
        id: `esgoto-aparelho${sfx}`,
        kind: "esgoto",
        box: { x: x + a.widthMm - 200, y: y0, z: 0, width: 200, height: a.heightMm, depth: 90 },
        note: `${a.label} — saída de água / esgoto`,
      });
    }
    if (a.power) {
      out.push({
        id: `eletrico${sfx}`,
        kind: "eletrico",
        box: { x: x + a.widthMm - 150, y: y0 + 200, z: 0, width: 150, height: 300, depth: 80 },
        note: `${a.label} — ponto elétrico`,
      });
    }
  });

  /* ── vassouras ── */
  if (spec.broomZoneMm > 0) {
    out.push({
      id: "vassoura",
      kind: "vassoura",
      box: {
        x: spec.thicknessMm,
        y: g.interiorY0,
        z: spec.backThicknessMm,
        width: g.innerWidthMm,
        height: Math.min(spec.broomZoneMm, g.interiorHeightMm),
        depth: Math.max(60, g.interiorDepthMm - 20),
      },
      note: `área vertical livre para vassouras (${spec.broomZoneMm} mm)`,
    });
  }

  /* ── cestos ── */
  if (spec.basket !== "nenhum" && spec.baskets > 0) {
    const w = Math.max(120, Math.floor(g.innerWidthMm / spec.baskets) - 20);
    for (let i = 0; i < spec.baskets; i += 1) {
      out.push({
        id: `cesto-${i + 1}`,
        kind: "cesto",
        box: {
          x: spec.thicknessMm + i * (w + 20),
          y: g.interiorY0,
          z: spec.backThicknessMm + 20,
          width: w,
          height: Math.min(420, g.interiorHeightMm),
          depth: Math.max(200, g.interiorDepthMm - 60),
        },
        note: `cesto ${spec.basket} — volume técnico reservado`,
      });
    }
  }

  /* ── tábua de passar ── */
  if (spec.board !== "nenhum") {
    out.push({
      id: "tabua",
      kind: "tabua",
      box: {
        x: spec.thicknessMm,
        y: g.interiorY0,
        z: spec.backThicknessMm,
        width: g.innerWidthMm,
        height: spec.board === "gaveta" ? 120 : Math.min(1300, g.interiorHeightMm),
        depth: Math.max(120, g.interiorDepthMm - 20),
      },
      note: `tábua de passar (${spec.board})`,
    });
  }

  return out;
}

/** Faixa em X ocupada pelo sifão do tanque. */
export function tubSiphonSpansMm(spec: LaundryModuleSpec): readonly { x0: number; x1: number }[] {
  if (spec.tub.type === "nenhum") return [];
  return tubCentersMm(spec.tub, spec.widthMm).map((cx) => ({
    x0: Math.round(cx - spec.tub.siphonMm / 2),
    x1: Math.round(cx + spec.tub.siphonMm / 2),
  }));
}

/** Profundidade traseira reservada a água/esgoto — peças internas nascem recuadas. */
export function laundryBackZoneMm(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
  marginMm = 5,
): number {
  let zone = 0;
  for (const r of laundryReservedVolumes(spec, g)) {
    if (r.kind !== "agua" && r.kind !== "esgoto" && r.kind !== "ventilacao") continue;
    zone = Math.max(zone, r.box.z + r.box.depth);
  }
  if (zone === 0) return 0;
  return Math.min(Math.max(0, g.caseDepthMm - 150), Math.round(zone + marginMm));
}

/** Faixas em X que o mecanismo não pode atravessar (sifão + válvula). */
export function laundryHydraulicSpansMm(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
  marginMm = 20,
): readonly { x0: number; x1: number }[] {
  if (spec.tub.type === "nenhum") return [];
  const raw = laundryReservedVolumes(spec, g)
    .filter((r) => r.kind === "sifao" || r.kind === "valvula")
    .map((r) => ({ x0: r.box.x - marginMm, x1: r.box.x + r.box.width + marginMm }))
    .sort((a, b) => a.x0 - b.x0);
  const merged: { x0: number; x1: number }[] = [];
  for (const s of raw) {
    const last = merged[merged.length - 1];
    if (last && s.x0 <= last.x1) last.x1 = Math.max(last.x1, s.x1);
    else merged.push({ ...s });
  }
  return merged.map((s) => ({ x0: Math.round(s.x0), x1: Math.round(s.x1) }));
}

/* ───────────────────────── decisões registradas ──────────────────────── */

export type LaundryDecisionAction =
  | "gaveta-em-u"
  | "gaveta-reduzida"
  | "gaveta-vira-porta"
  | "prateleira-removida"
  | "prateleira-deslocada"
  | "divisoria-deslocada"
  | "fundo-recortado"
  | "fundo-aberto"
  | "tampo-removido"
  | "cesto-convertido"
  | "tabua-bloqueada"
  | "modulo-descartado";

export interface LaundryDecision {
  readonly id: string;
  readonly action: LaundryDecisionAction;
  readonly reason: string;
}

export interface LaundrySlotsResult {
  readonly slots: readonly AssemblySlot[];
  /** Grupos de slots que abrem como UM mecanismo (gaveta em U, cesto, tábua). */
  readonly mechanisms: readonly { readonly groupId: string; readonly slotIds: readonly string[] }[];
  readonly decisions: readonly LaundryDecision[];
  readonly warnings: readonly string[];
  readonly fillers: readonly string[];
}

/* ─────────────────────────── blocos reutilizáveis ─────────────────────── */

function caseSlots(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
  opts: { withTop?: boolean; closedBack?: boolean } = {},
): { slots: AssemblySlot[]; decisions: LaundryDecision[] } {
  const { widthMm: W, thicknessMm: t, backThicknessMm: bt, finishId } = spec;
  const slots: AssemblySlot[] = [];
  const decisions: LaundryDecision[] = [];

  if (g.plinthHeightMm > 0) {
    slots.push({
      id: "rodape",
      component: "rodape",
      at: [0, 0, 0],
      role: "rodapé",
      params: {
        widthMm: W,
        heightMm: g.plinthHeightMm,
        thicknessMm: t,
        recessMm: spec.plinth.recessMm,
        removable: spec.plinth.removable,
        finishId: spec.plinth.finishId || finishId,
      },
    });
  }

  slots.push(
    {
      id: "lateral-e",
      component: "lateral",
      at: [0, g.caseY0, 0],
      role: "lateral esquerda",
      params: { heightMm: g.caseHeightMm, depthMm: g.caseDepthMm, thicknessMm: t, side: "esquerda", finishId },
    },
    {
      id: "lateral-d",
      component: "lateral",
      at: [W - t, g.caseY0, 0],
      role: "lateral direita",
      params: { heightMm: g.caseHeightMm, depthMm: g.caseDepthMm, thicknessMm: t, side: "direita", finishId },
    },
    {
      id: "base",
      component: "base",
      at: [t, g.caseY0, 0],
      role: "base",
      params: {
        widthMm: g.innerWidthMm,
        depthMm: g.interiorDepthMm,
        thicknessMm: t,
        support: g.plinthHeightMm > 0 ? "rodape" : "suspenso",
        finishId,
      },
    },
  );

  /* Fundo: ventilação exigida = fundo NUNCA totalmente fechado; hidráulica
   * do tanque = fundo RECORTADO em folhas laterais à reserva. */
  const ventilated = laundryAppliances(spec).some((a) => a.ventilation);
  const closed = (opts.closedBack ?? spec.closedBack) && !ventilated;
  if (ventilated) {
    decisions.push({
      id: "fundo",
      action: "fundo-aberto",
      reason: "aparelho com exigência de ventilação: fundo não pode fechar a área técnica",
    });
  }
  if (closed) {
    const spans = tubSiphonSpansMm(spec);
    if (spans.length === 0) {
      slots.push({
        id: "fundo",
        component: "fundo",
        at: [0, g.caseY0, 0],
        role: "fundo",
        params: { widthMm: W, heightMm: g.caseHeightMm, thicknessMm: bt, mounting: "encaixado", finishId },
      });
    } else {
      let pieces: { x0: number; x1: number }[] = [{ x0: 0, x1: W }];
      for (const s of spans) {
        const sx0 = Math.max(0, Math.min(W, s.x0));
        const sx1 = Math.max(0, Math.min(W, s.x1));
        const next: { x0: number; x1: number }[] = [];
        for (const p of pieces) {
          if (sx1 <= p.x0 || sx0 >= p.x1) next.push(p);
          else {
            if (sx0 - p.x0 > 60) next.push({ x0: p.x0, x1: Math.min(p.x1, sx0 - 20) });
            if (p.x1 - sx1 > 60) next.push({ x0: Math.max(p.x0, sx1 + 20), x1: p.x1 });
          }
        }
        pieces = next.filter((p) => p.x1 - p.x0 >= 20 && p.x0 >= 0 && p.x1 <= W);
      }
      pieces.forEach((p, i) => {
        slots.push({
          id: `fundo-${i + 1}`,
          component: "fundo",
          at: [p.x0, g.caseY0, 0],
          role: "fundo (recorte hidráulico)",
          params: {
            widthMm: p.x1 - p.x0,
            heightMm: g.caseHeightMm,
            thicknessMm: bt,
            mounting: "encaixado",
            finishId,
          },
        });
      });
      decisions.push({
        id: "fundo",
        action: "fundo-recortado",
        reason: "fundo dividido para liberar a hidráulica do tanque",
      });
    }
  }

  if (opts.withTop !== false) {
    slots.push({
      id: "tampo-estrutural",
      component: "tampo",
      at: [t, g.caseY0 + g.caseHeightMm - t, 0],
      role: "tampo estrutural",
      params: {
        widthMm: g.innerWidthMm,
        depthMm: g.caseDepthMm,
        thicknessMm: t,
        overhangFrontMm: 0,
        overhangSideMm: 0,
        finishId,
      },
    });
  }

  return { slots, decisions };
}

/** Bancada + rodabanca + saia + frontão. Rodabanca é ACABAMENTO. */
function countertopSlots(spec: LaundryModuleSpec, g: LaundryGeometry): AssemblySlot[] {
  const ct = spec.countertop;
  if (ct.material === "nenhum" || ct.thicknessMm <= 0) return [];
  const recorte = [
    ct.cutout !== "nenhum" ? `recorte ${ct.cutout}` : "",
    ct.faucetCutout ? "recorte torneira" : "",
  ]
    .filter(Boolean)
    .join(" • ");

  const slots: AssemblySlot[] = [
    {
      id: "tampo-bancada",
      component: "tampo",
      at: [-ct.overhangSideMm, g.topOfCaseMm, 0],
      role: `bancada ${ct.material}${recorte ? ` • ${recorte}` : ""}`,
      params: {
        widthMm: spec.widthMm + ct.overhangSideMm * 2,
        depthMm: spec.depthMm,
        thicknessMm: ct.thicknessMm,
        overhangFrontMm: ct.overhangFrontMm,
        overhangSideMm: 0,
        postformado: ct.material === "laminado",
        finishId: ct.finishId,
      },
    },
  ];

  if (ct.backsplashMm > 0) {
    slots.push({
      id: "rodabanca",
      component: "painel",
      at: [0, g.topOfCountertopMm, 0],
      role: "rodabanca",
      params: {
        widthMm: spec.widthMm,
        heightMm: ct.backsplashMm,
        depthMm: ct.thicknessMm,
        thicknessMm: ct.thicknessMm,
        treatment: "liso",
        fixedRole: "rodabanca",
        finishId: ct.finishId,
      },
    });
  }

  if (ct.frontonMm > 0) {
    slots.push({
      id: "frontao",
      component: "painel",
      at: [0, g.topOfCountertopMm, spec.depthMm - ct.thicknessMm],
      role: "frontão",
      params: {
        widthMm: spec.widthMm,
        heightMm: ct.frontonMm,
        depthMm: ct.thicknessMm,
        thicknessMm: ct.thicknessMm,
        treatment: "liso",
        fixedRole: "acabamento",
        finishId: ct.finishId,
      },
    });
  }

  if (ct.apronMm > 0) {
    slots.push({
      id: "saia",
      component: "painel",
      at: [0, g.topOfCaseMm - ct.apronMm, g.caseDepthMm],
      role: "saia da bancada",
      params: {
        widthMm: spec.widthMm,
        heightMm: ct.apronMm,
        depthMm: ct.thicknessMm,
        thicknessMm: ct.thicknessMm,
        treatment: "liso",
        fixedRole: "acabamento",
        finishId: ct.finishId,
      },
    });
  }

  return slots;
}

function doorSlots(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
  count = spec.doors,
  region: { y0: number; heightMm: number } = { y0: g.caseY0, heightMm: g.caseHeightMm },
  idPrefix = "porta",
): AssemblySlot[] {
  if (count <= 0) return [];
  const handle = laundryHandle(spec);
  const leafW = spec.widthMm / count;
  return Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}-${i + 1}`,
    component: "porta-abrir" as const,
    at: [i * leafW, region.y0, g.frontZMm] as [number, number, number],
    role: `porta ${i + 1}`,
    params: {
      widthMm: leafW,
      heightMm: region.heightMm,
      swing: count === 1 ? "direita" : i < count / 2 ? "esquerda" : "direita",
      hinge: "caneco-35",
      handle,
      opening: "softclose",
      substrate: "mdf",
      maxAngleDeg: 100,
      finishId: spec.finishId,
    },
  }));
}

function shelfSlots(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
  count: number,
  region: { y0: number; heightMm: number } = { y0: g.interiorY0, heightMm: g.interiorHeightMm },
  depthOverrideMm?: number,
  idPrefix = "prateleira",
): AssemblySlot[] {
  if (count <= 0) return [];
  const zone = laundryBackZoneMm(spec, g);
  const depthMm = depthOverrideMm ?? Math.max(100, g.interiorDepthMm - 20 - zone);
  const pitch = region.heightMm / (count + 1);
  return Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}-${i + 1}`,
    component: "prateleira" as const,
    at: [spec.thicknessMm, region.y0 + pitch * (i + 1), zone] as [number, number, number],
    role: `prateleira ${i + 1}`,
    params: {
      widthMm: g.innerWidthMm,
      depthMm,
      thicknessMm: spec.thicknessMm,
      positionMm: 0,
      fixed: false,
      loadKg: 25,
      finishId: spec.finishId,
    },
  }));
}

export function laundryDrawerHeights(count: number, regionMm: number, gapMm = 3): number[] {
  if (count <= 0) return [];
  const usable = Math.max(60 * count, regionMm - gapMm * (count - 1));
  if (count === 1) return [usable];
  const weights = Array.from({ length: count }, (_, i) => 1 + (0.7 * (count - 1 - i)) / (count - 1));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => (usable * w) / total);
}

interface DrawerBuild {
  readonly slots: AssemblySlot[];
  readonly mechanisms: { groupId: string; slotIds: string[] }[];
  readonly decisions: LaundryDecision[];
  doorsInstead: number;
}

function plainDrawer(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
  id: string,
  role: string,
  x: number,
  widthMm: number,
  y: number,
  heightMm: number,
  depthMm: number,
  handle: ReturnType<typeof laundryHandle>,
): AssemblySlot {
  const zone = laundryBackZoneMm(spec, g);
  return {
    id,
    component: "gaveta",
    at: [x, y, Math.max(spec.backThicknessMm + zone, g.caseDepthMm - depthMm)],
    role,
    params: {
      widthMm,
      heightMm,
      depthMm: Math.min(depthMm, Math.max(150, g.caseDepthMm - zone - spec.backThicknessMm)),
      thicknessMm: Math.min(15, spec.thicknessMm),
      bottomThicknessMm: spec.backThicknessMm,
      slide: "oculta-softclose",
      opening: "softclose",
      withFront: true,
      frontFit: "sobreposta",
      capacityKg: heightMm > 250 ? 35 : 25,
      handle,
      finishId: spec.finishId,
    },
  };
}

/**
 * Gavetas. Quando a hidráulica do tanque atravessa a gaveta, a decisão é
 * previsível e registrada: gaveta em U → gaveta reduzida → gaveta vira porta.
 */
function drawerSlots(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
  count: number,
  region: { y0: number; heightMm: number } = { y0: g.interiorY0, heightMm: g.interiorHeightMm },
): DrawerBuild {
  const out: DrawerBuild = { slots: [], mechanisms: [], decisions: [], doorsInstead: 0 };
  if (count <= 0) return out;

  const handle = laundryHandle(spec);
  const t = spec.thicknessMm;
  const gap = 3;
  const heights = laundryDrawerHeights(count, region.heightMm, gap);
  const backZone = laundryBackZoneMm(spec, g);
  const fullDepth = Math.max(200, g.interiorDepthMm - 20 - backZone);
  const spans = laundryHydraulicSpansMm(spec, g);
  const interiorX0 = t;
  const interiorX1 = spec.widthMm - t;
  const minLeg = spec.minUDrawerLegMm;

  const legRanges = (): { x0: number; x1: number }[] => {
    const list: { x0: number; x1: number }[] = [];
    let cursor = interiorX0;
    for (const s of spans) {
      const x1 = Math.min(interiorX1, Math.max(cursor, s.x0));
      if (x1 - cursor > 0) list.push({ x0: cursor, x1 });
      cursor = Math.max(cursor, Math.min(interiorX1, s.x1));
    }
    if (interiorX1 - cursor > 0) list.push({ x0: cursor, x1: interiorX1 });
    return list;
  };

  let y = region.y0;
  heights.forEach((h, i) => {
    const id = `gaveta-${i + 1}`;
    const top = y + h;
    const inReserve =
      spec.tub.type !== "nenhum" &&
      spans.length > 0 &&
      top > g.topOfCaseMm - spec.tub.hydraulicHeightMm;
    const hit = inReserve ? spans[0] : undefined;

    if (!hit) {
      out.slots.push(
        plainDrawer(spec, g, id, `gaveta ${i + 1}`, interiorX0, g.innerWidthMm, y, h, fullDepth, handle),
      );
      y += h + gap;
      return;
    }

    const legs = legRanges().filter((l) => l.x1 - l.x0 >= minLeg);
    const siphonDepth = spec.tub.siphonMm + 40;
    const shallow = g.interiorDepthMm - siphonDepth - backZone;

    if (spec.allowUDrawer && legs.length >= 2) {
      const groupId = `gaveta-u-${i + 1}`;
      const boxDepth = fullDepth;
      const zBox = Math.max(spec.backThicknessMm + backZone, g.caseDepthMm - boxDepth);
      const boxSlots: AssemblySlot[] = legs.map((l, k) => ({
        id: `${groupId}-caixa-${k + 1}`,
        component: "gaveta",
        at: [l.x0, y, zBox],
        role: `gaveta em U ${i + 1} — caixa ${k + 1}`,
        params: {
          widthMm: l.x1 - l.x0,
          heightMm: h,
          depthMm: Math.min(boxDepth, g.caseDepthMm - zBox),
          thicknessMm: Math.min(15, t),
          bottomThicknessMm: spec.backThicknessMm,
          slide: "oculta-softclose",
          opening: "softclose",
          withFront: false,
          frontFit: "sobreposta",
          capacityKg: 20,
          handle,
          finishId: spec.finishId,
        },
      }));
      out.slots.push(
        ...boxSlots,
        {
          id: `${groupId}-frente`,
          component: "frente-gaveta",
          at: [0, y, g.frontZMm],
          role: `gaveta em U ${i + 1} — frente única`,
          params: {
            widthMm: spec.widthMm,
            heightMm: h,
            thicknessMm: t,
            handle,
            substrate: "mdf",
            mounting: "sobreposta",
            finishId: spec.finishId,
          },
        },
      );
      out.mechanisms.push({ groupId, slotIds: [...boxSlots.map((s) => s.id), `${groupId}-frente`] });
      out.decisions.push({
        id,
        action: "gaveta-em-u",
        reason: `reserva hidráulica em ${hit.x0}–${hit.x1} mm: frente única, ${boxSlots.length} caixa(s), curso único`,
      });
      y += h + gap;
      return;
    }

    if (shallow >= 250) {
      out.slots.push(
        plainDrawer(spec, g, id, `gaveta ${i + 1} (reduzida)`, interiorX0, g.innerWidthMm, y, h, shallow, handle),
      );
      out.decisions.push({
        id,
        action: "gaveta-reduzida",
        reason: `profundidade reduzida para ${Math.round(shallow)} mm — desvia do sifão e da reserva traseira`,
      });
      y += h + gap;
      return;
    }

    out.doorsInstead += 1;
    out.decisions.push({
      id,
      action: "gaveta-vira-porta",
      reason: `sem curso livre nem perna ≥ ${minLeg} mm para gaveta em U`,
    });
    y += h + gap;
  });

  return out;
}

/* ─────────────────────────────── cestos ──────────────────────────────── */

interface BasketBuild {
  readonly slots: AssemblySlot[];
  readonly mechanisms: { groupId: string; slotIds: string[] }[];
  readonly decisions: LaundryDecision[];
  readonly warnings: string[];
}

/**
 * Cestos. A distinção é explícita:
 *  • peça estrutural (caixa/nicho) — sem rig;
 *  • frente móvel (basculante = dobradiça / deslizante = corrediça);
 *  • cesto técnico (volume reservado, não é marcenaria).
 */
function basketSlots(spec: LaundryModuleSpec, g: LaundryGeometry): BasketBuild {
  const out: BasketBuild = { slots: [], mechanisms: [], decisions: [], warnings: [] };
  if (spec.basket === "nenhum" || spec.baskets <= 0) return out;
  const handle = laundryHandle(spec);
  const t = spec.thicknessMm;
  const backZone = laundryBackZoneMm(spec, g);
  const depth = Math.max(200, g.interiorDepthMm - 40 - backZone);
  const heightMm = Math.min(Math.max(300, g.interiorHeightMm * 0.75), g.interiorHeightMm);

  if (spec.basket === "removivel" || spec.basket === "nicho") {
    /* Cesto solto: só estrutura e volume reservado — nada se move. */
    out.slots.push({
      id: "nicho-cesto",
      component: "nicho",
      at: [t, g.interiorY0, backZone],
      role: `nicho para cesto ${spec.basket}`,
      params: {
        widthMm: g.innerWidthMm,
        heightMm: Math.min(heightMm, 2000),
        depthMm: Math.min(depth, 800),
        thicknessMm: t,
        withBack: false,
        ledStrip: false,
        shelves: Math.max(0, spec.baskets - 1),
        finishId: spec.finishId,
      },
    });
    return out;
  }

  if (spec.basket === "deslizante") {
    const groupId = "cesto-deslizante";
    out.slots.push(
      {
        id: `${groupId}-caixa`,
        component: "gaveta",
        at: [t, g.interiorY0, Math.max(spec.backThicknessMm + backZone, g.caseDepthMm - depth)],
        role: "cesto deslizante — caixa técnica",
        params: {
          widthMm: g.innerWidthMm,
          heightMm: Math.min(heightMm, 600),
          depthMm: Math.min(depth, 800),
          thicknessMm: Math.min(15, t),
          bottomThicknessMm: spec.backThicknessMm,
          slide: "telescopica",
          opening: "softclose",
          withFront: false,
          frontFit: "sobreposta",
          capacityKg: 25,
          handle,
          finishId: spec.finishId,
        },
      },
      {
        id: `${groupId}-frente`,
        component: "frente-gaveta",
        at: [0, g.caseY0, g.frontZMm],
        role: "cesto deslizante — frente móvel",
        params: {
          widthMm: spec.widthMm,
          heightMm: g.caseHeightMm,
          thicknessMm: t,
          handle,
          substrate: "mdf",
          mounting: "sobreposta",
          finishId: spec.finishId,
        },
      },
    );
    out.mechanisms.push({ groupId, slotIds: [`${groupId}-caixa`, `${groupId}-frente`] });
    return out;
  }

  /* Basculante: frente única com dobradiça inferior + volume do cesto. */
  out.slots.push({
    id: "cesto-basculante-frente",
    component: "porta-abrir",
    at: [0, g.caseY0, g.frontZMm],
    role: "cesto basculante — frente móvel",
    params: {
      widthMm: spec.widthMm,
      heightMm: g.caseHeightMm,
      swing: "esquerda",
      hinge: "caneco-35",
      handle,
      opening: "softclose",
      substrate: "mdf",
      maxAngleDeg: 85,
      finishId: spec.finishId,
    },
  });
  return out;
}

/* ────────────────────────── tábua de passar ──────────────────────────── */

interface BoardBuild {
  readonly slots: AssemblySlot[];
  readonly mechanisms: { groupId: string; slotIds: string[] }[];
  readonly decisions: LaundryDecision[];
}

/** Curso frontal mínimo para a tábua retrátil sair da gaveta. */
export const BOARD_TRAVEL_MM = 420;

function boardSlots(spec: LaundryModuleSpec, g: LaundryGeometry): BoardBuild {
  const out: BoardBuild = { slots: [], mechanisms: [], decisions: [] };
  if (spec.board === "nenhum") return out;
  const t = spec.thicknessMm;
  const backZone = laundryBackZoneMm(spec, g);
  const depth = Math.max(150, g.interiorDepthMm - 20 - backZone);

  if (spec.board === "gaveta") {
    if (depth < BOARD_TRAVEL_MM) {
      out.decisions.push({
        id: "tabua",
        action: "tabua-bloqueada",
        reason: `curso frontal de ${Math.round(depth)} mm < ${BOARD_TRAVEL_MM} mm: tábua retrátil convertida em nicho`,
      });
      out.slots.push(...nicheBoard(spec, g, backZone, depth));
      return out;
    }
    const groupId = "tabua-retratil";
    out.slots.push(
      {
        id: `${groupId}-caixa`,
        component: "gaveta",
        at: [t, g.interiorY0, Math.max(spec.backThicknessMm + backZone, g.caseDepthMm - depth)],
        role: "tábua retrátil — caixa/guia",
        params: {
          widthMm: g.innerWidthMm,
          heightMm: 110,
          depthMm: Math.min(depth, 800),
          thicknessMm: Math.min(15, t),
          bottomThicknessMm: spec.backThicknessMm,
          slide: "telescopica",
          opening: "softclose",
          withFront: false,
          frontFit: "sobreposta",
          capacityKg: 15,
          handle: laundryHandle(spec),
          finishId: spec.finishId,
        },
      },
      {
        id: `${groupId}-frente`,
        component: "frente-gaveta",
        at: [0, g.interiorY0, g.frontZMm],
        role: "tábua retrátil — frente",
        params: {
          widthMm: spec.widthMm,
          heightMm: 120,
          thicknessMm: t,
          handle: laundryHandle(spec),
          substrate: "mdf",
          mounting: "sobreposta",
          finishId: spec.finishId,
        },
      },
    );
    out.mechanisms.push({ groupId, slotIds: [`${groupId}-caixa`, `${groupId}-frente`] });
    return out;
  }

  out.slots.push(...nicheBoard(spec, g, backZone, depth));
  return out;
}

function nicheBoard(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
  backZone: number,
  depth: number,
): AssemblySlot[] {
  return [
    {
      id: "nicho-tabua",
      component: "nicho",
      at: [spec.thicknessMm, g.interiorY0, backZone],
      role: spec.board === "vertical" ? "espaço vertical para tábua solta" : "nicho para tábua dobrável",
      params: {
        widthMm: g.innerWidthMm,
        heightMm: Math.min(2000, Math.max(300, g.interiorHeightMm)),
        depthMm: Math.min(800, depth),
        thicknessMm: spec.thicknessMm,
        withBack: true,
        ledStrip: false,
        shelves: 0,
        finishId: spec.finishId,
      },
    },
  ];
}

/* ───────────────────────── nichos de aparelho ────────────────────────── */

/** Travessas estruturais entre aparelhos empilhados + painel lateral. */
function applianceStructureSlots(spec: LaundryModuleSpec, g: LaundryGeometry): AssemblySlot[] {
  const slots: AssemblySlot[] = [];
  const stack = applianceStackY(spec, g);
  if (stack.length > 1) {
    stack.slice(0, -1).forEach((s, i) => {
      const y = s.y0 + applianceEnvelopeMm(s.appliance).heightMm;
      slots.push({
        id: `travessa-${i + 1}`,
        component: "prateleira",
        at: [spec.thicknessMm, y, spec.backThicknessMm],
        role: `travessa estrutural ${i + 1} — apoio do aparelho superior`,
        params: {
          widthMm: g.innerWidthMm,
          depthMm: Math.max(150, g.interiorDepthMm - 40),
          thicknessMm: spec.thicknessMm,
          positionMm: 0,
          fixed: true,
          supportType: "cavilha",
          loadKg: 80,
          finishId: spec.finishId,
        },
      });
    });
  }
  if (spec.sidePanel) {
    slots.push({
      id: "painel-lateral",
      component: "painel",
      at: [spec.widthMm, g.caseY0, 0],
      role: "painel lateral vista",
      params: {
        widthMm: spec.thicknessMm,
        heightMm: g.caseHeightMm,
        depthMm: g.caseDepthMm,
        thicknessMm: spec.thicknessMm,
        treatment: "liso",
        fixedRole: "acabamento",
        orientation: "vertical",
        finishId: spec.finishId,
      },
    });
  }
  return slots;
}

/* ─────────────────────────────── receitas ─────────────────────────────── */

export function laundryModuleSlots(
  spec: LaundryModuleSpec,
  g: LaundryGeometry,
): LaundrySlotsResult {
  const slots: AssemblySlot[] = [];
  const mechanisms: { groupId: string; slotIds: string[] }[] = [];
  const decisions: LaundryDecision[] = [];
  const warnings: string[] = [];
  const fillers: string[] = [];
  const t = spec.thicknessMm;
  const profile = LAUNDRY_MODULE_PROFILES[spec.kind];

  switch (spec.kind) {
    case "tapa-vao": {
      const f = makeFiller({
        id: "tapa-vao",
        role: "tapa-vao",
        widthMm: spec.widthMm,
        heightMm: spec.heightMm,
        depthMm: spec.depthMm,
        yMm: g.caseY0,
        finishId: spec.finishId,
        reason: "vão entre módulo e parede",
      });
      slots.push(fillerSlot(f));
      fillers.push(f.id);
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "painel-acabamento":
    case "rodabanca": {
      const isRodabanca = spec.kind === "rodabanca";
      const f = makeFiller({
        id: isRodabanca ? "rodabanca" : "painel-acabamento",
        role: "acabamento",
        fixedRole: isRodabanca ? "rodabanca" : "acabamento",
        widthMm: spec.widthMm,
        heightMm: spec.heightMm,
        depthMm: spec.depthMm,
        yMm: g.caseY0,
        finishId: spec.finishId,
        reason: isRodabanca ? "arremate da bancada com a parede" : "acabamento vista",
      });
      slots.push(fillerSlot(f));
      fillers.push(f.id);
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "tampo-continuo": {
      const ct = spec.countertop;
      slots.push({
        id: "tampo-continuo",
        component: "tampo",
        at: [0, 0, 0],
        role: `tampo contínuo ${ct.material}${ct.cutout !== "nenhum" ? ` • recorte ${ct.cutout}` : ""}`,
        params: {
          widthMm: spec.widthMm,
          depthMm: spec.depthMm,
          thicknessMm: Math.max(spec.heightMm, ct.thicknessMm || 20),
          overhangFrontMm: ct.overhangFrontMm,
          overhangSideMm: ct.overhangSideMm,
          postformado: ct.material === "laminado",
          finishId: ct.finishId || spec.finishId,
        },
      });
      if (ct.backsplashMm > 0) {
        const f = makeFiller({
          id: "rodabanca",
          role: "acabamento",
          fixedRole: "rodabanca",
          widthMm: spec.widthMm,
          heightMm: ct.backsplashMm,
          depthMm: Math.max(10, ct.thicknessMm),
          yMm: Math.max(spec.heightMm, ct.thicknessMm),
          finishId: ct.finishId || spec.finishId,
          reason: "rodabanca do tampo contínuo",
        });
        slots.push(fillerSlot(f));
        fillers.push(f.id);
      }
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "prateleira": {
      slots.push({
        id: "prateleira-1",
        component: "prateleira",
        at: [0, g.caseY0, 0],
        role: "prateleira",
        params: {
          widthMm: spec.widthMm,
          depthMm: spec.depthMm,
          thicknessMm: Math.max(spec.thicknessMm, spec.heightMm),
          positionMm: 0,
          fixed: true,
          supportType: "suporte-oculto",
          loadKg: 20,
          finishId: spec.finishId,
        },
      });
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "nicho-aberto": {
      slots.push({
        id: "nicho",
        component: "nicho",
        at: [0, g.caseY0, 0],
        role: "nicho aberto",
        params: {
          widthMm: spec.widthMm,
          heightMm: Math.min(2000, g.caseHeightMm),
          depthMm: g.caseDepthMm,
          thicknessMm: t,
          withBack: true,
          ledStrip: spec.led,
          shelves: spec.shelves,
          finishId: spec.finishId,
        },
      });
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "modulo-lavadora":
    case "modulo-secadora":
    case "modulo-lava-e-seca":
    case "bancada-sobre-maquina":
    case "torre-maquinas":
    case "torre-tecnica": {
      const list = laundryAppliances(spec);
      const topLoader = list.some((a) => isTopLoader(a));
      /* Máquina de abertura superior: nada de tampo estrutural fechando a
       * tampa. O volume de abertura permanece livre por construção. */
      const c = caseSlots(spec, g, { withTop: !topLoader });
      slots.push(...c.slots);
      decisions.push(...c.decisions);
      slots.push(...applianceStructureSlots(spec, g));

      if (topLoader && spec.countertop.material !== "nenhum") {
        decisions.push({
          id: "tampo",
          action: "tampo-removido",
          reason: "máquina de abertura superior: nenhum tampo fixo pode bloquear a tampa",
        });
        warnings.push("tampo removido: máquina de abertura superior exige acesso livre pela tampa");
      } else {
        slots.push(...countertopSlots(spec, g));
      }

      if (spec.shelves > 0) {
        decisions.push({
          id: "prateleiras",
          action: "prateleira-removida",
          reason: "nicho de aparelho não recebe prateleira interna",
        });
      }

      if (spec.outerDoor) {
        const leaves = Math.max(1, spec.doors || 2);
        slots.push(...doorSlots(spec, g, leaves, { y0: g.caseY0, heightMm: g.caseHeightMm }, "porta-externa"));
        warnings.push(
          "porta externa: abrir a folha antes de operar o aparelho e manter a ventilação desobstruída",
        );
      }
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "vassoureiro": {
      const c = caseSlots(spec, g, { withTop: true });
      slots.push(...c.slots);
      decisions.push(...c.decisions);
      const zoneTop = g.interiorY0 + Math.min(spec.broomZoneMm, g.interiorHeightMm);
      const above = g.interiorY0 + g.interiorHeightMm - zoneTop;
      if (spec.shelves > 0) {
        if (above >= 150) {
          slots.push(...shelfSlots(spec, g, spec.shelves, { y0: zoneTop, heightMm: above }));
        } else {
          decisions.push({
            id: "prateleiras",
            action: "prateleira-removida",
            reason: "sem altura livre acima da área vertical reservada às vassouras",
          });
        }
      }
      if (spec.broomDivider) {
        slots.push({
          id: "divisoria-vassoureiro",
          component: "divisoria-vertical",
          at: [Math.round(spec.widthMm * 0.6), g.interiorY0, spec.backThicknessMm],
          role: "divisória do vassoureiro",
          params: {
            heightMm: Math.min(spec.broomZoneMm, g.interiorHeightMm),
            depthMm: Math.max(150, g.interiorDepthMm - 40),
            thicknessMm: t,
            positionMm: 0,
            fullHeight: false,
            finishId: spec.finishId,
          },
        });
      }
      slots.push(...doorSlots(spec, g, spec.doors));
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "modulo-tabua": {
      const c = caseSlots(spec, g, { withTop: true });
      slots.push(...c.slots);
      decisions.push(...c.decisions);
      const b = boardSlots(spec, g);
      slots.push(...b.slots);
      mechanisms.push(...b.mechanisms);
      decisions.push(...b.decisions);
      slots.push(...doorSlots(spec, g, spec.doors));
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "gabinete-cesto-basculante":
    case "modulo-cestos": {
      const c = caseSlots(spec, g, { withTop: true });
      slots.push(...c.slots);
      decisions.push(...c.decisions);
      slots.push(...countertopSlots(spec, g));
      const b = basketSlots(spec, g);
      slots.push(...b.slots);
      mechanisms.push(...b.mechanisms);
      decisions.push(...b.decisions);
      warnings.push(...b.warnings);
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "aereo-simples":
    case "aereo-portas":
    case "armario-limpeza":
    case "modulo-produtos": {
      const c = caseSlots(spec, g, { withTop: true });
      slots.push(...c.slots);
      decisions.push(...c.decisions);
      slots.push(...shelfSlots(spec, g, spec.shelves));
      slots.push(...doorSlots(spec, g, spec.doors));
      if (spec.kind === "modulo-produtos") slots.push(...countertopSlots(spec, g));
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    default:
      break;
  }

  /* Gabinetes de bancada (tanque, simples, 2 portas, gavetas). */
  const c = caseSlots(spec, g, { withTop: true });
  slots.push(...c.slots);
  decisions.push(...c.decisions);
  slots.push(...countertopSlots(spec, g));

  const drawerRegionH =
    spec.opening === "gaveta"
      ? g.interiorHeightMm
      : spec.drawers > 0
        ? Math.min(g.interiorHeightMm * 0.55, 420)
        : 0;

  if (spec.opening === "misto" && profile.opening === "abrir") {
    warnings.push("módulo de abrir com gavetas solicitadas: operando como misto");
  }

  if (spec.drawers > 0 && drawerRegionH > 0) {
    const d = drawerSlots(spec, g, spec.drawers, { y0: g.interiorY0, heightMm: drawerRegionH });
    slots.push(...d.slots);
    mechanisms.push(...d.mechanisms);
    decisions.push(...d.decisions);
    if (d.doorsInstead > 0) {
      slots.push(
        ...doorSlots(spec, g, d.doorsInstead, { y0: g.caseY0, heightMm: drawerRegionH }, "porta-sob-tanque"),
      );
      warnings.push(`${d.doorsInstead} gaveta(s) substituída(s) por porta devido ao volume hidráulico`);
    }
  }

  /* Prateleira só existe fora da reserva hidráulica do tanque. */
  if (spec.shelves > 0) {
    const shelfY0 = g.interiorY0 + drawerRegionH;
    const shelfH = g.interiorHeightMm - drawerRegionH;
    const reserveY0 =
      spec.tub.type === "nenhum" ? Infinity : g.topOfCaseMm - spec.tub.hydraulicHeightMm;
    const usableH = Math.min(shelfH, Math.max(0, reserveY0 - shelfY0));
    if (usableH >= 150) {
      slots.push(...shelfSlots(spec, g, spec.shelves, { y0: shelfY0, heightMm: usableH }));
    } else {
      decisions.push({
        id: "prateleiras",
        action: "prateleira-removida",
        reason: "não há altura livre abaixo da reserva hidráulica do tanque",
      });
    }
  }

  if (spec.doors > 0) {
    slots.push(
      ...doorSlots(spec, g, spec.doors, {
        y0: g.caseY0 + drawerRegionH,
        heightMm: g.caseHeightMm - drawerRegionH,
      }),
    );
  }

  const b = basketSlots(spec, g);
  slots.push(...b.slots);
  mechanisms.push(...b.mechanisms);
  decisions.push(...b.decisions);
  warnings.push(...b.warnings);

  return { slots, mechanisms, decisions, warnings, fillers };
}