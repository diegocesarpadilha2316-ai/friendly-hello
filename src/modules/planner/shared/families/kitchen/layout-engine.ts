/**
 * KITCHEN LAYOUT ENGINE — distribuição automática de módulos por parede.
 *
 * A entrada descreve INTENÇÃO (paredes, aparelhos, obstáculos); o motor
 * resolve posições reais, respeita restrições de marcenaria e devolve
 * sempre um layout VÁLIDO (o que não cabe é descartado com aviso).
 *
 * Nada aqui desenha: a saída é uma lista de `KitchenPlacement`, cada uma
 * com a ficha do módulo pronta para `buildKitchenModule()`.
 */
import {
  normalizeKitchenModule,
  type KitchenLevel,
  type KitchenModuleInput,
  type KitchenModuleKind,
  type KitchenModuleSpec,
} from "./spec";
import type { KitchenCountertop } from "./countertop";
import type { KitchenPlinth } from "./plinth";

export type KitchenShape = "reta" | "L" | "U" | "paralela" | "ilha";

/** Aparelho/obstáculo ancorado na parede. */
export type KitchenFixtureKind =
  | "pia"
  | "cooktop"
  | "fogao"
  | "forno"
  | "lava-loucas"
  | "geladeira"
  | "coifa"
  | "torre-quente"
  | "janela"
  | "porta"
  | "quina";

export type KitchenCornerKind = "canto-reto" | "canto-diagonal" | "canto-magico";

export interface KitchenFixture {
  readonly id: string;
  readonly kind: KitchenFixtureKind;
  /** Posição da borda esquerda na parede (mm). Ausente = o motor decide. */
  readonly atMm?: number;
  readonly widthMm?: number;
  /** Altura do peitoril (janela) a partir do piso. */
  readonly sillMm?: number;
  /** Altura livre da abertura (janela/porta). */
  readonly heightMm?: number;
}

export interface KitchenWall {
  readonly id: string;
  readonly lengthMm: number;
  readonly heightMm?: number;
  readonly fixtures?: readonly KitchenFixture[];
  /** A parede começa numa quina interna (canto compartilhado). */
  readonly cornerStart?: boolean;
  readonly cornerEnd?: boolean;
  /** Tipo do módulo de canto em cada ponta. Padrão: canto-reto. */
  readonly cornerKindStart?: KitchenCornerKind;
  readonly cornerKindEnd?: KitchenCornerKind;
}

/** Recomendações ergonômicas/técnicas — TODAS configuráveis. */
export interface KitchenErgonomics {
  readonly baseHeightMinMm: number;
  readonly baseHeightMaxMm: number;
  /** Vão livre entre a bancada e o fundo do aéreo. */
  readonly upperGapMinMm: number;
  readonly upperGapMaxMm: number;
  /** Altura da coifa acima da bancada. */
  readonly hoodGapMinMm: number;
  readonly hoodGapMaxMm: number;
  /** Área de preparo entre pia e cooktop. */
  readonly prepAreaMinMm: number;
  /** Apoio lateral mínimo ao lado da pia e do cooktop. */
  readonly sideSupportMinMm: number;
  readonly fridgeGapSideMm: number;
  readonly fridgeGapTopMm: number;
  readonly fridgeGapBackMm: number;
  readonly dishwasherWidthMinMm: number;
  readonly ovenVentMm: number;
  /** Circulação livre (ilha, porta). */
  readonly walkwayMinMm: number;
  /** Folga entre a gaveta e a quina para o curso ser livre. */
  readonly cornerDrawerClearanceMm: number;
  /** Espaço livre à frente de uma porta de ambiente. */
  readonly doorSwingClearanceMm: number;
}

export const KITCHEN_DEFAULT_ERGONOMICS: KitchenErgonomics = {
  baseHeightMinMm: 850,
  baseHeightMaxMm: 1000,
  upperGapMinMm: 450,
  upperGapMaxMm: 700,
  hoodGapMinMm: 650,
  hoodGapMaxMm: 800,
  prepAreaMinMm: 600,
  sideSupportMinMm: 300,
  fridgeGapSideMm: 30,
  fridgeGapTopMm: 50,
  fridgeGapBackMm: 50,
  dishwasherWidthMinMm: 600,
  ovenVentMm: 30,
  walkwayMinMm: 900,
  cornerDrawerClearanceMm: 100,
  doorSwingClearanceMm: 100,
};

export interface KitchenConfig {
  readonly baseHeightMm: number;
  readonly baseDepthMm: number;
  readonly upperHeightMm: number;
  readonly upperDepthMm: number;
  /** Distância entre o tampo e o fundo do aéreo (mm). */
  readonly upperGapMm: number;
  readonly columnHeightMm: number;
  readonly countertop: Partial<KitchenCountertop>;
  readonly plinth: Partial<KitchenPlinth>;
  readonly handle: string;
  readonly finishId: string;
  readonly style: string;
  /** Larguras permitidas de módulo, da maior para a menor. */
  readonly moduleWidthsMm: readonly number[];
  readonly minModuleWidthMm: number;
  readonly maxModuleWidthMm: number;
  /** Largura máxima de UMA folha de porta antes de empenar. */
  readonly maxLeafWidthMm: number;
  /** Sobra que um módulo vizinho absorve antes de virar tamponamento. */
  readonly maxAbsorbMm: number;
  /** Altura livre reservada para a coifa acima da bancada. */
  readonly hoodGapMm: number;
  readonly hoodHeightMm: number;
  readonly ergonomics: KitchenErgonomics;
}

