/**
 * RECEITAS DOS MÓDULOS DE COZINHA.
 *
 * Cada receita traduz uma `KitchenModuleSpec` em slots da Biblioteca
 * Construtiva. NENHUMA geometria é criada aqui: só posicionamento e
 * parâmetros. Folgas de corrediça, dobradiça, trilho, furação e rig de
 * animação pertencem exclusivamente aos componentes.
 */
import type { AssemblySlot } from "../../construction";
import { kitchenHandle, KITCHEN_MODULE_PROFILES, type KitchenModuleSpec } from "./spec";

/** Medidas derivadas da ficha — auditáveis pela IA e pela produção. */
export interface KitchenGeometry extends Record<string, number> {
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
}

export function kitchenGeometry(spec: KitchenModuleSpec): KitchenGeometry {
  const { widthMm: W, heightMm: H, depthMm: D, thicknessMm: t, backThicknessMm: bt } = spec;
  const P = spec.plinth.heightMm;
  const CT = spec.countertop.thicknessMm;

  // Frente ocupa espaço à FRENTE da caixa: a caixa recua para que nenhuma
  // folha atravesse lateral, base ou tampo (mesma regra do roupeiro).
  const frontReserve = spec.opening === "correr" ? t + 12 : spec.opening === "aberto" ? 0 : t;
  const caseD = Math.max(120, D - frontReserve);
  const caseY0 = P;
  const caseH = Math.max(150, H - P - CT);

  return {
    plinthHeightMm: P,
    countertopThicknessMm: CT,
    caseY0,
    caseHeightMm: caseH,
    caseDepthMm: caseD,
    innerWidthMm: Math.max(100, W - 2 * t),
    interiorY0: caseY0 + t,
    interiorHeightMm: Math.max(100, caseH - 2 * t),
    interiorDepthMm: Math.max(100, caseD - bt),
    frontZMm: caseD,
    topOfCaseMm: caseY0 + caseH,
  };
}

/* ─────────────────────────── blocos reutilizáveis ─────────────────────────── */

function caseSlots(
  spec: KitchenModuleSpec,
  g: KitchenGeometry,
  opts: { withTop?: boolean } = {},
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
      params: {
        heightMm: g.caseHeightMm,
        depthMm: g.caseDepthMm,
        thicknessMm: t,
        side: "esquerda",
        finishId,
      },
    },
    {
      id: "lateral-d",
      component: "lateral",
      at: [W - t, g.caseY0, 0],
      role: "lateral direita",
      params: {
        heightMm: g.caseHeightMm,
        depthMm: g.caseDepthMm,
        thicknessMm: t,
        side: "direita",
        finishId,
      },
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
    {
      id: "fundo",
      component: "fundo",
      at: [0, g.caseY0, 0],
      role: "fundo",
      params: {
        widthMm: W,
        heightMm: g.caseHeightMm,
        thicknessMm: bt,
        mounting: "encaixado",
        finishId,
      },
    },
  );

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

/** Tampo de pedra/madeira apoiado sobre a caixa. */
function countertopSlots(spec: KitchenModuleSpec, g: KitchenGeometry): AssemblySlot[] {
  const ct = spec.countertop;
  if (ct.material === "nenhum" || ct.thicknessMm <= 0) return [];
  const slots: AssemblySlot[] = [
    {
      id: "tampo-bancada",
      component: "tampo",
      at: [-ct.overhangSideMm, g.topOfCaseMm, 0],
      role: `bancada ${ct.material}${ct.cutout !== "nenhum" ? ` • recorte ${ct.cutout}` : ""}`,
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
      at: [0, g.topOfCaseMm + ct.thicknessMm, 0],
      role: "rodabanca",
      params: {
        widthMm: spec.widthMm,
        heightMm: ct.backsplashMm,
        depthMm: ct.thicknessMm,
        thicknessMm: ct.thicknessMm,
        treatment: "liso",
        finishId: ct.finishId,
      },
    });
  }
  return slots;
}

