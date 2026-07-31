/**
 * RECEITAS DOS MÓDULOS DE BANHEIRO.
 *
 * Nenhuma geometria nova é criada aqui: a receita apenas posiciona
 * componentes da Biblioteca Construtiva. Folgas, ferragens e rigs pertencem
 * exclusivamente aos componentes — igual roupeiro, gaveteiro e cozinha.
 *
 * O que é específico do banheiro:
 *  • volumes hidráulicos (cuba, sifão, válvula, tubulação) como reservas;
 *  • gaveta em U (frente única + duas caixas) sob a cuba;
 *  • rodabanca/frontão como ACABAMENTO, nunca como frente;
 *  • tapa-vão como peça real.
 */
import type { AssemblySlot } from "../../construction";
import { makeFiller, fillerSlot } from "../filler";
import { sinkCentersMm, SINKS } from "./sink";
import {
  bathroomHandle,
  BATHROOM_MODULE_PROFILES,
  type BathroomModuleSpec,
} from "./spec";

export interface BathroomGeometry extends Record<string, number> {
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

export function bathroomGeometry(spec: BathroomModuleSpec): BathroomGeometry {
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

/* ───────────────────────── volumes hidráulicos ───────────────────────── */

export interface BathroomReservation {
  readonly id: string;
  readonly kind: "cuba" | "sifao" | "valvula" | "tubulacao" | "agua" | "esgoto";
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

/**
 * Volumes que NENHUMA gaveta, prateleira, divisória ou fundo pode invadir.
 * O desenho realista da louça é outro assunto: aqui o que precisa estar
 * correto é o volume.
 */
export function bathroomReservedVolumes(
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
): readonly BathroomReservation[] {
  if (spec.sink.type === "nenhuma") return [];
  const s = spec.sink;
  const out: BathroomReservation[] = [];
  const centers = sinkCentersMm(s, spec.widthMm);
  const dropMm = SINKS[s.type].dropMm;

  centers.forEach((cx, i) => {
    const sfx = centers.length > 1 ? `-${i + 1}` : "";
    const zBack = Math.max(0, g.caseDepthMm - s.zMm - s.depthMm);

    out.push({
      id: `cuba${sfx}`,
      kind: "cuba",
      box: {
        x: Math.round(cx - s.widthMm / 2),
        y: Math.max(g.caseY0, g.topOfCaseMm - Math.max(dropMm, s.heightMm)),
        z: zBack,
        width: s.widthMm,
        height: Math.max(dropMm, s.heightMm),
        depth: s.depthMm,
      },
      note: `volume da cuba ${s.type}`,
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
      note: "curva/sifão — nenhuma peça pode atravessar",
    });

    out.push({
      id: `valvula${sfx}`,
      kind: "valvula",
      box: {
        x: Math.round(cx - 60),
        y: g.topOfCaseMm - Math.max(dropMm, s.heightMm) - 80,
        z: zBack,
        width: 120,
        height: 80,
        depth: 120,
      },
      note: "válvula e ligação flexível",
    });

    out.push({
      id: `agua${sfx}`,
      kind: "agua",
      box: { x: Math.round(cx - 150), y: g.caseY0, z: 0, width: 300, height: g.caseHeightMm, depth: 100 },
      note: "entrada de água (registro/parede)",
    });

    out.push({
      id: `esgoto${sfx}`,
      kind: "esgoto",
      box: { x: sifX - 20, y: g.caseY0, z: 0, width: s.siphonMm + 40, height: g.caseHeightMm, depth: 120 },
      note: "saída de esgoto na parede",
    });
  });

  return out;
}

/** Faixa em X ocupada pelo sifão (usada pelo interior e pela gaveta em U). */
export function siphonSpansMm(
  spec: BathroomModuleSpec,
): readonly { x0: number; x1: number }[] {
  if (spec.sink.type === "nenhuma") return [];
  return sinkCentersMm(spec.sink, spec.widthMm).map((cx) => ({
    x0: Math.round(cx - spec.sink.siphonMm / 2),
    x1: Math.round(cx + spec.sink.siphonMm / 2),
  }));
}

/**
 * Profundidade, a partir da parede (z = 0), reservada para entrada de água e
 * saída de esgoto. Nenhuma gaveta, prateleira ou divisória pode encostar
 * nela — por isso todas as peças internas nascem recuadas desta faixa.
 */
export function hydraulicBackZoneMm(
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
  marginMm = 5,
): number {
  if (spec.sink.type === "nenhuma") return 0;
  let zone = 0;
  for (const r of bathroomReservedVolumes(spec, g)) {
    if (r.kind !== "agua" && r.kind !== "esgoto") continue;
    zone = Math.max(zone, r.box.z + r.box.depth);
  }
  return Math.min(Math.max(0, g.caseDepthMm - 150), Math.round(zone + marginMm));
}

/**
 * Faixas em X que o mecanismo não pode atravessar na zona de meia
 * profundidade: sifão e válvula (a água/esgoto já saem pelo recuo traseiro).
 * O recorte NÃO é assumido como central: ele vem do centro real da cuba.
 */
export function hydraulicSpansMm(
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
  marginMm = 20,
): readonly { x0: number; x1: number }[] {
  if (spec.sink.type === "nenhuma") return [];
  const raw = bathroomReservedVolumes(spec, g)
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

/* ───────────────────────── decisões registradas ───────────────────────── */

export type BathroomDecisionAction =
  | "gaveta-em-u"
  | "gaveta-reduzida"
  | "gaveta-vira-porta"
  | "prateleira-removida"
  | "fundo-recortado"
  | "modulo-descartado";

export interface BathroomDecision {
  readonly id: string;
  readonly action: BathroomDecisionAction;
  readonly reason: string;
}

export interface BathroomSlotsResult {
  readonly slots: readonly AssemblySlot[];
  /** Grupos de slots que precisam abrir como UM mecanismo (gaveta em U). */
  readonly mechanisms: readonly { readonly groupId: string; readonly slotIds: readonly string[] }[];
  readonly decisions: readonly BathroomDecision[];
  readonly warnings: readonly string[];
  /** Peças reais de tapa-vão/acabamento emitidas por este módulo. */
  readonly fillers: readonly string[];
}

/* ─────────────────────────── blocos reutilizáveis ─────────────────────── */

function caseSlots(
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
  opts: { withTop?: boolean; closedBack?: boolean } = {},
): AssemblySlot[] {
  const { widthMm: W, thicknessMm: t, backThicknessMm: bt, finishId } = spec;
  const slots: AssemblySlot[] = [];

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

  // Fundo: quando há reserva hidráulica e o fundo não pode fechá-la, o
  // fundo é RECORTADO — vira duas folhas laterais à reserva.
  const closed = opts.closedBack ?? spec.closedBack;
  if (closed) {
    const spans = siphonSpansMm(spec);
    const blocking = spans.length > 0;
    if (!blocking) {
      slots.push({
        id: "fundo",
        component: "fundo",
        at: [0, g.caseY0, 0],
        role: "fundo",
        params: { widthMm: W, heightMm: g.caseHeightMm, thicknessMm: bt, mounting: "encaixado", finishId },
      });
    } else {
      const cuts = [{ x0: 0, x1: W }];
      let pieces: { x0: number; x1: number }[] = cuts;
      for (const s of spans) {
        const next: { x0: number; x1: number }[] = [];
        for (const p of pieces) {
          if (s.x1 <= p.x0 || s.x0 >= p.x1) next.push(p);
          else {
            if (s.x0 - p.x0 > 60) next.push({ x0: p.x0, x1: s.x0 - 20 });
            if (p.x1 - s.x1 > 60) next.push({ x0: s.x1 + 20, x1: p.x1 });
          }
        }
        pieces = next;
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

  return slots;
}

/** Bancada + rodabanca + saia + frontão. Rodabanca é ACABAMENTO. */
function countertopSlots(spec: BathroomModuleSpec, g: BathroomGeometry): AssemblySlot[] {
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
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
  count = spec.doors,
  region: { y0: number; heightMm: number } = { y0: g.caseY0, heightMm: g.caseHeightMm },
  idPrefix = "porta",
): AssemblySlot[] {
  if (count <= 0) return [];
  const handle = bathroomHandle(spec);
  // Só a PORTA espelhada recebe rig; espelho fixo/painel são acabamento.
  const substrate = spec.mirror === "porta" ? "espelho" : "mdf";
  const leafW = spec.widthMm / count;
  return Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}-${i + 1}`,
    component: "porta-abrir" as const,
    at: [i * leafW, region.y0, g.frontZMm] as [number, number, number],
    role: `porta ${i + 1}${substrate === "espelho" ? " espelhada" : ""}`,
    params: {
      widthMm: leafW,
      heightMm: region.heightMm,
      swing: count === 1 ? "direita" : i < count / 2 ? "esquerda" : "direita",
      hinge: "caneco-35",
      handle,
      opening: "softclose",
      substrate,
      maxAngleDeg: 100,
      finishId: spec.finishId,
    },
  }));
}

function shelfSlots(
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
  count: number,
  region: { y0: number; heightMm: number } = { y0: g.interiorY0, heightMm: g.interiorHeightMm },
  depthMm = Math.max(100, g.interiorDepthMm - 20),
): AssemblySlot[] {
  if (count <= 0) return [];
  const pitch = region.heightMm / (count + 1);
  return Array.from({ length: count }, (_, i) => ({
    id: `prateleira-${i + 1}`,
    component: "prateleira" as const,
    at: [spec.thicknessMm, region.y0 + pitch * (i + 1), 0] as [number, number, number],
    role: `prateleira ${i + 1}`,
    params: {
      widthMm: g.innerWidthMm,
      depthMm,
      thicknessMm: spec.thicknessMm,
      positionMm: 0,
      fixed: false,
      loadKg: 20,
      finishId: spec.finishId,
    },
  }));
}

export function bathroomDrawerHeights(count: number, regionMm: number, gapMm = 3): number[] {
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
  readonly decisions: BathroomDecision[];
  doorsInstead: number;
}

/**
 * Gavetas sob a bancada. Se a faixa do sifão atravessar a gaveta, a decisão
 * é sempre previsível e registrada:
 *   1. gaveta em U (frente única, duas caixas) — preferida;
 *   2. gaveta com profundidade reduzida;
 *   3. gaveta vira porta.
 */
function drawerSlots(
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
  count: number,
  region: { y0: number; heightMm: number } = { y0: g.interiorY0, heightMm: g.interiorHeightMm },
): DrawerBuild {
  const out: DrawerBuild = { slots: [], mechanisms: [], decisions: [], doorsInstead: 0 };
  if (count <= 0) return out;

  const handle = bathroomHandle(spec);
  const t = spec.thicknessMm;
  const gap = 3;
  const heights = bathroomDrawerHeights(count, region.heightMm, gap);
  const fullDepth = Math.max(200, g.interiorDepthMm - 20);
  const spans = siphonSpansMm(spec);
  const interiorX0 = t;
  const interiorX1 = spec.widthMm - t;

  let y = region.y0;
  heights.forEach((h, i) => {
    const id = `gaveta-${i + 1}`;
    const top = y + h;
    // A reserva hidráulica só é relevante se a gaveta estiver na altura dela.
    const hit = spans.find(() => spec.sink.type !== "nenhuma" && top > g.topOfCaseMm - spec.sink.hydraulicHeightMm);

    if (!hit) {
      out.slots.push(plainDrawer(spec, g, id, `gaveta ${i + 1}`, interiorX0, g.innerWidthMm, y, h, fullDepth, handle));
      y += h + gap;
      return;
    }

    const leftW = hit.x0 - 20 - interiorX0;
    const rightW = interiorX1 - (hit.x1 + 20);
    const siphonDepth = spec.sink.siphonMm + 40;
    const shallow = g.interiorDepthMm - siphonDepth;

    if (spec.allowUDrawer && leftW >= 150 && rightW >= 150) {
      const groupId = `gaveta-u-${i + 1}`;
      const boxDepth = fullDepth;
      const zBox = Math.max(spec.backThicknessMm, g.caseDepthMm - boxDepth);
      out.slots.push(
        {
          id: `${groupId}-caixa-e`,
          component: "gaveta",
          at: [interiorX0, y, zBox],
          role: `gaveta em U ${i + 1} — caixa esquerda`,
          params: {
            widthMm: leftW,
            heightMm: h,
            depthMm: boxDepth,
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
        },
        {
          id: `${groupId}-caixa-d`,
          component: "gaveta",
          at: [hit.x1 + 20, y, zBox],
          role: `gaveta em U ${i + 1} — caixa direita`,
          params: {
            widthMm: rightW,
            heightMm: h,
            depthMm: boxDepth,
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
        },
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
      out.mechanisms.push({
        groupId,
        slotIds: [`${groupId}-caixa-e`, `${groupId}-caixa-d`, `${groupId}-frente`],
      });
      out.decisions.push({
        id,
        action: "gaveta-em-u",
        reason: `sifão em ${hit.x0}–${hit.x1} mm: frente única com recorte central, curso único`,
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
        reason: `profundidade reduzida para ${Math.round(shallow)} mm — desvia do sifão`,
      });
      y += h + gap;
      return;
    }

    out.doorsInstead += 1;
    out.decisions.push({
      id,
      action: "gaveta-vira-porta",
      reason: "sem curso livre nem largura lateral suficiente para gaveta em U",
    });
    y += h + gap;
  });

  return out;
}

function plainDrawer(
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
  id: string,
  role: string,
  x: number,
  widthMm: number,
  y: number,
  heightMm: number,
  depthMm: number,
  handle: ReturnType<typeof bathroomHandle>,
): AssemblySlot {
  return {
    id,
    component: "gaveta",
    at: [x, y, Math.max(spec.backThicknessMm, g.caseDepthMm - depthMm)],
    role,
    params: {
      widthMm,
      heightMm,
      depthMm,
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

/** Espelho fixo / painel espelhado / fundo de espelho — SEM rig. */
function mirrorSlots(spec: BathroomModuleSpec, g: BathroomGeometry): AssemblySlot[] {
  if (spec.mirror === "nenhum" || spec.mirror === "porta") return [];
  const role =
    spec.mirror === "fixo" ? "espelho fixo" : spec.mirror === "painel" ? "painel espelhado" : "fundo de espelho";
  return [
    {
      id: `espelho-${spec.mirror}`,
      component: "painel",
      at: [0, g.caseY0, spec.mirror === "fundo" ? 0 : g.frontZMm],
      role,
      params: {
        widthMm: spec.widthMm,
        heightMm: g.caseHeightMm,
        depthMm: 6,
        thicknessMm: 6,
        treatment: "liso",
        fixedRole: "acabamento",
        substrate: "espelho",
        finishId: "espelho-prata",
      },
    },
  ];
}

/* ─────────────────────────────── receitas ─────────────────────────────── */

export function bathroomModuleSlots(
  spec: BathroomModuleSpec,
  g: BathroomGeometry,
): BathroomSlotsResult {
  const slots: AssemblySlot[] = [];
  const mechanisms: { groupId: string; slotIds: string[] }[] = [];
  const decisions: BathroomDecision[] = [];
  const warnings: string[] = [];
  const fillers: string[] = [];
  const t = spec.thicknessMm;

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

    case "prateleira": {
      slots.push({
        id: "prateleira-1",
        component: "prateleira",
        at: [0, g.caseY0, 0],
        role: "prateleira decorativa",
        params: {
          widthMm: spec.widthMm,
          depthMm: spec.depthMm,
          thicknessMm: Math.max(spec.thicknessMm, spec.heightMm),
          positionMm: 0,
          fixed: true,
          supportType: "suporte-oculto",
          loadKg: 15,
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
          heightMm: g.caseHeightMm,
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

    case "espelheira":
    case "armario-superior": {
      slots.push(...caseSlots(spec, g, { withTop: true, closedBack: true }));
      slots.push(...shelfSlots(spec, g, spec.shelves));
      slots.push(...doorSlots(spec, g));
      slots.push(...mirrorSlots(spec, g));
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    case "torre-lateral": {
      slots.push(...caseSlots(spec, g, { withTop: true }));
      const drawerRegion = spec.drawers > 0 ? Math.min(g.interiorHeightMm * 0.3, 400) : 0;
      slots.push(
        ...shelfSlots(spec, g, spec.shelves, {
          y0: g.interiorY0 + drawerRegion,
          heightMm: g.interiorHeightMm - drawerRegion,
        }),
      );
      if (drawerRegion > 0) {
        const d = drawerSlots(spec, g, spec.drawers, { y0: g.interiorY0, heightMm: drawerRegion });
        slots.push(...d.slots);
        mechanisms.push(...d.mechanisms);
        decisions.push(...d.decisions);
      }
      slots.push(
        ...doorSlots(spec, g, spec.doors, {
          y0: g.caseY0 + drawerRegion,
          heightMm: g.caseHeightMm - drawerRegion,
        }),
      );
      return { slots, mechanisms, decisions, warnings, fillers };
    }

    default:
      break;
  }

  /* Gabinetes de bancada (todas as variações). */
  slots.push(...caseSlots(spec, g, { withTop: true }));
  slots.push(...countertopSlots(spec, g));

  const drawerRegionH =
    spec.opening === "misto" && spec.drawers > 0
      ? Math.min(g.interiorHeightMm * 0.55, 420)
      : spec.opening === "gaveta"
        ? g.interiorHeightMm
        : 0;

  if (spec.drawers > 0 && drawerRegionH > 0) {
    const d = drawerSlots(spec, g, spec.drawers, { y0: g.interiorY0, heightMm: drawerRegionH });
    slots.push(...d.slots);
    mechanisms.push(...d.mechanisms);
    decisions.push(...d.decisions);
    if (d.doorsInstead > 0) {
      slots.push(
        ...doorSlots(spec, g, d.doorsInstead, { y0: g.caseY0, heightMm: drawerRegionH }, "porta-sob-cuba"),
      );
      warnings.push(`${d.doorsInstead} gaveta(s) substituída(s) por porta devido ao volume hidráulico`);
    }
  }

  // Prateleira só existe fora da reserva hidráulica.
  if (spec.shelves > 0) {
    const shelfY0 = g.interiorY0 + drawerRegionH;
    const shelfH = g.interiorHeightMm - drawerRegionH;
    const reserveY0 =
      spec.sink.type === "nenhuma" ? Infinity : g.topOfCaseMm - spec.sink.hydraulicHeightMm;
    const usableH = Math.min(shelfH, Math.max(0, reserveY0 - shelfY0));
    if (usableH >= 150) {
      slots.push(...shelfSlots(spec, g, spec.shelves, { y0: shelfY0, heightMm: usableH }));
    } else {
      decisions.push({
        id: "prateleiras",
        action: "prateleira-removida",
        reason: "não há altura livre abaixo da reserva hidráulica",
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

  slots.push(...mirrorSlots(spec, g));

  if (spec.sink.type !== "nenhuma" && spec.closedBack) {
    decisions.push({
      id: "fundo",
      action: "fundo-recortado",
      reason: "fundo dividido para liberar a área hidráulica obrigatória",
    });
  }

  return { slots, mechanisms, decisions, warnings, fillers };
}

export function bathroomModuleLabel(spec: BathroomModuleSpec): string {
  return BATHROOM_MODULE_PROFILES[spec.kind].label;
}