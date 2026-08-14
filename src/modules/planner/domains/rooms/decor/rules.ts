/**
 * Fase 3.8 — IA Decoradora: motor de regras determinístico.
 *
 * Analisa o cômodo (tipo, tamanho, circulação, móveis existentes, paleta)
 * e devolve um `DecorPlan` — lista de sugestões escoradas por afinidade
 * ao estilo, contexto e disponibilidade de espaço. Este motor é o ponto
 * único de decisão local; quando a IA real for plugada, ela devolverá
 * o mesmo shape, sem tocar em consumidores.
 */
import type { PlannerRoom } from "@/modules/planner/shared/types/project";
import { DECOR_ITEMS } from "./catalog";
import { DECOR_LIGHTING_SCENES } from "./lighting";
import { DECOR_MATERIALS } from "./materials";
import { getDecorStyle } from "./styles";
import type { DecorContext, DecorItem, DecorPlan, DecorStyleId, DecorSuggestion } from "./types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Extrai contexto quantitativo do cômodo atual. */
export function analyzeRoom(room: PlannerRoom): DecorContext {
  const width = room.dimensions.width;
  const depth = room.dimensions.depth;
  const areaM2 = Math.max(0, (width * depth) / 1_000_000);
  const perimeter = 2 * (width + depth);

  let walls = 0;
  let doors = 0;
  let windows = 0;
  let furniture = 0;
  let lighting = 0;
  const palette = new Set<string>();

  for (const id of room.nodeOrder) {
    const node = room.nodes[id];
    if (!node) continue;
    if (node.kind === "wall") walls += 1;
    if (node.kind === "opening") {
      const role = node.params["role"];
      if (role === "door") doors += 1;
      if (role === "window") windows += 1;
    }
    if (node.kind === "module") {
      const aiKind = node.params["ai:kind"];
      if (
        aiKind === "decor.luminaria" ||
        aiKind === "decor.pendente" ||
        aiKind === "decor.abajur"
      ) {
        lighting += 1;
      } else {
        furniture += 1;
      }
      const color = node.params["color"];
      if (typeof color === "string" && color.startsWith("#")) palette.add(color);
    }
  }

  return {
    roomType: room.type,
    areaM2,
    perimeterMm: perimeter,
    hasWalls: walls > 0,
    hasDoors: doors > 0,
    hasWindows: windows > 0,
    existingFurnitureCount: furniture,
    existingLightingCount: lighting,
    existingPalette: [...palette],
    circulationMm: Math.max(0, Math.min(width, depth) - 800), // aproxima circulação livre
  };
}

function scoreItem(item: DecorItem, styleId: DecorStyleId, context: DecorContext): number {
  let score = 0;
  if (item.styles.includes(styleId)) score += 3;
  // aderência ao tipo do cômodo
  const style = getDecorStyle(styleId);
  if (style.suitedFor.includes(context.roomType)) score += 1;
  // ambientes pequenos → penalizar peças principais grandes
  const footprint = (item.defaults.width * item.defaults.depth) / 1_000_000;
  if (context.areaM2 < 12 && item.role === "principal" && footprint > 2.2) score -= 2;
  // ambientes grandes → priorizar peças principais
  if (context.areaM2 >= 20 && item.role === "principal") score += 1;
  // se já há muita mobília, priorizar decoração e verde
  if (context.existingFurnitureCount >= 4 && (item.role === "decoracao" || item.role === "verde"))
    score += 2;
  // se não há iluminação, priorizar luminárias
  if (context.existingLightingCount === 0 && item.role === "luminaria") score += 2;
  return score;
}

function pickPositions(count: number, room: PlannerRoom): Array<{ x: number; y: number }> {
  const w = room.dimensions.width;
  const d = room.dimensions.depth;
  const positions: Array<{ x: number; y: number }> = [];
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + 1) * w) / (cols + 1);
      const y = ((r + 1) * d) / (rows + 1);
      positions.push({ x, y });
      if (positions.length >= count) return positions;
    }
  }
  return positions;
}