/** Portas de abrir/correr/basculante distribuídas no vão frontal. */
function doorSlots(spec: KitchenModuleSpec, g: KitchenGeometry): AssemblySlot[] {
  if (spec.doors <= 0 || spec.opening === "aberto" || spec.opening === "gaveta") return [];
  const handle = kitchenHandle(spec);
  const substrate = spec.glassFront ? "vidro" : "mdf";
  const H = g.caseHeightMm;

  if (spec.opening === "correr") {
    return [
      {
        id: "porta-correr",
        component: "porta-correr",
        at: [0, g.caseY0, g.frontZMm],
        role: "portas de correr",
        params: {
          widthMm: spec.widthMm,
          heightMm: H,
          leaves: Math.max(2, spec.doors),
          tracks: 2,
          system: "embutido",
          handle,
          substrate,
          softClose: true,
          finishId: spec.finishId,
        },
      },
    ];
  }

  if (spec.opening === "basculante") {
    return [
      {
        id: "porta-basculante",
        component: "porta-abrir",
        at: [0, g.caseY0, g.frontZMm],
        role: "basculante",
        params: {
          widthMm: spec.widthMm,
          heightMm: H,
          swing: "superior",
          hinge: "caneco-35",
          handle,
          opening: "softclose",
          substrate,
          maxAngleDeg: 85,
          finishId: spec.finishId,
        },
      },
    ];
  }

  const n = spec.doors;
  const leafW = spec.widthMm / n;
  return Array.from({ length: n }, (_, i) => ({
    id: `porta-${i + 1}`,
    component: "porta-abrir" as const,
    at: [i * leafW, g.caseY0, g.frontZMm] as [number, number, number],
    role: `porta ${i + 1}`,
    params: {
      widthMm: leafW,
      heightMm: H,
      swing: n === 1 ? "direita" : i < n / 2 ? "esquerda" : "direita",
      hinge: "caneco-35",
      handle,
      opening: "softclose",
      substrate,
      maxAngleDeg: 100,
      finishId: spec.finishId,
    },
  }));
}

/** Prateleiras internas distribuídas no vão. */
function shelfSlots(
  spec: KitchenModuleSpec,
  g: KitchenGeometry,
  count: number,
  region: { y0: number; heightMm: number } = { y0: g.interiorY0, heightMm: g.interiorHeightMm },
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
      depthMm: Math.max(120, g.interiorDepthMm - 20),
      thicknessMm: spec.thicknessMm,
      positionMm: 0,
      fixed: false,
      loadKg: 25,
      finishId: spec.finishId,
    },
  }));
}

/** Gavetas empilhadas: alturas progressivas (a de baixo é a maior). */
export function kitchenDrawerHeights(count: number, regionMm: number, gapMm = 3): number[] {
  if (count <= 0) return [];
  const usable = Math.max(60 * count, regionMm - gapMm * (count - 1));
  if (count === 1) return [usable];
  const weights = Array.from(
    { length: count },
    (_, i) => 1 + (0.7 * (count - 1 - i)) / (count - 1),
  );
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => (usable * w) / total);
}

function drawerSlots(
  spec: KitchenModuleSpec,
  g: KitchenGeometry,
  count: number,
  region: { y0: number; heightMm: number } = { y0: g.interiorY0, heightMm: g.interiorHeightMm },
): AssemblySlot[] {
  if (count <= 0) return [];
  const handle = kitchenHandle(spec);
  const gap = 3;
  const heights = kitchenDrawerHeights(count, region.heightMm, gap);
  const drawerDepth = Math.max(250, g.interiorDepthMm - 20);
  const slots: AssemblySlot[] = [];
  let y = region.y0;
  heights.forEach((h, i) => {
    slots.push({
      id: `gaveta-${i + 1}`,
      component: "gaveta",
      at: [spec.thicknessMm, y, Math.max(spec.backThicknessMm, g.caseDepthMm - drawerDepth)],
      role: `gaveta ${i + 1}`,
      params: {
        widthMm: g.innerWidthMm,
        heightMm: h,
        depthMm: drawerDepth,
        thicknessMm: Math.min(15, spec.thicknessMm),
        bottomThicknessMm: spec.backThicknessMm,
        slide: "oculta-softclose",
        opening: "softclose",
        withFront: true,
        frontFit: "sobreposta",
        capacityKg: h > 250 ? 40 : 30,
        handle,
        finishId: spec.finishId,
      },
    });
    y += h + gap;
  });
  return slots;
}