export const KITCHEN_DEFAULT_CONFIG: KitchenConfig = {
  baseHeightMm: 900,
  baseDepthMm: 600,
  upperHeightMm: 700,
  upperDepthMm: 350,
  upperGapMm: 500,
  columnHeightMm: 2200,
  countertop: { material: "granito" },
  plinth: { kind: "pvc" },
  handle: "perfil-gola",
  finishId: "branco-tx",
  style: "moderno",
  moduleWidthsMm: [800, 700, 600, 500, 450, 400],
  minModuleWidthMm: 300,
  maxModuleWidthMm: 900,
  maxLeafWidthMm: 700,
  maxAbsorbMm: 250,
  hoodGapMm: 700,
  hoodHeightMm: 350,
  ergonomics: KITCHEN_DEFAULT_ERGONOMICS,
};

export interface KitchenIsland {
  readonly lengthMm: number;
  /** Profundidade total da bancada da ilha (módulo + balanço). */
  readonly depthMm?: number;
  /** Profundidade dos módulos. Padrão: min(baseDepth, depth). */
  readonly moduleDepthMm?: number;
  /** Balanço do tampo além dos módulos. Padrão: depth − moduleDepth. */
  readonly overhangMm?: number;
  readonly hasCooktop?: boolean;
  readonly hasSink?: boolean;
  /** Circulação medida entre a ilha e a bancada da parede. */
  readonly clearanceMm?: number;
  /** Frentes de um lado só ou dos dois lados. */
  readonly facing?: "frente" | "dupla";
}

export interface KitchenLayoutInput {
  readonly id?: string;
  readonly shape: KitchenShape;
  readonly walls: readonly KitchenWall[];
  readonly island?: KitchenIsland;
  readonly config?: Partial<KitchenConfig>;
}

/** De onde veio a decisão de posicionar este módulo. */
export type KitchenPlacementOrigin = "aparelho" | "canto" | "automatico" | "ilha";

/** Módulo posicionado na cozinha. `x` é medido ao longo da parede. */
export interface KitchenPlacement {
  readonly id: string;
  readonly wallId: string;
  readonly level: KitchenLevel;
  readonly kind: KitchenModuleKind;
  readonly xMm: number;
  readonly yMm: number;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly spec: KitchenModuleSpec;
  readonly role: string;
  readonly origin: KitchenPlacementOrigin;
  /** Largura absorvida de uma sobra vizinha (tamponamento embutido). */
  readonly absorbedMm: number;
  /** Frentes voltadas para o ambiente (ilha com dois lados). */
  readonly facing: "parede" | "frente" | "dupla";
}

/** Trecho contínuo de bancada (uma pedra por trecho). */
export interface KitchenCountertopRun {
  readonly wallId: string;
  readonly startMm: number;
  readonly endMm: number;
  readonly lengthMm: number;
  readonly depthMm: number;
  readonly material: string;
  readonly thicknessMm: number;
  readonly overhangFrontMm: number;
  /** A pedra encontra outra parede nesta ponta (união em L / U). */
  readonly joinStart: boolean;
  readonly joinEnd: boolean;
}

/** Trecho contínuo de rodapé. */
export interface KitchenPlinthRun {
  readonly wallId: string;
  readonly startMm: number;
  readonly endMm: number;
  readonly lengthMm: number;
  readonly kind: string;
  readonly heightMm: number;
  readonly recessMm: number;
}

/** Volume técnico reservado (não é marcenaria, mas ocupa espaço). */
export interface KitchenReservation {
  readonly id: string;
  readonly wallId: string;
  readonly kind: string;
  readonly xMm: number;
  readonly widthMm: number;
  readonly yMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly note: string;
}

/** Tamponamento: sobra que nenhum módulo absorveu. */
export interface KitchenFiller {
  readonly wallId: string;
  readonly xMm: number;
  readonly widthMm: number;
  readonly heightMm: number;
}

export interface KitchenLayoutIssue {
  readonly code: string;
  readonly level: "error" | "warn" | "info";
  readonly message: string;
  readonly wallId?: string;
}

export interface KitchenLayoutResult {
  readonly id: string;
  readonly shape: KitchenShape;
  readonly config: KitchenConfig;
  readonly walls: readonly KitchenWall[];
  readonly placements: readonly KitchenPlacement[];
  readonly countertopRuns: readonly KitchenCountertopRun[];
  readonly plinthRuns: readonly KitchenPlinthRun[];
  readonly reservations: readonly KitchenReservation[];
  readonly fillers: readonly KitchenFiller[];
  readonly warnings: readonly KitchenLayoutIssue[];
  readonly dropped: readonly string[];
  /** Módulos que tiveram a largura ajustada pelo motor. */
  readonly resized: readonly string[];
  readonly totals: {
    readonly moduleCount: number;
    readonly baseCount: number;
    readonly upperCount: number;
    readonly columnCount: number;
    readonly countertopLengthMm: number;
    readonly plinthLengthMm: number;
    readonly linearMetersMm: number;
  };
}

/* ────────────────────────────── utilidades ────────────────────────────── */

interface Span {
  readonly startMm: number;
  readonly endMm: number;
}

const FIXTURE_WIDTH: Readonly<Record<KitchenFixtureKind, number>> = {
  pia: 1200,
  cooktop: 800,
  fogao: 760,
  forno: 600,
  "lava-loucas": 600,
  geladeira: 800,
  coifa: 800,
  "torre-quente": 600,
  janela: 1200,
  porta: 800,
  quina: 900,
};