export interface GeneratePlanOptions {
  /** Número máximo de sugestões de itens (padrão: 8). */
  maxItems?: number;
  /** Incluir cena de iluminação se possível. */
  includeLighting?: boolean;
  /** Incluir amostras de materiais. */
  includeMaterials?: boolean;
  /** Incluir paleta. */
  includePalette?: boolean;
  /** Provider identificador (registrado apenas no plano). */
  provider?: string;
}

/**
 * Gera um `DecorPlan` determinístico a partir do estilo escolhido e do
 * cômodo analisado. Nenhum efeito colateral — chamador aplica via
 * `applyPlanToProject` (adapter).
 */
export function generateDecorPlan(
  room: PlannerRoom,
  styleId: DecorStyleId,
  options: GeneratePlanOptions = {},
): DecorPlan {
  const context = analyzeRoom(room);
  const style = getDecorStyle(styleId);
  const maxItems = options.maxItems ?? 8;

  const ranked = DECOR_ITEMS.map((it) => ({ item: it, score: scoreItem(it, styleId, context) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);

  const positions = pickPositions(ranked.length, room);
  const suggestions: DecorSuggestion[] = ranked.map((r, i) => ({
    id: uid("sug"),
    target: "item",
    title: r.item.name,
    reason: `Combina com o estilo ${style.name} — papel ${r.item.role} (score ${r.score}).`,
    score: r.score,
    status: "pending",
    itemId: r.item.id,
    at: positions[i],
    rotation: 0,
  }));

  if (options.includeLighting !== false) {
    const scene = DECOR_LIGHTING_SCENES.filter(
      (s) => s.styles.includes(styleId) && s.suitedFor.includes(context.roomType),
    ).sort((a, b) => b.emitters.length - a.emitters.length)[0];
    if (scene) {
      suggestions.push({
        id: uid("sug"),
        target: "lighting",
        title: scene.name,
        reason: scene.description,
        score: 5,
        status: "pending",
        lightingSceneId: scene.id,
      });
    }
  }

  if (options.includeMaterials !== false) {
    const materials = DECOR_MATERIALS.filter((m) => m.styles.includes(styleId)).slice(0, 3);
    for (const m of materials) {
      suggestions.push({
        id: uid("sug"),
        target: "material",
        title: m.name,
        reason: `${m.description} — família ${m.family}.`,
        score: 4,
        status: "pending",
        materialId: m.id,
      });
    }
  }

  if (options.includePalette !== false) {
    suggestions.push({
      id: uid("sug"),
      target: "palette",
      title: `Paleta ${style.name}`,
      reason: "Cores base para móveis, paredes e têxteis.",
      score: 3,
      status: "pending",
      paletteHex: style.palette,
    });
  }

  return {
    id: uid("plan"),
    styleId,
    context,
    suggestions,
    createdAt: new Date().toISOString(),
    provider: options.provider ?? "dioris.local",
  };
}

/** Interpreta um comando pt-BR e devolve estilo + opções sugeridas. */
export function parseDecoratorCommand(input: string): {
  styleId?: DecorStyleId;
  focus?: "plantas" | "luminarias" | "geral";
} {
  const t = input.toLowerCase();
  const focus = /planta|verde|jardim/.test(t)
    ? "plantas"
    : /luminaria|luz|ilumina/.test(t)
      ? "luminarias"
      : "geral";
  const map: Array<[RegExp, DecorStyleId]> = [
    [/minimalist/, "minimalista"],
    [/industria/, "industrial"],
    [/escandinav/, "escandinavo"],
    [/classic/, "classico"],
    [/luxo|luxu/, "luxo"],
    [/japandi/, "japandi"],
    [/boho|bohem/, "boho"],
    [/rustic/, "rustico"],
    [/corporativ|corporate|escritor/, "corporativo"],
    [/infantil|kid/, "infantil"],
    [/contempora/, "contemporaneo"],
    [/modern/, "moderno"],
  ];
  for (const [rx, id] of map) if (rx.test(t)) return { styleId: id, focus };
  return { focus };
}
