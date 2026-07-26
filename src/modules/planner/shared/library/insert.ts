/**
 * Inserção de itens da Biblioteca no documento paramétrico.
 *
 * Não introduz estado global novo — a inserção passa pelo `updateProject`
 * do `PlannerEditorProvider` (Fase 3.1). O mesmo canal por onde fluem as
 * demais mutações, portanto herda Undo/Redo, Autosave, Histórico e a
 * sincronização com 2D/3D (e, futuramente, Produção/Render/IA).
 */
import type { PlannerProject, PlannerRoom } from "../types/project";
import type { Editor2DPrimitive } from "../editor-2d/types";
import { makePrimitiveId, upsertPrimitive } from "../editor-2d/room-ops";
import type { CatalogItem } from "./types";

export interface InsertionTarget {
  environmentId: string;
  roomId: string;
}

export interface InsertionOptions {
  at?: { x: number; y: number };
  rotation?: number;
  overrides?: Partial<{ width: number; depth: number; height: number }>;
  params?: Readonly<Record<string, string | number | boolean | null>>;
}

export function buildFurniturePrimitive(item: CatalogItem, opts: InsertionOptions = {}): Editor2DPrimitive {
  const { defaults } = item.parametric;
  const width = opts.overrides?.width ?? defaults.width;
  const depth = opts.overrides?.depth ?? defaults.depth;
  const height = opts.overrides?.height ?? defaults.height;
  const cx = opts.at?.x ?? 0;
  const cy = opts.at?.y ?? 0;
  return {
    id: makePrimitiveId("furniture"),
    kind: "furniture",
    layer: "furniture",
    locked: false,
    subtype: item.subtype,
    catalogItemId: item.id,
    x: cx - width / 2,
    y: cy - depth / 2,
    width,
    depth,
    height,
    rotation: opts.rotation ?? 0,
    params: {
      material: item.material ?? "",
      color: item.color ?? "",
      brand: item.brand ?? "",
      line: item.line ?? "",
      code: item.code ?? "",
      version: item.version,
      "ai:subtype": item.subtype,
      "ai:category": item.category,
      ...(opts.params ?? {}),
    },
  };
}

export function insertItemIntoProject(
  project: PlannerProject,
  target: InsertionTarget,
  item: CatalogItem,
  opts: InsertionOptions = {},
): PlannerProject {
  return {
    ...project,
    environments: project.environments.map((env) => {
      if (env.id !== target.environmentId) return env;
      return {
        ...env,
        rooms: env.rooms.map((r) => (r.id === target.roomId ? applyInsertion(r, item, opts) : r)),
        updatedAt: new Date().toISOString(),
      };
    }),
  };
}

function applyInsertion(room: PlannerRoom, item: CatalogItem, opts: InsertionOptions): PlannerRoom {
  const roomW = room.dimensions.width;
  const roomD = room.dimensions.depth;
  const width = opts.overrides?.width ?? item.parametric.defaults.width;
  // Profundidades reais de marcenaria por subtype (mm) — sobrescrevem o
  // default do catálogo quando este vier fora do padrão de mercado.
  const depthBySubtype: Record<string, number> = {
    aereo: 350,
    prateleira: 300,
    nicho: 300,
    painel: 40,
    balcao: 600,
    tampo: 600,
    bancada: 600,
    ilha: 900,
    torre: 600,
    gaveteiro: 500,
    closet: 600,
    roupeiro: 600,
    armario: 600,
    "guarda-roupa": 600,
    cristaleira: 400,
  };
  const normalizedDepth =
    opts.overrides?.depth ??
    depthBySubtype[String(item.subtype)] ??
    item.parametric.defaults.depth;
  const depth = normalizedDepth;
  // Espessura da parede (~100mm centralizada) — 50mm interno + 2mm folga.
  const WALL = 52;
  const raw = opts.at ?? { x: roomW / 2, y: roomD / 2 };
  const halfW = width / 2;
  const halfD = depth / 2;

  // Snap-to-wall automático: se o usuário não fixou uma rotação e o item é um
  // módulo de marcenaria (não decoração/eletro isolado), encosta na parede
  // mais próxima do ponto solicitado, com o fundo flush na face interna.
  const isCabinet = new Set([
    "aereo","balcao","torre","gaveteiro","closet","roupeiro","armario",
    "guarda-roupa","cristaleira","prateleira","nicho","painel","tampo","bancada","ilha",
  ]).has(String(item.subtype));
  let at = raw;
  let rotation = opts.rotation;
  if (isCabinet && opts.rotation === undefined) {
    // distâncias do ponto às 4 paredes (bottom=y=0, top=y=roomD, left=x=0, right=x=roomW)
    const dB = raw.y;
    const dT = roomD - raw.y;
    const dL = raw.x;
    const dR = roomW - raw.x;
    const min = Math.min(dB, dT, dL, dR);
    if (min === dB) {
      at = { x: raw.x, y: WALL + halfD };
      rotation = 0;
    } else if (min === dT) {
      at = { x: raw.x, y: roomD - WALL - halfD };
      rotation = 180;
    } else if (min === dL) {
      at = { x: WALL + halfD, y: raw.y };
      rotation = 270;
    } else {
      at = { x: roomW - WALL - halfD, y: raw.y };
      rotation = 90;
    }
  }
  // Clampa o CENTRO do móvel para manter os 4 cantos dentro do cômodo.
  const minX = WALL + halfW;
  const maxX = Math.max(minX, roomW - WALL - halfW);
  const minY = WALL + halfD;
  const maxY = Math.max(minY, roomD - WALL - halfD);
  at = {
    x: Math.min(Math.max(at.x, minX), maxX),
    y: Math.min(Math.max(at.y, minY), maxY),
  };
  return upsertPrimitive(
    room,
    buildFurniturePrimitive(item, { ...opts, at, rotation, overrides: { ...opts.overrides, depth } }),
  );
}