/** Aparelhos que ocupam a faixa inteira (nenhum módulo inferior embaixo). */
const FULL_HEIGHT: ReadonlySet<KitchenFixtureKind> = new Set(["geladeira", "porta", "torre-quente"]);
/** Aparelhos que impedem aéreo acima. */
const BLOCKS_UPPER: ReadonlySet<KitchenFixtureKind> = new Set(["janela", "porta", "coifa", "geladeira", "torre-quente"]);
/** Aparelhos embutidos no balcão (definem o módulo daquele trecho). */
const BASE_MODULE_OF: Partial<Record<KitchenFixtureKind, KitchenModuleKind>> = {
  pia: "balcao-pia",
  cooktop: "balcao-cooktop",
  fogao: "balcao-cooktop",
  "torre-quente": "torre-quente",
  geladeira: "torre-geladeira",
};
/** Aparelhos que geram vão de embutir (nenhuma marcenaria naquele trecho). */
const VOID_FIXTURES: ReadonlySet<KitchenFixtureKind> = new Set(["lava-loucas", "porta", "forno"]);
/** Aparelhos que puxam a coifa. */
const NEEDS_HOOD: ReadonlySet<KitchenFixtureKind> = new Set(["cooktop", "fogao"]);

function subtract(spans: readonly Span[], hole: Span): Span[] {
  const out: Span[] = [];
  for (const s of spans) {
    if (hole.endMm <= s.startMm || hole.startMm >= s.endMm) {
      out.push(s);
      continue;
    }
    if (hole.startMm > s.startMm) out.push({ startMm: s.startMm, endMm: hole.startMm });
    if (hole.endMm < s.endMm) out.push({ startMm: hole.endMm, endMm: s.endMm });
  }
  return out;
}

function overlapsSpan(a: Span, b: Span): boolean {
  return a.startMm < b.endMm - 1 && b.startMm < a.endMm - 1;
}

/**
 * Divide um trecho livre em larguras de módulo legais.
 * Preferência: menor número de módulos, nenhum abaixo do mínimo e
 * NENHUM acima do máximo (a sobra é distribuída, não empilhada no último).
 */
export function splitRun(lengthMm: number, cfg: KitchenConfig): number[] {
  const L = Math.floor(lengthMm);
  if (L < cfg.minModuleWidthMm) return [];
  const widths = [...cfg.moduleWidthsMm].sort((a, b) => b - a);
  const max = Math.min(cfg.maxModuleWidthMm, widths[0]);
  const count = Math.max(1, Math.ceil(L / max));
  const even = L / count;

  if (even >= cfg.minModuleWidthMm && even <= cfg.maxModuleWidthMm) {
    // Distribuição uniforme arredondada a 5 mm; a sobra é espalhada de 5 em
    // 5 mm pelos módulos, para nenhum deles estourar o máximo.
    const base = Math.floor(even / 5) * 5;
    const parts = Array.from({ length: count }, () => base);
    let rest = L - base * count;
    for (let i = 0; rest > 0; i = (i + 1) % count) {
      const step = Math.min(5, rest);
      if (parts[i] + step <= cfg.maxModuleWidthMm) {
        parts[i] += step;
        rest -= step;
      } else if (parts.every((p) => p + 1 > cfg.maxModuleWidthMm)) {
        parts[count - 1] += rest;
        rest = 0;
      }
    }
    return parts;
  }

  // Fallback guloso: a sobra final vai para o módulo que ainda tem folga.
  const parts: number[] = [];
  let rest = L;
  while (rest >= cfg.minModuleWidthMm) {
    const w = widths.find((v) => v <= rest) ?? cfg.minModuleWidthMm;
    parts.push(w);
    rest -= w;
  }
  for (let i = parts.length - 1; i >= 0 && rest > 0; i -= 1) {
    const room = Math.min(rest, cfg.maxModuleWidthMm - parts[i]);
    if (room > 0) {
      parts[i] += room;
      rest -= room;
    }
  }
  if (rest > 0 && parts.length > 0) parts[parts.length - 1] += rest;
  return parts;
}

function moduleMix(index: number, total: number): KitchenModuleKind {
  // Primeiro módulo livre vira gaveteiro (guarda-talheres perto da pia),
  // o restante alterna balcão / gavetão para uso real da cozinha.
  if (index === 0) return "gaveteiro";
  if (total >= 3 && index === total - 1) return "gavetao";
  return "balcao";
}

/** Módulos cuja largura é ditada pelo aparelho/quina, não pelo motor. */
export function isFixedWidthKind(kind: KitchenModuleKind): boolean {
  return (
    kind === "balcao-pia" ||
    kind === "balcao-cooktop" ||
    kind === "torre-quente" ||
    kind === "torre-geladeira" ||
    kind.startsWith("canto")
  );
}

/* ───────────────────────────── motor principal ─────────────────────────── */

interface Draft {
  wallId: string;
  level: KitchenLevel;
  kind: KitchenModuleKind;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  role: string;
  origin: KitchenPlacementOrigin;
  absorbedMm: number;
  facing: KitchenPlacement["facing"];
  extra: KitchenModuleInput;
}