function nicheSlot(
  id: string,
  spec: KitchenModuleSpec,
  g: KitchenGeometry,
  y: number,
  heightMm: number,
  role: string,
  shelves = 0,
  opts: { withBack?: boolean; depthMm?: number } = {},
): AssemblySlot {
  return {
    id,
    component: "nicho",
    at: [spec.thicknessMm, y, 0],
    role,
    params: {
      widthMm: g.innerWidthMm,
      heightMm,
      depthMm: opts.depthMm ?? g.interiorDepthMm,
      thicknessMm: spec.thicknessMm,
      withBack: opts.withBack ?? true,
      ledStrip: spec.led,
      shelves,
      finishId: spec.finishId,
    },
  };
}

/**
 * Volumes técnicos reservados por módulo (cuba, sifão, cooktop, forno,
 * micro-ondas, geladeira). Não são marcenaria, mas ocupam espaço e por isso
 * nenhuma gaveta, prateleira ou divisória pode invadi-los.
 */
export interface KitchenModuleReservation {
  readonly id: string;
  readonly kind: string;
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

export function kitchenReservedVolumes(
  spec: KitchenModuleSpec,
  g: KitchenGeometry,
): readonly KitchenModuleReservation[] {
  const t = spec.thicknessMm;
  const out: KitchenModuleReservation[] = [];
  const full = (
    id: string,
    kind: string,
    y: number,
    h: number,
    note: string,
    depth = g.interiorDepthMm,
  ) =>
    out.push({
      id,
      kind,
      box: { x: t, y, z: 0, width: g.innerWidthMm, height: h, depth },
      note,
    });

  if (spec.kind === "balcao-pia") {
    const h = Math.min(400, g.interiorHeightMm);
    full(
      "cuba",
      "cuba",
      g.interiorY0 + g.interiorHeightMm - h,
      h,
      "cuba + sifão + área hidráulica",
    );
  }
  if (spec.kind === "balcao-cooktop") {
    const h = Math.min(COOKTOP_RESERVE_MM, g.interiorHeightMm);
    full(
      "cooktop",
      "cooktop",
      g.interiorY0 + g.interiorHeightMm - h,
      h,
      "caixa do cooktop e ligação de gás/elétrica",
    );
  }
  if (spec.kind === "torre-quente") {
    const bottomH = Math.max(300, g.interiorHeightMm * 0.35);
    const depth = Math.max(120, g.interiorDepthMm - spec.applianceGapBackMm);
    full(
      "forno",
      "forno",
      g.interiorY0 + bottomH,
      OVEN_NICHE_MM,
      "forno embutido com ventilação traseira",
      depth,
    );
    full(
      "microondas",
      "microondas",
      g.interiorY0 + bottomH + OVEN_NICHE_MM,
      MICROWAVE_NICHE_MM,
      "micro-ondas embutido",
      depth,
    );
  }
  if (spec.kind === "torre-geladeira") {
    const applianceH = Math.min(g.caseHeightMm - 400, 1900);
    out.push({
      id: "geladeira",
      kind: "geladeira",
      box: {
        x: t + spec.applianceGapSideMm,
        y: g.caseY0,
        z: 0,
        width: Math.max(100, g.innerWidthMm - 2 * spec.applianceGapSideMm),
        height: Math.max(100, applianceH - spec.applianceGapTopMm),
        depth: Math.max(120, g.caseDepthMm - spec.applianceGapBackMm),
      },
      note: `geladeira com folgas ${spec.applianceGapSideMm}/${spec.applianceGapTopMm}/${spec.applianceGapBackMm} mm`,
    });
  }
  return out;
}

/** Faixa reservada sob o tampo do cooktop (nenhuma gaveta entra aqui). */
export const COOKTOP_RESERVE_MM = 180;
export const OVEN_NICHE_MM = 600;
export const MICROWAVE_NICHE_MM = 400;

/* ────────────────────────────── receitas por módulo ───────────────────────── */

export function kitchenModuleSlots(spec: KitchenModuleSpec, g: KitchenGeometry): AssemblySlot[] {
  const t = spec.thicknessMm;
  const slots: AssemblySlot[] = [];

  switch (spec.kind) {
    /* ── balcões ── */
    case "balcao": {
      slots.push(...caseSlots(spec, g), ...shelfSlots(spec, g, spec.shelves));
      if (spec.drawers > 0) {
        // Balcão com gaveta superior: a gaveta come o topo do vão.
        const drawerRegion = Math.min(220 * spec.drawers, g.interiorHeightMm * 0.35);
        const doorRegion = g.interiorHeightMm - drawerRegion;
        slots.push(
          ...drawerSlots(spec, g, spec.drawers, {
            y0: g.interiorY0 + doorRegion,
            heightMm: drawerRegion,
          }),
        );
        slots.push(
          ...doorSlots(
            { ...spec, heightMm: spec.heightMm },
            { ...g, caseHeightMm: doorRegion, caseY0: g.caseY0 },
          ),
        );
      } else {
        slots.push(...doorSlots(spec, g));
      }
      slots.push(...countertopSlots(spec, g));
      return slots;
    }

    case "balcao-pia": {
      // Sob a cuba não existe prateleira: o sifão ocupa o vão.
      slots.push(...caseSlots(spec, g), ...doorSlots(spec, g));
      slots.push(
        ...countertopSlots({ ...spec, countertop: { ...spec.countertop, cutout: "cuba" } }, g),
      );
      return slots;
    }

    case "balcao-cooktop": {
      // Cooktop exige gavetas rasas (a de cima desvia da cuba do cooktop).
      slots.push(...caseSlots(spec, g));
      const shallow = COOKTOP_RESERVE_MM;
      slots.push(
        ...drawerSlots(spec, g, Math.max(1, spec.drawers), {
          y0: g.interiorY0,
          heightMm: Math.max(200, Math.min(g.interiorHeightMm - shallow, g.interiorHeightMm)),
        }),
      );
      slots.push(
        ...countertopSlots({ ...spec, countertop: { ...spec.countertop, cutout: "cooktop" } }, g),
      );
      return slots;
    }

    case "gaveteiro":
    case "gavetao": {
      slots.push(
        ...caseSlots(spec, g),
        ...drawerSlots(spec, g, Math.max(1, spec.drawers)),
        ...countertopSlots(spec, g),
      );
      return slots;
    }

    case "adega": {
      slots.push(...caseSlots(spec, g));
      const cells = Math.max(2, spec.shelves);
      const cellH = g.interiorHeightMm / cells;
      for (let i = 0; i < cells; i += 1) {
        slots.push(
          nicheSlot(
            `garrafeira-${i + 1}`,
            spec,
            g,
            g.interiorY0 + cellH * i,
            cellH,
            `garrafeira ${i + 1}`,
          ),
        );
      }
      slots.push(...countertopSlots(spec, g));
      return slots;
    }

    /* ── aéreos ── */
    case "aereo":
    case "aereo-vidro": {
      slots.push(
        ...caseSlots(spec, g),
        ...shelfSlots(spec, g, spec.shelves),
        ...doorSlots(spec, g),
      );
      return slots;
    }

    case "aereo-basculante": {
      slots.push(
        ...caseSlots(spec, g),
        ...shelfSlots(spec, g, spec.shelves),
        ...doorSlots(spec, g),
      );
      return slots;
    }

    case "cristaleira": {
      slots.push(
        ...caseSlots(spec, g),
        ...shelfSlots(spec, g, Math.max(2, spec.shelves)),
        ...doorSlots({ ...spec, glassFront: true }, g),
      );
      return slots;
    }

    case "nicho-aberto": {
      slots.push(
        ...caseSlots(spec, g, { withTop: true }),
        // O fundo já vem da caixa: o nicho não repete o painel traseiro.
        nicheSlot("nicho", spec, g, g.interiorY0, g.interiorHeightMm, "nicho", spec.shelves, {
          withBack: false,
        }),
      );
      return slots;
    }

    /* ── colunas ── */
    case "torre-quente": {
      slots.push(...caseSlots(spec, g));
      const ovenH = OVEN_NICHE_MM;
      const microH = MICROWAVE_NICHE_MM;
      const y0 = g.interiorY0;
      const bottomH = Math.max(300, g.interiorHeightMm * 0.35);
      const ovenY = y0 + bottomH;
      const microY = ovenY + ovenH;
      const topY = microY + microH;
      const topH = Math.max(0, g.interiorY0 + g.interiorHeightMm - topY);
      // Ventilação traseira: o nicho é mais raso que o interior da caixa.
      const nicheDepth = Math.max(120, g.interiorDepthMm - spec.applianceGapBackMm);

      // Vão inferior: gaveta (panelas) e/ou porta.
      if (spec.drawers > 0) {
        slots.push(...drawerSlots(spec, g, spec.drawers, { y0, heightMm: bottomH }));
      } else {
        slots.push(
          ...doorSlots(spec, { ...g, caseY0: y0, caseHeightMm: bottomH }).map((s) => ({
            ...s,
            id: `${s.id}-inferior`,
          })),
        );
      }
      slots.push(
        nicheSlot("nicho-forno", spec, g, ovenY, ovenH, "nicho do forno", 0, {
          depthMm: nicheDepth,
        }),
        nicheSlot("nicho-microondas", spec, g, microY, microH, "nicho do micro-ondas", 0, {
          depthMm: nicheDepth,
        }),
      );
      if (topH > 250) {
        slots.push(
          ...doorSlots(
            { ...spec, doors: Math.max(1, spec.doors) },
            {
              ...g,
              caseY0: topY,
              caseHeightMm: topH,
            },
          ).map((s) => ({ ...s, id: `${s.id}-superior`, role: "porta superior" })),
        );
      }
      return slots;
    }

    case "torre-geladeira": {
      // Painéis de acabamento em volta do eletrodoméstico: sem porta, sem fundo cheio.
      const applianceH = Math.min(g.caseHeightMm - 400, 1900);
      // A travessa sobe a folga superior do eletrodoméstico.
      const trimY = g.caseY0 + applianceH + spec.applianceGapTopMm;
      slots.push(
        {
          id: "lateral-e",
          component: "lateral",
          at: [0, g.caseY0, 0],
          role: "painel lateral esquerdo",
          params: {
            heightMm: g.caseHeightMm,
            depthMm: g.caseDepthMm,
            thicknessMm: t,
            side: "esquerda",
            finishId: spec.finishId,
          },
        },
        {
          id: "lateral-d",
          component: "lateral",
          at: [spec.widthMm - t, g.caseY0, 0],
          role: "painel lateral direito",
          params: {
            heightMm: g.caseHeightMm,
            depthMm: g.caseDepthMm,
            thicknessMm: t,
            side: "direita",
            finishId: spec.finishId,
          },
        },
        {
          id: "travessa",
          component: "tampo",
          at: [t, trimY, 0],
          role: "travessa sobre a geladeira",
          params: {
            widthMm: g.innerWidthMm,
            depthMm: Math.max(120, g.caseDepthMm - spec.applianceGapBackMm),
            thicknessMm: t,
            overhangFrontMm: 0,
            overhangSideMm: 0,
            finishId: spec.finishId,
          },
        },
      );
      if (g.plinthHeightMm > 0) {
        slots.push({
          id: "rodape",
          component: "rodape",
          at: [0, 0, 0],
          role: "rodapé",
          params: {
            widthMm: spec.widthMm,
            heightMm: g.plinthHeightMm,
            thicknessMm: t,
            recessMm: spec.plinth.recessMm,
            finishId: spec.plinth.finishId || spec.finishId,
          },
        });
      }
      const topBoxH = Math.max(0, g.caseY0 + g.caseHeightMm - trimY - t);
      if (topBoxH > 250) {
        slots.push({
          id: "maleiro",
          component: "maleiro",
          at: [0, trimY + t, 0],
          role: "armário sobre a geladeira",
          params: {
            widthMm: spec.widthMm,
            heightMm: topBoxH,
            depthMm: spec.depthMm,
            thicknessMm: t,
            doors: spec.widthMm >= 700 ? 2 : 1,
            withShelf: false,
            finishId: spec.finishId,
          },
        });
      }
      return slots;
    }

    /* ── cantos ── */
    case "canto-reto":
    case "canto-magico": {
      // Caixa cheia com UMA frente útil; o lado cego recebe painel de fecho.
      slots.push(...caseSlots(spec, g));
      const doorW = Math.min(500, spec.widthMm - 200);
      const blindW = spec.widthMm - doorW;
      slots.push({
        id: "frente-cega",
        component: "painel",
        at: [0, g.caseY0, g.frontZMm],
        role: "frente cega do canto",
        params: {
          widthMm: blindW,
          heightMm: g.caseHeightMm,
          depthMm: t,
          thicknessMm: t,
          treatment: "liso",
          finishId: spec.finishId,
        },
      });
      slots.push({
        id: "porta-canto",
        component: "porta-abrir",
        at: [blindW, g.caseY0, g.frontZMm],
        role: spec.kind === "canto-magico" ? "porta do canto mágico" : "porta do canto",
        params: {
          widthMm: doorW,
          heightMm: g.caseHeightMm,
          swing: "direita",
          hinge: "caneco-35",
          handle: kitchenHandle(spec),
          opening: "softclose",
          maxAngleDeg: 100,
          finishId: spec.finishId,
        },
      });
      if (spec.kind === "canto-reto") slots.push(...shelfSlots(spec, g, spec.shelves));
      slots.push(...countertopSlots(spec, g));
      return slots;
    }

    case "canto-diagonal": {
      slots.push(...caseSlots(spec, g));
      // Frente em diagonal aproximada: duas abas laterais + folha central.
      const wing = Math.max(80, spec.widthMm * 0.18);
      const doorW = spec.widthMm - wing * 2;
      slots.push(
        {
          id: "aba-e",
          component: "painel",
          at: [0, g.caseY0, g.frontZMm],
          role: "aba esquerda do canto diagonal",
          // Aba estrutural fixa: fecha o vão, não tem mecanismo.
          params: {
            widthMm: wing,
            heightMm: g.caseHeightMm,
            depthMm: t,
            thicknessMm: t,
            treatment: "liso",
            fixedRole: "aba-canto",
            finishId: spec.finishId,
          },
        },
        {
          id: "aba-d",
          component: "painel",
          at: [spec.widthMm - wing, g.caseY0, g.frontZMm],
          role: "aba direita do canto diagonal",
          params: {
            widthMm: wing,
            heightMm: g.caseHeightMm,
            depthMm: t,
            thicknessMm: t,
            treatment: "liso",
            fixedRole: "aba-canto",
            finishId: spec.finishId,
          },
        },
        {
          id: "porta-diagonal",
          component: "porta-abrir",
          at: [wing, g.caseY0, g.frontZMm],
          role: "porta diagonal",
          params: {
            widthMm: doorW,
            heightMm: g.caseHeightMm,
            swing: "direita",
            hinge: "caneco-35",
            handle: kitchenHandle(spec),
            opening: "softclose",
            maxAngleDeg: 100,
            finishId: spec.finishId,
          },
        },
      );
      slots.push(...shelfSlots(spec, g, spec.shelves), ...countertopSlots(spec, g));
      return slots;
    }

    default: {
      slots.push(...caseSlots(spec, g), ...doorSlots(spec, g), ...countertopSlots(spec, g));
      return slots;
    }
  }
}

export function kitchenModuleLabel(spec: KitchenModuleSpec): string {
  return KITCHEN_MODULE_PROFILES[spec.kind].label;
}
