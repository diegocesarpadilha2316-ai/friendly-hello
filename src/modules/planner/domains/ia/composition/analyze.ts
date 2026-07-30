/**
 * ANALISE PRE-GERACAO.
 *
 * Antes de qualquer peca ser criada, o Planner le o comodo real:
 * tipo de ambiente, area, proporcao, circulacao exigida, posicao de
 * paredes, portas, janelas e a luz natural disponivel. So depois a
 * composicao comeca.
 */
import type { PlannerRoom } from "@/modules/planner/shared";
import { listPrimitives } from "@/modules/planner/shared";
import type { LayoutShape, LayoutWall } from "../services/layout";
import { resolveStyle } from "./styles";
import type { CompositionStyle, FinishLevel, OpeningInfo, RoomAnalysis, WallInfo } from "./types";

const WALLS: LayoutWall[] = ["bottom", "right", "top", "left"];

/** Circulacao minima por ambiente (NBR / ergonomia pratica), em mm. */
const CIRCULATION_BY_ENV: Readonly<Record<string, number>> = {
  cozinha: 900,
  closet: 800,
  dormitorio: 700,
  sala: 800,
  escritorio: 750,
  banheiro: 600,
};

/** Giro da porta reservado ao redor da abertura, em mm. */
const DOOR_SWING_MM = 350;

function wallOfOpening(
  x: number,
  y: number,
  width: number,
  depth: number,
): { wall: LayoutWall; center: number } {
  const d = [
    { wall: "bottom" as LayoutWall, dist: Math.abs(y), center: x },
    { wall: "top" as LayoutWall, dist: Math.abs(depth - y), center: x },
    { wall: "left" as LayoutWall, dist: Math.abs(x), center: y },
    { wall: "right" as LayoutWall, dist: Math.abs(width - x), center: y },
  ].sort((a, b) => a.dist - b.dist);
  return { wall: d[0].wall, center: d[0].center };
}

/** Extrai as aberturas (portas/janelas) e projeta cada uma na parede mais proxima. */
export function readOpenings(room: PlannerRoom): OpeningInfo[] {
  const w = room.dimensions.width;
  const d = room.dimensions.depth;
  const out: OpeningInfo[] = [];
  for (const p of listPrimitives(room)) {
    if (p.kind !== "opening") continue;
    const { wall, center } = wallOfOpening(p.x, p.y, w, d);
    out.push({ role: p.role, wall, center, width: p.width, height: p.height });
  }
  return out;
}

function analyzeWall(
  wall: LayoutWall,
  length: number,
  openings: readonly OpeningInfo[],
): WallInfo {
  const mine = openings.filter((o) => o.wall === wall);
  const doors = mine.filter((o) => o.role === "door");
  const windows = mine.filter((o) => o.role === "window");

  // Blocos ocupados ao longo da parede (porta reserva giro dos dois lados).
  const blocks = mine
    .map((o) => {
      const pad = o.role === "door" ? DOOR_SWING_MM : 0;
      return {
        a: Math.max(0, o.center - o.width / 2 - pad),
        b: Math.min(length, o.center + o.width / 2 + pad),
      };
    })
    .sort((x, y) => x.a - y.a);

  let occupied = 0;
  let cursor = 0;
  let longestRun = 0;
  for (const b of blocks) {
    if (b.a > cursor) longestRun = Math.max(longestRun, b.a - cursor);
    occupied += Math.max(0, b.b - Math.max(cursor, b.a));
    cursor = Math.max(cursor, b.b);
  }
  longestRun = Math.max(longestRun, length - cursor);

  const naturalLight = Math.min(
    1,
    windows.reduce((acc, o) => acc + (o.width * o.height) / (length * 2600), 0) * 2.2,
  );

  return {
    wall,
    length,
    freeLength: Math.max(0, length - occupied),
    longestRun,
    hasDoor: doors.length > 0,
    hasWindow: windows.length > 0,
    naturalLight,
    // Marcenaria alta nunca tapa janela nem invade o giro da porta.
    allowsTall: doors.length === 0 && windows.length === 0,
    load: 0,
  };
}