export function planKitchen(input: KitchenLayoutInput): KitchenLayoutResult {
  const cfg: KitchenConfig = {
    ...KITCHEN_DEFAULT_CONFIG,
    ...(input.config ?? {}),
    ergonomics: { ...KITCHEN_DEFAULT_ERGONOMICS, ...(input.config?.ergonomics ?? {}) },
  };
  const drafts: Draft[] = [];
  const warnings: KitchenLayoutIssue[] = [];
  const dropped: string[] = [];
  const resized: string[] = [];
  const runs: KitchenCountertopRun[] = [];
  const plinthRuns: KitchenPlinthRun[] = [];
  const reservations: KitchenReservation[] = [];
  const fillers: KitchenFiller[] = [];

  const baseDefaults = {
    handle: cfg.handle,
    finishId: cfg.finishId,
    style: cfg.style,
    countertop: cfg.countertop,
    plinth: cfg.plinth,
  } as const;

  const add = (d: Omit<Draft, "absorbedMm" | "facing" | "extra"> & Partial<Pick<Draft, "absorbedMm" | "facing" | "extra">>) => {
    drafts.push({ absorbedMm: 0, facing: "parede", extra: {}, ...d });
  };

  /* ── quinas compartilhadas: UM dono por canto ────────────────────────── */
  const walls = input.walls;
  const cornerOwner = new Map<string, "start" | "end" | "none">();
  for (const w of walls) cornerOwner.set(w.id, "none");
  /** true quando a ponta é apenas o retorno de um canto de outra parede. */
  const cornerReturn = new Set<string>();
  for (let i = 0; i < walls.length; i += 1) {
    const cur = walls[i];
    const next = walls[(i + 1) % walls.length];
    const wraps = i === walls.length - 1;
    if (!cur.cornerEnd || !next.cornerStart || (wraps && walls.length < 3)) continue;
    // O canto é físico e único: a parede anterior monta o módulo,
    // a seguinte reserva o retorno (nenhuma marcenaria dentro do canto).
    cornerReturn.add(`${next.id}:start`);
  }

  for (const wall of walls) {
    const wallHeight = wall.heightMm ?? 2700;
    const wallLen = wall.lengthMm;

    /* ── 1. aparelhos resolvidos, ordenados e sem sobreposição ── */
    let cursorAuto = 0;
    const resolved = [...(wall.fixtures ?? [])]
      .map((f) => {
        const widthMm = Math.max(50, f.widthMm ?? FIXTURE_WIDTH[f.kind]);
        const atMm = f.atMm ?? cursorAuto;
        cursorAuto = atMm + widthMm;
        return { ...f, widthMm, atMm };
      })
      .sort((a, b) => a.atMm - b.atMm);

    const accepted: typeof resolved = [];
    for (const f of resolved) {
      const span: Span = { startMm: f.atMm, endMm: f.atMm + f.widthMm };
      if (span.startMm < -1 || span.endMm > wallLen + 1) {
        dropped.push(`${f.kind} não cabe na parede ${wall.id}`);
        warnings.push({
          code: "aparelho-fora",
          level: "error",
          wallId: wall.id,
          message: `${f.kind} ultrapassa o comprimento da parede.`,
        });
        continue;
      }
      // Coifa e janela convivem com o que está embaixo/atrás; os demais não.
      const physical = f.kind !== "coifa" && f.kind !== "janela";
      const clash = accepted.find(
        (o) =>
          physical &&
          o.kind !== "coifa" &&
          o.kind !== "janela" &&
          overlapsSpan(span, { startMm: o.atMm, endMm: o.atMm + o.widthMm }),
      );
      if (clash) {
        dropped.push(`${f.kind} sobrepõe ${clash.kind} na parede ${wall.id}`);
        warnings.push({
          code: "aparelho-sobreposto",
          level: "error",
          wallId: wall.id,
          message: `${f.kind} ocupa o mesmo trecho de ${clash.kind} — reposicionar um dos dois.`,
        });
        continue;
      }
      accepted.push(f);
    }

    /* ── 2. cantos e retornos ── */
    const cornerWidth = Math.min(
      cfg.maxModuleWidthMm,
      Math.max(cfg.minModuleWidthMm, Math.round((cfg.baseDepthMm + 300) / 5) * 5),
    );
    const reserved: Span[] = [];
    const placeCorner = (at: "start" | "end") => {
      const declared = at === "start" ? wall.cornerStart : wall.cornerEnd;
      if (!declared) return;
      const isReturn = cornerReturn.has(`${wall.id}:${at}`);
      const w = Math.min(cornerWidth, Math.floor(wallLen * 0.4));
      if (w < cfg.minModuleWidthMm) {
        warnings.push({
          code: "canto-impossivel",
          level: "error",
          wallId: wall.id,
          message: `Parede de ${wallLen} mm curta demais para um módulo de canto.`,
        });
        return;
      }
      const x = at === "start" ? 0 : wallLen - w;
      if (isReturn) {
        // Retorno: o canto pertence à parede vizinha; aqui só reservamos
        // a profundidade da caixa que invade este trecho.
        const rw = Math.min(cfg.baseDepthMm, w);
        reserved.push({ startMm: at === "start" ? 0 : wallLen - rw, endMm: at === "start" ? rw : wallLen });
        reservations.push({
          id: `${wall.id}-retorno-${at}`,
          wallId: wall.id,
          kind: "retorno-de-canto",
          xMm: at === "start" ? 0 : wallLen - rw,
          widthMm: rw,
          yMm: 0,
          heightMm: cfg.baseHeightMm,
          depthMm: cfg.baseDepthMm,
          note: "trecho ocupado pelo módulo de canto da parede vizinha",
        });
        warnings.push({
          code: "canto-retorno",
          level: "info",
          wallId: wall.id,
          message: `Retorno de canto de ${rw} mm reservado — o módulo de canto pertence à parede vizinha.`,
        });
        return;
      }
      const kind = (at === "start" ? wall.cornerKindStart : wall.cornerKindEnd) ?? "canto-reto";
      add({
        wallId: wall.id,
        level: "inferior",
        kind,
        xMm: x,
        yMm: 0,
        widthMm: w,
        heightMm: cfg.baseHeightMm,
        depthMm: cfg.baseDepthMm,
        role: "canto",
        origin: "canto",
      });
      reserved.push({ startMm: x, endMm: x + w });
    };
    placeCorner("start");
    placeCorner("end");

    let freeBase: Span[] = [{ startMm: 0, endMm: wallLen }];
    let freeUpper: Span[] = [{ startMm: 0, endMm: wallLen }];
    const cornerModules = drafts.filter((d) => d.wallId === wall.id && d.origin === "canto");
    for (const c of cornerModules) freeBase = subtract(freeBase, { startMm: c.xMm, endMm: c.xMm + c.widthMm });
    for (const r of reserved) freeBase = subtract(freeBase, r);
    // No nível superior a quina é resolvida por UMA das paredes: a que não é
    // dona do canto libera a profundidade do aéreo, senão os dois se cruzam.
    for (const side of ["start", "end"] as const) {
      if (!cornerReturn.has(`${wall.id}:${side}`)) continue;
      freeUpper = subtract(
        freeUpper,
        side === "start"
          ? { startMm: 0, endMm: cfg.upperDepthMm }
          : { startMm: wallLen - cfg.upperDepthMm, endMm: wallLen },
      );
    }

    /* ── 3. módulos ditados por aparelho ── */
    const hoodSpans: Span[] = [];
    for (const f of accepted) {
      const span: Span = { startMm: f.atMm, endMm: f.atMm + f.widthMm };
      const overCorner = cornerModules.some((c) => overlapsSpan(span, { startMm: c.xMm, endMm: c.xMm + c.widthMm }));
      if (overCorner || reserved.some((r) => overlapsSpan(span, r))) {
        dropped.push(`${f.kind} conflita com o canto da parede ${wall.id}`);
        warnings.push({
          code: "aparelho-no-canto",
          level: "error",
          wallId: wall.id,
          message: `${f.kind} cai dentro do módulo de canto — reposicionar.`,
        });
        continue;
      }

      const kind = BASE_MODULE_OF[f.kind];
      if (kind) {
        const level: KitchenLevel = FULL_HEIGHT.has(f.kind) ? "coluna" : "inferior";
        const depth =
          level === "coluna"
            ? f.kind === "geladeira"
              ? Math.max(cfg.baseDepthMm, 700)
              : cfg.baseDepthMm
            : cfg.baseDepthMm;
        add({
          wallId: wall.id,
          level,
          kind,
          xMm: span.startMm,
          yMm: 0,
          widthMm: f.widthMm,
          heightMm: level === "coluna" ? cfg.columnHeightMm : cfg.baseHeightMm,
          depthMm: depth,
          role: f.kind,
          origin: "aparelho",
          extra: f.kind === "pia" ? { countertop: { ...cfg.countertop, cutout: "cuba" } } : {},
        });
        freeBase = subtract(freeBase, span);

        if (f.kind === "geladeira") {
          const e = cfg.ergonomics;
          reservations.push({
            id: `${wall.id}-geladeira`,
            wallId: wall.id,
            kind: "geladeira",
            xMm: span.startMm + e.fridgeGapSideMm,
            widthMm: Math.max(100, f.widthMm - 2 * e.fridgeGapSideMm),
            yMm: 0,
            heightMm: cfg.columnHeightMm - e.fridgeGapTopMm,
            depthMm: depth - e.fridgeGapBackMm,
            note: `folgas ${e.fridgeGapSideMm} mm laterais / ${e.fridgeGapTopMm} mm superior / ${e.fridgeGapBackMm} mm traseira`,
          });
        }
        if (f.kind === "pia") {
          reservations.push({
            id: `${wall.id}-cuba`,
            wallId: wall.id,
            kind: "cuba",
            xMm: span.startMm + 60,
            widthMm: Math.max(200, f.widthMm - 120),
            yMm: cfg.baseHeightMm - 400,
            heightMm: 400,
            depthMm: cfg.baseDepthMm - 80,
            note: "cuba + sifão + área hidráulica (sem gaveta sob a cuba)",
          });
        }
        if (NEEDS_HOOD.has(f.kind)) {
          reservations.push({
            id: `${wall.id}-cooktop-${Math.round(span.startMm)}`,
            wallId: wall.id,
            kind: "cooktop",
            xMm: span.startMm + 40,
            widthMm: Math.max(200, f.widthMm - 80),
            yMm: cfg.baseHeightMm - 180,
            heightMm: 180,
            depthMm: cfg.baseDepthMm - 60,
            note: "volume técnico do cooktop — nenhuma gaveta invade esta faixa",
          });
        }
        if (f.kind === "torre-quente") {
          const e = cfg.ergonomics;
          reservations.push({
            id: `${wall.id}-forno`,
            wallId: wall.id,
            kind: "forno",
            xMm: span.startMm + 20,
            widthMm: Math.max(200, f.widthMm - 40),
            yMm: 700,
            heightMm: 600,
            depthMm: cfg.baseDepthMm - e.ovenVentMm,
            note: `nicho do forno com ${e.ovenVentMm} mm de ventilação`,
          });
          reservations.push({
            id: `${wall.id}-microondas`,
            wallId: wall.id,
            kind: "microondas",
            xMm: span.startMm + 20,
            widthMm: Math.max(200, f.widthMm - 40),
            yMm: 1300,
            heightMm: 400,
            depthMm: cfg.baseDepthMm - e.ovenVentMm,
            note: "nicho do micro-ondas",
          });
        }
      } else if (VOID_FIXTURES.has(f.kind)) {
        freeBase = subtract(freeBase, span);
        reservations.push({
          id: `${wall.id}-${f.id}`,
          wallId: wall.id,
          kind: f.kind,
          xMm: span.startMm,
          widthMm: f.widthMm,
          yMm: 0,
          heightMm: f.kind === "porta" ? (f.heightMm ?? 2100) : cfg.baseHeightMm,
          depthMm: cfg.baseDepthMm,
          note: f.kind === "porta" ? "abertura de porta — sem marcenaria e sem tampo" : "vão de embutir",
        });
        if (f.kind === "lava-loucas" && f.widthMm < cfg.ergonomics.dishwasherWidthMinMm) {
          warnings.push({
            code: "lava-loucas-estreito",
            level: "warn",
            wallId: wall.id,
            message: `Vão de ${f.widthMm} mm para a lava-louças — recomendado ${cfg.ergonomics.dishwasherWidthMinMm} mm.`,
          });
        }
      } else if (f.kind === "janela") {
        reservations.push({
          id: `${wall.id}-${f.id}`,
          wallId: wall.id,
          kind: "janela",
          xMm: span.startMm,
          widthMm: f.widthMm,
          yMm: f.sillMm ?? 1100,
          heightMm: f.heightMm ?? 1100,
          depthMm: 0,
          note: "abertura de janela — nenhum aéreo à frente",
        });
        if ((f.sillMm ?? 1100) < cfg.baseHeightMm + 20) {
          warnings.push({
            code: "janela-baixa",
            level: "warn",
            wallId: wall.id,
            message: `Peitoril a ${f.sillMm ?? 1100} mm fica abaixo da bancada — prever recorte no tampo.`,
          });
        }
      }

      if (NEEDS_HOOD.has(f.kind)) hoodSpans.push(span);
      if (f.kind === "coifa") hoodSpans.push(span);
      if (BLOCKS_UPPER.has(f.kind)) freeUpper = subtract(freeUpper, span);
    }

    /* ── 4. coifa: o vão sobre o cooktop nunca recebe aéreo ── */
    const cooktops = accepted.filter((f) => NEEDS_HOOD.has(f.kind));
    const hoods = accepted.filter((f) => f.kind === "coifa");
    for (const ck of cooktops) {
      const span: Span = { startMm: ck.atMm, endMm: ck.atMm + ck.widthMm };
      freeUpper = subtract(freeUpper, span);
      const hood = hoods.find((h) => overlapsSpan(span, { startMm: h.atMm, endMm: h.atMm + h.widthMm }));
      const center = span.startMm + ck.widthMm / 2;
      if (hood) {
        const hoodCenter = hood.atMm + hood.widthMm / 2;
        if (Math.abs(hoodCenter - center) > 60) {
          warnings.push({
            code: "coifa-desalinhada",
            level: "warn",
            wallId: wall.id,
            message: `Coifa deslocada ${Math.round(Math.abs(hoodCenter - center))} mm do centro do cooktop.`,
          });
        }
        if (hood.widthMm < ck.widthMm - 1) {
          warnings.push({
            code: "coifa-estreita",
            level: "warn",
            wallId: wall.id,
            message: `Coifa de ${hood.widthMm} mm é menor que o cooktop de ${ck.widthMm} mm.`,
          });
        }
      } else {
        warnings.push({
          code: "coifa-reservada",
          level: "info",
          wallId: wall.id,
          message: `Vão de ${ck.widthMm} mm reservado acima do cooktop para a coifa.`,
        });
      }
      const hoodY = cfg.baseHeightMm + cfg.hoodGapMm;
      reservations.push({
        id: `${wall.id}-coifa-${Math.round(span.startMm)}`,
        wallId: wall.id,
        kind: "coifa",
        xMm: hood ? hood.atMm : span.startMm,
        widthMm: hood ? hood.widthMm : ck.widthMm,
        yMm: hoodY,
        heightMm: cfg.hoodHeightMm,
        depthMm: cfg.baseDepthMm,
        note: `coifa a ${cfg.hoodGapMm} mm da bancada`,
      });
      if (hoodY + cfg.hoodHeightMm > wallHeight) {
        warnings.push({
          code: "coifa-alta",
          level: "warn",
          wallId: wall.id,
          message: "Coifa ultrapassa o pé-direito — reduzir a altura de instalação.",
        });
      }
    }

    /* ── 5. balcões nos trechos livres ── */
    for (const seg of freeBase) {
      const parts = splitRun(seg.endMm - seg.startMm, cfg);
      if (parts.length === 0) continue;
      let x = seg.startMm;
      parts.forEach((w, i) => {
        add({
          wallId: wall.id,
          level: "inferior",
          kind: moduleMix(i, parts.length),
          xMm: x,
          yMm: 0,
          widthMm: w,
          heightMm: cfg.baseHeightMm,
          depthMm: cfg.baseDepthMm,
          role: "balcão",
          origin: "automatico",
        });
        x += w;
      });
    }

    /* ── 5b. módulo colado na quina não pode ser de gaveta ──
     * A gaveta precisa de curso livre; encostada no canto ela bate no
     * módulo perpendicular. Ali entra porta, que abre para fora. */
    {
      const clearance = cfg.ergonomics.cornerDrawerClearanceMm;
      const cornerEdges: number[] = [
        ...cornerModules.flatMap((c) => [c.xMm, c.xMm + c.widthMm]),
        ...reserved.flatMap((r) => [r.startMm, r.endMm]),
      ];
      for (const d of drafts) {
        if (d.wallId !== wall.id || d.origin !== "automatico" || d.level !== "inferior") continue;
        if (d.kind !== "gaveteiro" && d.kind !== "gavetao") continue;
        const touches = cornerEdges.some(
          (edge) => Math.abs(edge - d.xMm) < clearance || Math.abs(edge - (d.xMm + d.widthMm)) < clearance,
        );
        if (touches) d.kind = "balcao";
      }
    }

    /* ── 6. sobras: o vizinho absorve; o resto vira tamponamento ── */
    const isBlocked = (s: Span) =>
      reservations.some(
        (r) =>
          r.wallId === wall.id &&
          r.depthMm > 0 &&
          r.kind !== "coifa" &&
          r.kind !== "janela" &&
          r.kind !== "cuba" &&
          r.kind !== "cooktop" &&
          r.kind !== "forno" &&
          r.kind !== "microondas" &&
          overlapsSpan(s, { startMm: r.xMm, endMm: r.xMm + r.widthMm }),
      );

    const wallBases = () =>
      drafts
        .filter((d) => d.wallId === wall.id && (d.level === "inferior" || d.level === "coluna"))
        .sort((a, b) => a.xMm - b.xMm);

    const gaps: Span[] = [];
    {
      const bases = wallBases();
      let cursor = 0;
      for (const b of bases) {
        if (b.xMm > cursor + 1) gaps.push({ startMm: cursor, endMm: b.xMm });
        cursor = Math.max(cursor, b.xMm + b.widthMm);
      }
      if (cursor < wallLen - 1) gaps.push({ startMm: cursor, endMm: wallLen });
    }

    for (const gap of gaps) {
      const width = gap.endMm - gap.startMm;
      if (width < 2 || isBlocked(gap)) continue;
      const bases = wallBases();
      const left = bases.find((b) => Math.abs(b.xMm + b.widthMm - gap.startMm) < 2);
      const right = bases.find((b) => Math.abs(b.xMm - gap.endMm) < 2);
      // Prefere alargar um módulo automático; se não houver, alarga o módulo
      // do aparelho (a caixa pode ser maior que o eletrodoméstico).
      const pickable = [left, right].filter(
        (b): b is Draft => !!b && b.level !== "coluna" && b.widthMm + width <= cfg.maxModuleWidthMm + (isFixedWidthKind(b.kind) ? 600 : 0),
      );
      const target =
        pickable.find((b) => b.origin === "automatico") ?? (width <= cfg.maxAbsorbMm ? pickable[0] : undefined);
      if (target) {
        if (target === left) target.widthMm += width;
        else {
          target.xMm -= width;
          target.widthMm += width;
        }
        target.absorbedMm += width;
        resized.push(`${wall.id}:${target.kind}@${target.xMm} +${Math.round(width)} mm`);
        continue;
      }
      fillers.push({ wallId: wall.id, xMm: gap.startMm, widthMm: width, heightMm: cfg.baseHeightMm });
      warnings.push({
        code: "tamponamento",
        level: "info",
        wallId: wall.id,
        message: `Tamponamento de ${Math.round(width)} mm em ${Math.round(gap.startMm)} mm.`,
      });
    }

    /* ── 7. aéreos nos trechos liberados ── */
    const upperY = cfg.baseHeightMm + cfg.upperGapMm;
    let upperHeight = cfg.upperHeightMm;
    if (upperY + upperHeight > wallHeight) {
      const fit = wallHeight - upperY;
      if (fit < 350) {
        warnings.push({
          code: "aereo-sem-espaco",
          level: "warn",
          wallId: wall.id,
          message: `Sem altura para aéreo (pé-direito ${wallHeight} mm) — aéreos descartados nesta parede.`,
        });
        dropped.push(`aéreos da parede ${wall.id}`);
        upperHeight = 0;
      } else {
        upperHeight = Math.floor(fit);
        warnings.push({
          code: "aereo-reduzido",
          level: "warn",
          wallId: wall.id,
          message: `Altura do aéreo reduzida para ${upperHeight} mm pelo pé-direito.`,
        });
        resized.push(`${wall.id}:aéreos → ${upperHeight} mm`);
      }
    }
    if (upperHeight > 0) {
      for (const seg of freeUpper) {
        const parts = splitRun(seg.endMm - seg.startMm, cfg);
        let x = seg.startMm;
        parts.forEach((w, i) => {
          const kind: KitchenModuleKind = i === 0 && parts.length > 2 ? "aereo-vidro" : "aereo";
          add({
            wallId: wall.id,
            level: "superior",
            kind,
            xMm: x,
            yMm: upperY,
            widthMm: w,
            heightMm: upperHeight,
            depthMm: cfg.upperDepthMm,
            role: "aéreo",
            origin: "automatico",
          });
          x += w;
        });
      }
    }

    /* ── 8. trechos contínuos de bancada e de rodapé ── */
    const bases = drafts
      .filter((d) => d.wallId === wall.id && d.level === "inferior")
      .sort((a, b) => a.xMm - b.xMm);
    const ctThickness = cfg.countertop.thicknessMm ?? 20;
    const overhang = cfg.countertop.overhangFrontMm ?? 20;
    let run: { start: number; end: number } | null = null;
    const flushRun = () => {
      if (!run) return;
      const { start, end } = run;
      runs.push({
        wallId: wall.id,
        startMm: start,
        endMm: end,
        lengthMm: end - start,
        depthMm: cfg.baseDepthMm,
        material: String(cfg.countertop.material ?? "granito"),
        thicknessMm: ctThickness,
        overhangFrontMm: overhang,
        joinStart: start <= 1 && !!wall.cornerStart,
        joinEnd: end >= wallLen - 1 && !!wall.cornerEnd,
      });
      run = null;
    };
    for (const p of bases) {
      if (String(cfg.countertop.material ?? "granito") === "nenhum") break;
      if (run && Math.abs(run.end - p.xMm) <= 2) run = { start: run.start, end: p.xMm + p.widthMm };
      else {
        flushRun();
        run = { start: p.xMm, end: p.xMm + p.widthMm };
      }
    }
    flushRun();

    const plinthKind = String(cfg.plinth.kind ?? "pvc");
    if (plinthKind !== "nenhum") {
      const withPlinth = drafts
        .filter((d) => d.wallId === wall.id && (d.level === "inferior" || d.level === "coluna"))
        .sort((a, b) => a.xMm - b.xMm);
      let pr: { start: number; end: number } | null = null;
      const flushPlinth = () => {
        if (!pr) return;
        plinthRuns.push({
          wallId: wall.id,
          startMm: pr.start,
          endMm: pr.end,
          lengthMm: pr.end - pr.start,
          kind: plinthKind,
          heightMm: cfg.plinth.heightMm ?? 100,
          recessMm: cfg.plinth.recessMm ?? 50,
        });
        pr = null;
      };
      for (const p of withPlinth) {
        if (pr && Math.abs(pr.end - p.xMm) <= 2) pr = { start: pr.start, end: p.xMm + p.widthMm };
        else {
          flushPlinth();
          pr = { start: p.xMm, end: p.xMm + p.widthMm };
        }
      }
      flushPlinth();
    }
  }

  /* ── ilha ── */
  if (input.island && input.island.lengthMm >= 800) {
    const isl = input.island;
    const totalDepth = isl.depthMm ?? 900;
    const moduleDepth = Math.max(300, Math.min(isl.moduleDepthMm ?? Math.min(cfg.baseDepthMm, totalDepth), totalDepth));
    const overhang = Math.max(0, isl.overhangMm ?? totalDepth - moduleDepth);
    const facing: KitchenPlacement["facing"] = isl.facing === "dupla" ? "dupla" : "frente";
    const parts = splitRun(isl.lengthMm, cfg);
    let x = 0;
    parts.forEach((w, i) => {
      // Cooktop numa ponta e cuba na outra: preserva a área de preparo.
      const last = parts.length - 1;
      const kind: KitchenModuleKind =
        isl.hasCooktop && i === 0
          ? "balcao-cooktop"
          : isl.hasSink && i === (parts.length > 1 ? last : 0) && !(isl.hasCooktop && last === 0)
            ? "balcao-pia"
            : "gavetao";
      add({
        wallId: "ilha",
        level: "inferior",
        kind,
        xMm: x,
        yMm: 0,
        widthMm: w,
        heightMm: cfg.baseHeightMm,
        depthMm: moduleDepth,
        role: "ilha",
        origin: "ilha",
        facing,
      });
      x += w;
    });
    runs.push({
      wallId: "ilha",
      startMm: 0,
      endMm: isl.lengthMm,
      lengthMm: isl.lengthMm,
      depthMm: totalDepth,
      material: String(cfg.countertop.material ?? "granito"),
      thicknessMm: cfg.countertop.thicknessMm ?? 20,
      overhangFrontMm: overhang,
      joinStart: false,
      joinEnd: false,
    });
    if (String(cfg.plinth.kind ?? "pvc") !== "nenhum") {
      plinthRuns.push({
        wallId: "ilha",
        startMm: 0,
        endMm: isl.lengthMm,
        lengthMm: isl.lengthMm,
        kind: String(cfg.plinth.kind ?? "pvc"),
        heightMm: cfg.plinth.heightMm ?? 100,
        recessMm: cfg.plinth.recessMm ?? 50,
      });
    }
    if (overhang > 0) {
      reservations.push({
        id: "ilha-balanco",
        wallId: "ilha",
        kind: "balanco",
        xMm: 0,
        widthMm: isl.lengthMm,
        yMm: cfg.baseHeightMm,
        heightMm: cfg.countertop.thicknessMm ?? 20,
        depthMm: overhang,
        note: `balanço de ${overhang} mm para banquetas`,
      });
    }
    if (isl.clearanceMm !== undefined && isl.clearanceMm < cfg.ergonomics.walkwayMinMm) {
      warnings.push({
        code: "circulacao-ilha",
        level: "warn",
        message: `Circulação de ${isl.clearanceMm} mm entre ilha e bancada — recomendado ${cfg.ergonomics.walkwayMinMm} mm.`,
      });
    }
  } else if (input.island) {
    warnings.push({
      code: "ilha-curta",
      level: "warn",
      message: "Ilha abaixo de 800 mm — não comporta módulo útil.",
    });
    dropped.push("ilha");
  }

  /* ── finalização ── */
  const placements: KitchenPlacement[] = drafts.map((d) => {
    const spec = normalizeKitchenModule({
      ...baseDefaults,
      ...d.extra,
      kind: d.kind,
      widthMm: Math.round(d.widthMm),
      heightMm: Math.round(d.heightMm),
      depthMm: Math.round(d.depthMm),
    });
    return {
      id: `${d.wallId}-${d.level}-${Math.round(d.xMm)}`,
      wallId: d.wallId,
      level: d.level,
      kind: d.kind,
      xMm: Math.round(d.xMm),
      yMm: Math.round(d.yMm),
      widthMm: Math.round(d.widthMm),
      heightMm: Math.round(d.heightMm),
      depthMm: Math.round(d.depthMm),
      spec,
      role: d.role,
      origin: d.origin,
      absorbedMm: Math.round(d.absorbedMm),
      facing: d.facing,
    };
  });

  return {
    id: input.id ?? "cozinha",
    shape: input.shape,
    config: cfg,
    walls: input.walls,
    placements,
    countertopRuns: runs,
    plinthRuns,
    reservations,
    fillers,
    warnings,
    dropped,
    resized,
    totals: {
      moduleCount: placements.length,
      baseCount: placements.filter((p) => p.level === "inferior").length,
      upperCount: placements.filter((p) => p.level === "superior").length,
      columnCount: placements.filter((p) => p.level === "coluna").length,
      countertopLengthMm: runs.reduce((a, r) => a + r.lengthMm, 0),
      plinthLengthMm: plinthRuns.reduce((a, r) => a + r.lengthMm, 0),
      linearMetersMm: input.walls.reduce((a, w) => a + w.lengthMm, 0),
    },
  };
}
