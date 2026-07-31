/**
 * ROTEAMENTO DE RENDERER — decide, por instância, se um móvel é da família
 * roupeiro (Biblioteca Construtiva → `WardrobeMesh`) ou se ainda segue no
 * caminho legado (`CabinetMesh`).
 *
 * Projetos antigos gravaram o mesmo móvel com nomes diferentes
 * ("roupeiro", "guarda-roupa", "guarda roupa", "wardrobe", "closet",
 * "armario"), às vezes só no `catalogItemId`. Sem normalizar, o roupeiro
 * caía no renderer antigo — que não tem intertravamento — e a gaveta
 * atravessava a porta.
 *
 * Nada aqui altera dados: a conversão é feita SEMPRE em memória.
 */

export type FurnitureRenderer = "wardrobe" | "dresser" | "cabinet";

export interface RendererDecisionInput {
  readonly id?: string;
  readonly subtype?: string;
  readonly catalogItemId?: string;
  readonly params?: Readonly<Record<string, string | number | boolean | null | undefined>>;
}

export interface RendererDecision {
  readonly renderer: FurnitureRenderer;
  /** Tipo identificado após normalização (ex.: "guarda-roupa"). */
  readonly resolvedType: string;
  /** O móvel veio no formato antigo (params soltos `mod:*` / `eng:*`). */
  readonly legacyConverted: boolean;
  /** Por que caiu no renderer escolhido. */
  readonly reason: string;
}

/** minúsculas, sem acento, separadores unificados em "-". */
export function normalizeSubtype(value: string | undefined | null): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, "-")
    .replace(/-+/g, "-");
}

/** Nomes que sempre significam roupeiro. */
const WARDROBE_ALIASES = new Set([
  "roupeiro",
  "roupeiros",
  "guarda-roupa",
  "guarda-roupas",
  "guardaroupa",
  "guardaroupas",
  "wardrobe",
  "closet-fechado",
  "armario-roupeiro",
]);

/** Nomes ambíguos: só viram roupeiro quando o móvel é fechado e alto. */
const AMBIGUOUS = new Set(["closet", "armario", "armario-alto", "guarda-volumes"]);

const CATALOG_HINT = /(roupeiro|guarda[-_ ]?roupa|wardrobe|closet)/i;

/** Nomes que sempre significam gaveteiro (família convertida). */
const DRESSER_ALIASES = new Set([
  "gaveteiro",
  "gaveteiros",
  "comoda",
  "comodas",
  "dresser",
  "drawer-unit",
]);

const DRESSER_CATALOG_HINT = /(gaveteir|comoda|dresser)/i;

function numParam(
  params: RendererDecisionInput["params"],
  ...keys: string[]
): number | undefined {
  for (const k of keys) {
    const v = params?.[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function textParam(
  params: RendererDecisionInput["params"],
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = params?.[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

/** O móvel tem frente (porta/correr)? Closet aberto continua no caminho antigo. */
export function hasFront(params: RendererDecisionInput["params"]): boolean {
  const front = normalizeSubtype(textParam(params, "eng:front", "frontType"));
  if (front === "aberto") return false;
  const opening = normalizeSubtype(textParam(params, "mod:opening", "opening", "abertura"));
  if (opening === "sem-porta") return false;
  const doors = numParam(params, "mod:doors", "doors", "eng:doors", "portas");
  if (doors !== undefined) return doors > 0;
  return opening !== "" || front !== "";
}

/** Params soltos do formato antigo. */
export function hasLegacyParams(params: RendererDecisionInput["params"]): boolean {
  if (!params) return false;
  return Object.keys(params).some((k) => k.startsWith("mod:") || k.startsWith("eng:"));
}

/** Compatibilidade: mantém a assinatura usada pelo restante do Planner. */
export function isWardrobeSubtype(subtype: string | undefined): boolean {
  return WARDROBE_ALIASES.has(normalizeSubtype(subtype));
}

/**
 * Decisão definitiva de roteamento. Ordem:
 * 1. alias explícito de roupeiro;
 * 2. dica no `catalogItemId` (projetos antigos salvos como "armario" genérico);
 * 3. nome ambíguo (closet/armário) fechado → roupeiro;
 * 4. qualquer outro caso → `CabinetMesh`.
 */
export function resolveFurnitureRenderer(input: RendererDecisionInput): RendererDecision {
  const subtype = normalizeSubtype(input.subtype);
  const catalog = input.catalogItemId ?? "";
  const legacyConverted = hasLegacyParams(input.params);

  if (WARDROBE_ALIASES.has(subtype)) {
    return {
      renderer: "wardrobe",
      resolvedType: subtype,
      legacyConverted,
      reason: `subtype "${input.subtype}" é alias de roupeiro`,
    };
  }

  if (CATALOG_HINT.test(catalog)) {
    return {
      renderer: "wardrobe",
      resolvedType: "roupeiro",
      legacyConverted,
      reason: `catalogItemId "${catalog}" identifica roupeiro`,
    };
  }

  if (DRESSER_ALIASES.has(subtype)) {
    return {
      renderer: "dresser",
      resolvedType: subtype,
      legacyConverted,
      reason: `subtype "${input.subtype}" é alias de gaveteiro`,
    };
  }

  if (DRESSER_CATALOG_HINT.test(catalog)) {
    return {
      renderer: "dresser",
      resolvedType: "gaveteiro",
      legacyConverted,
      reason: `catalogItemId "${catalog}" identifica gaveteiro`,
    };
  }

  if (AMBIGUOUS.has(subtype)) {
    if (hasFront(input.params)) {
      return {
        renderer: "wardrobe",
        resolvedType: "roupeiro",
        legacyConverted,
        reason: `subtype "${input.subtype}" fechado (com frente) tratado como roupeiro`,
      };
    }
    return {
      renderer: "cabinet",
      resolvedType: subtype,
      legacyConverted,
      reason: `subtype "${input.subtype}" sem frente — família aberta ainda não convertida`,
    };
  }

  return {
    renderer: "cabinet",
    resolvedType: subtype || "modulo",
    legacyConverted,
    reason: `subtype "${input.subtype ?? "—"}" não pertence à família roupeiro`,
  };
}

const logged = new Set<string>();

/** Indicador temporário de desenvolvimento (uma linha por móvel). */
export function logRendererDecision(id: string, decision: RendererDecision): void {
  if (!import.meta.env?.DEV) return;
  const key = `${id}:${decision.renderer}:${decision.resolvedType}`;
  if (logged.has(key)) return;
  logged.add(key);
  // eslint-disable-next-line no-console
  console.info("[planner:renderer]", {
    id,
    tipo: decision.resolvedType,
    renderer:
      decision.renderer === "wardrobe"
        ? "WardrobeMesh"
        : decision.renderer === "dresser"
          ? "DresserMesh"
          : "CabinetMesh",
    conversaoLegada: decision.legacyConverted,
    motivoFallback: decision.renderer === "cabinet" ? decision.reason : null,
    motivo: decision.reason,
  });
}