function pickShape(
  workWalls: readonly LayoutWall[],
  areaM2: number,
  ratio: number,
  environment: string,
): LayoutShape {
  const usable = workWalls.length;
  if (usable <= 1) return "linear";
  // Comodo comprido e estreito pede bancadas paralelas (corredor central).
  if (ratio >= 2 && usable >= 2 && environment !== "closet") return "paralela";
  if (environment === "closet" && usable >= 3) return "U";
  if (areaM2 >= 14 && usable >= 3) return "U";
  return "L";
}

function inferFinishLevel(style: CompositionStyle, areaM2: number): FinishLevel {
  if (style === "luxo" || style === "classico") return "premium";
  if (areaM2 >= 16) return "intermediario";
  return style === "minimalista" ? "intermediario" : "essencial";
}

export interface AnalyzeOptions {
  environment: string;
  style?: string | null;
  /** dica textual livre do usuario (usada apenas para reforcar o estilo) */
  hint?: string | null;
}

/** Le o comodo e devolve o diagnostico completo antes da geracao. */
export function analyzeRoom(room: PlannerRoom, opts: AnalyzeOptions): RoomAnalysis {
  const width = room.dimensions.width;
  const depth = room.dimensions.depth;
  const areaM2 = (width * depth) / 1_000_000;
  const ratio = Math.max(width, depth) / Math.max(1, Math.min(width, depth));
  const openings = readOpenings(room);

  const walls: Record<LayoutWall, WallInfo> = {
    bottom: analyzeWall("bottom", width, openings),
    top: analyzeWall("top", width, openings),
    left: analyzeWall("left", depth, openings),
    right: analyzeWall("right", depth, openings),
  };

  const style = resolveStyle(opts.style ?? opts.hint ?? null);
  const environment = opts.environment;
  const circulationMin = CIRCULATION_BY_ENV[environment] ?? 800;

  // Aptidao da parede = trecho continuo livre, penalizado por porta e janela.
  const score = (w: WallInfo) =>
    w.longestRun - (w.hasDoor ? 1400 : 0) - (w.hasWindow ? 500 : 0) + w.freeLength * 0.25;

  const workWalls = WALLS.filter((w) => walls[w].longestRun >= 900).sort(
    (a, b) => score(walls[b]) - score(walls[a]),
  );

  const totalLight = openings
    .filter((o) => o.role === "window")
    .reduce((acc, o) => acc + o.width * o.height, 0);
  const lightRatio = totalLight / Math.max(1, width * depth);
  const naturalLight: RoomAnalysis["naturalLight"] =
    lightRatio >= 0.18 ? "alta" : lightRatio >= 0.07 ? "media" : "baixa";

  const size: RoomAnalysis["size"] = areaM2 >= 16 ? "amplo" : areaM2 >= 8 ? "medio" : "compacto";
  const shape = pickShape(workWalls, areaM2, ratio, environment);

  const notes: string[] = [
    `${environment} de ${areaM2.toFixed(1)} m² (${width}×${depth}mm), proporcao ${ratio.toFixed(2)}:1`,
    `circulacao minima ${circulationMin}mm, luz natural ${naturalLight}`,
    `paredes uteis: ${workWalls.join(", ") || "nenhuma"} · forma ${shape}`,
  ];
  const doorWalls = openings.filter((o) => o.role === "door").map((o) => o.wall);
  if (doorWalls.length > 0) notes.push(`portas em: ${Array.from(new Set(doorWalls)).join(", ")}`);
  const winWalls = openings.filter((o) => o.role === "window").map((o) => o.wall);
  if (winWalls.length > 0) notes.push(`janelas em: ${Array.from(new Set(winWalls)).join(", ")}`);

  return {
    environment,
    style,
    finishLevel: inferFinishLevel(style, areaM2),
    width,
    depth,
    areaM2,
    ratio,
    size,
    circulationMin,
    naturalLight,
    openings,
    walls,
    workWalls: workWalls.length > 0 ? workWalls : ["bottom"],
    shape,
    notes,
  };
}

/** Resumo legivel da analise para o chat. */
export function describeAnalysis(a: RoomAnalysis): string {
  return `Leitura do ambiente — ${a.notes.join(" · ")}.`;
}