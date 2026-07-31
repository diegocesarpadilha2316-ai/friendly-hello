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

export interface KitchenFixture {
  readonly id: string;
  readonly kind: KitchenFixtureKind;
  /** Posição da borda esquerda na parede (mm). Ausente = o motor decide. */
  readonly atMm?: number;
  readonly widthMm?: number;
  /** Altura do peitoril (janela) a partir do piso. */
  readonly sillMm?: number;
}

export interface KitchenWall {
  readonly id: string;
  readonly lengthMm: number;
  readonly heightMm?: number;
  readonly fixtures?: readonly KitchenFixture[];
  /** A parede começa numa quina interna (canto compartilhado). */
  readonly cornerStart?: boolean;
  readonly cornerEnd?: boolean;
}

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
};

export interface KitchenIsland {
  readonly lengthMm: number;
  readonly depthMm?: number;
  readonly hasCooktop?: boolean;
  readonly hasSink?: boolean;
}

export interface KitchenLayoutInput {
  readonly id?: string;
  readonly shape: KitchenShape;
  readonly walls: readonly KitchenWall[];
  readonly island?: KitchenIsland;
  readonly config?: Partial<KitchenConfig>;
}

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
  readonly placements: readonly KitchenPlacement[];
  readonly countertopRuns: readonly KitchenCountertopRun[];
  readonly warnings: readonly KitchenLayoutIssue[];
  readonly dropped: readonly string[];
  readonly totals: {
    readonly moduleCount: number;
    readonly baseCount: number;
    readonly upperCount: number;
    readonly columnCount: number;
    readonly countertopLengthMm: number;
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

/**
 * Divide um trecho livre em larguras de módulo legais.
 * Preferência: menor número de módulos, sem nenhum abaixo do mínimo.
 */
export function splitRun(lengthMm: number, cfg: KitchenConfig): number[] {
  const L = Math.floor(lengthMm);
  if (L < cfg.minModuleWidthMm) return [];
  const widths = [...cfg.moduleWidthsMm].sort((a, b) => b - a);
  const max = widths[0];
  const count = Math.max(1, Math.ceil(L / max));
  const even = L / count;
  if (even >= cfg.minModuleWidthMm && even <= cfg.maxModuleWidthMm) {
    // Distribuição uniforme, arredondada a 5 mm, com sobra no último módulo.
    const base = Math.floor(even / 5) * 5;
    const parts = Array.from({ length: count }, () => base);
    parts[count - 1] += L - base * count;
    return parts;
  }
  // Fallback guloso.
  const parts: number[] = [];
  let rest = L;
  while (rest >= cfg.minModuleWidthMm) {
    const w = widths.find((v) => v <= rest) ?? cfg.minModuleWidthMm;
    parts.push(w);
    rest -= w;
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

/* ───────────────────────────── motor principal ─────────────────────────── */

export function planKitchen(input: KitchenLayoutInput): KitchenLayoutResult {
  const cfg: KitchenConfig = { ...KITCHEN_DEFAULT_CONFIG, ...(input.config ?? {}) };
  const placements: KitchenPlacement[] = [];
  const warnings: KitchenLayoutIssue[] = [];
  const dropped: string[] = [];
  const runs: KitchenCountertopRun[] = [];

  const baseSpecDefaults = {
    handle: cfg.handle,
    finishId: cfg.finishId,
    style: cfg.style,
    countertop: cfg.countertop,
    plinth: cfg.plinth,
  } as const;

  const push = (
    wallId: string,
    level: KitchenLevel,
    kind: KitchenModuleKind,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
    depthMm: number,
    role: string,
    extra: KitchenModuleInput = {},
  ) => {
    const spec = normalizeKitchenModule({
      ...baseSpecDefaults,
      ...extra,
      kind,
      widthMm,
      heightMm,
      depthMm,
    });
    placements.push({
      id: `${wallId}-${level}-${Math.round(xMm)}`,
      wallId,
      level,
      kind,
      xMm: Math.round(xMm),
      yMm: Math.round(yMm),
      widthMm: Math.round(widthMm),
      heightMm: Math.round(heightMm),
      depthMm: Math.round(depthMm),
      spec,
      role,
    });
  };

  for (const wall of input.walls) {
    const fixtures = [...(wall.fixtures ?? [])];
    let cursorAuto = 0;
    const resolved = fixtures.map((f) => {
      const widthMm = f.widthMm ?? FIXTURE_WIDTH[f.kind];
      const atMm = f.atMm ?? cursorAuto;
      cursorAuto = atMm + widthMm;
      return { ...f, widthMm, atMm };
    });

    // Quina: reserva o módulo de canto no início/fim da parede.
    const cornerSpans: Span[] = [];
    if (wall.cornerStart) {
      const w = Math.min(900, wall.lengthMm * 0.35);
      push(wall.id, "inferior", "canto-reto", 0, 0, w, cfg.baseHeightMm, cfg.baseDepthMm, "canto");
      cornerSpans.push({ startMm: 0, endMm: w });
    }
    if (wall.cornerEnd) {
      const w = Math.min(900, wall.lengthMm * 0.35);
      push(wall.id, "inferior", "canto-diagonal", wall.lengthMm - w, 0, w, cfg.baseHeightMm, cfg.baseDepthMm, "canto");
      cornerSpans.push({ startMm: wall.lengthMm - w, endMm: wall.lengthMm });
    }

    let freeBase: Span[] = [{ startMm: 0, endMm: wall.lengthMm }];
    let freeUpper: Span[] = [{ startMm: 0, endMm: wall.lengthMm }];
    for (const c of cornerSpans) {
      freeBase = subtract(freeBase, c);
      freeUpper = subtract(freeUpper, c);
    }

    for (const f of resolved) {
      const span: Span = { startMm: f.atMm, endMm: f.atMm + f.widthMm };
      if (span.endMm > wall.lengthMm + 1) {
        dropped.push(`${f.kind} não cabe na parede ${wall.id}`);
        warnings.push({
          code: "aparelho-fora",
          level: "error",
          wallId: wall.id,
          message: `${f.kind} ultrapassa o comprimento da parede.`,
        });
        continue;
      }

      const kind = BASE_MODULE_OF[f.kind];
      if (kind) {
        const level: KitchenLevel = FULL_HEIGHT.has(f.kind) ? "coluna" : "inferior";
        push(
          wall.id,
          level,
          kind,
          span.startMm,
          0,
          f.widthMm,
          level === "coluna" ? cfg.columnHeightMm : cfg.baseHeightMm,
          level === "coluna" ? Math.max(cfg.baseDepthMm, f.kind === "geladeira" ? 700 : cfg.baseDepthMm) : cfg.baseDepthMm,
          f.kind,
          f.kind === "pia" ? { countertop: { ...cfg.countertop, cutout: "cuba" } } : undefined,
        );
        freeBase = subtract(freeBase, span);
      } else if (FULL_HEIGHT.has(f.kind) || f.kind === "lava-loucas") {
        // Vão de embutir (lava-louças, porta): nenhum módulo ali.
        freeBase = subtract(freeBase, span);
      }

      if (BLOCKS_UPPER.has(f.kind)) freeUpper = subtract(freeUpper, span);
    }

    /* ── balcões nos trechos livres ── */
    for (const seg of freeBase) {
      const parts = splitRun(seg.endMm - seg.startMm, cfg);
      if (parts.length === 0) {
        if (seg.endMm - seg.startMm > 60) {
          warnings.push({
            code: "vao-morto",
            level: "warn",
            wallId: wall.id,
            message: `Sobra de ${Math.round(seg.endMm - seg.startMm)} mm sem módulo — prever tamponamento.`,
          });
        }
        continue;
      }
      let x = seg.startMm;
      parts.forEach((w, i) => {
        push(wall.id, "inferior", moduleMix(i, parts.length), x, 0, w, cfg.baseHeightMm, cfg.baseDepthMm, "balcão");
        x += w;
      });
    }

    /* ── aéreos nos trechos liberados ── */
    const upperY = cfg.baseHeightMm + cfg.upperGapMm;
    for (const seg of freeUpper) {
      const parts = splitRun(seg.endMm - seg.startMm, cfg);
      let x = seg.startMm;
      parts.forEach((w, i) => {
        const kind: KitchenModuleKind = i === 0 && parts.length > 2 ? "aereo-vidro" : "aereo";
        push(wall.id, "superior", kind, x, upperY, w, cfg.upperHeightMm, cfg.upperDepthMm, "aéreo");
        x += w;
      });
      if (upperY + cfg.upperHeightMm > (wall.heightMm ?? 2700)) {
        warnings.push({
          code: "aereo-alto",
          level: "warn",
          wallId: wall.id,
          message: "Aéreo ultrapassa o pé-direito — reduzir altura ou o vão da bancada.",
        });
      }
    }

    /* ── trechos contínuos de bancada ── */
    const bases = placements
      .filter((p) => p.wallId === wall.id && p.level === "inferior")
      .sort((a, b) => a.xMm - b.xMm);
    let run: { start: number; end: number } | null = null;
    const flush = () => {
      if (!run) return;
      const length = run.end - run.start;
      runs.push({
        wallId: wall.id,
        startMm: run.start,
        endMm: run.end,
        lengthMm: length,
        depthMm: cfg.baseDepthMm,
        material: String(cfg.countertop.material ?? "granito"),
        thicknessMm: bases[0]?.spec.countertop.thicknessMm ?? 20,
      });
      run = null;
    };
    for (const p of bases) {
      if (p.spec.countertop.material === "nenhum") {
        flush();
        continue;
      }
      if (run && Math.abs(run.end - p.xMm) <= 2) run = { start: run.start, end: p.xMm + p.widthMm };
      else {
        flush();
        run = { start: p.xMm, end: p.xMm + p.widthMm };
      }
    }
    flush();
  }

  /* ── ilha ── */
  if (input.island && input.island.lengthMm >= 800) {
    const isl = input.island;
    const depth = isl.depthMm ?? 900;
    const parts = splitRun(isl.lengthMm, cfg);
    let x = 0;
    parts.forEach((w, i) => {
      const kind: KitchenModuleKind =
        isl.hasCooktop && i === 0 ? "balcao-cooktop" : isl.hasSink && i === 1 ? "balcao-pia" : "gavetao";
      push("ilha", "inferior", kind, x, 0, w, cfg.baseHeightMm, depth, "ilha");
      x += w;
    });
    runs.push({
      wallId: "ilha",
      startMm: 0,
      endMm: isl.lengthMm,
      lengthMm: isl.lengthMm,
      depthMm: depth,
      material: String(cfg.countertop.material ?? "granito"),
      thicknessMm: 20,
    });
  } else if (input.island) {
    warnings.push({
      code: "ilha-curta",
      level: "warn",
      message: "Ilha abaixo de 800 mm — não comporta módulo útil.",
    });
    dropped.push("ilha");
  }

  const baseCount = placements.filter((p) => p.level === "inferior").length;
  const upperCount = placements.filter((p) => p.level === "superior").length;
  const columnCount = placements.filter((p) => p.level === "coluna").length;

  return {
    id: input.id ?? "cozinha",
    shape: input.shape,
    config: cfg,
    placements,
    countertopRuns: runs,
    warnings,
    dropped,
    totals: {
      moduleCount: placements.length,
      baseCount,
      upperCount,
      columnCount,
      countertopLengthMm: runs.reduce((a, r) => a + r.lengthMm, 0),
      linearMetersMm: input.walls.reduce((a, w) => a + w.lengthMm, 0),
    },
  };
}