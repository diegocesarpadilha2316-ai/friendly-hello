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
import { listPrimitives } from "../editor-2d/serialization";
import type { CatalogItem } from "./types";
import {
  WALL_OFFSET_MM,
  CLEARANCE_MM,
  REAL_DEPTH_BY_SUBTYPE,
  CABINET_SUBTYPES,
  aabbOverlap,
} from "./physics";
import { getPlannerEventBus, bridgeToWindow } from "../events";

export interface InsertionTarget {
  environmentId: string;
  roomId: string;
}

export interface InsertionOptions {
  at?: { x: number; y: number };
  rotation?: number;
  overrides?: Partial<{ width: number; depth: number; height: number }>;
  params?: Readonly<Record<string, string | number | boolean | null>>;
  /**
   * ID de material da biblioteca (ex.: "pbr:preto-absoluto"). Quando
   * presente, é gravado no top-level do primitive — o Scene3D aplica
   * textura PBR real. Se ausente, o `params.__color` (hex) serve como
   * fallback via overrideColor.
   */
  materialId?: string;
}

export function buildFurniturePrimitive(
  item: CatalogItem,
  opts: InsertionOptions = {},
): Editor2DPrimitive {
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
    materialId: opts.materialId,
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
  const next: PlannerProject = {
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
  // Módulo 05: dispara evento para o Editor abrir o Inspector no item recém
  // inserido e enquadrar a câmera. O ID do último primitivo inserido está no
  // final da lista do cômodo alvo.
  try {
    const env = next.environments.find((e) => e.id === target.environmentId);
    const room = env?.rooms.find((r) => r.id === target.roomId);
    const last = room ? listPrimitives(room).at(-1) : undefined;
    if (last) {
      const bus = getPlannerEventBus();
      bus.emit("ui:item-inserted", { primitiveId: last.id, roomId: target.roomId });
      bus.emit("ui:focus-selection", { primitiveId: last.id });
      // Compat: listeners legados em `window` continuam recebendo.
      bridgeToWindow("ui:item-inserted", { primitiveId: last.id, roomId: target.roomId });
      bridgeToWindow("ui:focus-selection", { primitiveId: last.id });
    }
  } catch {
    /* ambientes sem window/CustomEvent ou bus */
  }
  return next;
}

function applyInsertion(room: PlannerRoom, item: CatalogItem, opts: InsertionOptions): PlannerRoom {
  const roomW = room.dimensions.width;
  const roomD = room.dimensions.depth;
  const width = opts.overrides?.width ?? item.parametric.defaults.width;
  const normalizedDepth =
    opts.overrides?.depth ??
    REAL_DEPTH_BY_SUBTYPE[String(item.subtype)] ??
    item.parametric.defaults.depth;
  const depth = normalizedDepth;
  const WALL = WALL_OFFSET_MM;
  const raw = opts.at ?? { x: roomW / 2, y: roomD / 2 };
  const halfW = width / 2;
  const halfD = depth / 2;

  const isCabinet = CABINET_SUBTYPES.has(String(item.subtype));
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
  // `Editor2DPrimitive.x/y` armazenam o canto superior esquerdo do retângulo
  // paramétrico; portanto o centro precisa manter width/depth dentro da sala.
  // A rotação define orientação visual, mas não muda o contrato persistido.
  const minX = WALL + halfW;
  const maxX = Math.max(minX, roomW - WALL - halfW);
  const minY = WALL + halfD;
  const maxY = Math.max(minY, roomD - WALL - halfD);
  at = {
    x: Math.min(Math.max(at.x, minX), maxX),
    y: Math.min(Math.max(at.y, minY), maxY),
  };

  // Prevenção de colisão: se o ponto final choca com um móvel existente,
  // desliza ao longo da parede procurando o próximo slot livre. Se falhar,
  // aceita a posição original (usuário sempre pode mover manualmente).
  const existing = listPrimitives(room).filter(
    (p): p is Editor2DPrimitive & { kind: "furniture" } => p.kind === "furniture",
  );
  if (existing.length > 0 && isCabinet) {
    const candidate = { x: at.x - halfW, y: at.y - halfD, width, depth, rotation };
    const collides = () => existing.some((p) => aabbOverlap(candidate, p, CLEARANCE_MM));
    if (collides()) {
      // Determina eixo de deslizamento pela parede (horizontal para bottom/top).
      const horizontal = rotation === 0 || rotation === 180 || rotation === undefined;
      const step = (horizontal ? width : depth) + CLEARANCE_MM;
      const axisMin = horizontal ? minX : minY;
      const axisMax = horizontal ? maxX : maxY;
      const start = horizontal ? at.x : at.y;
      let found = false;
      for (let k = 1; k <= 24 && !found; k++) {
        for (const sign of [1, -1]) {
          const v = start + sign * step * k;
          if (v < axisMin || v > axisMax) continue;
          if (horizontal) {
            candidate.x = v - halfW;
            at = { x: v, y: at.y };
          } else {
            candidate.y = v - halfD;
            at = { x: at.x, y: v };
          }
          if (!collides()) {
            found = true;
            break;
          }
        }
      }
    }
  }
  return upsertPrimitive(
    room,
    buildFurniturePrimitive(item, {
      ...opts,
      at,
      rotation,
      overrides: { ...opts.overrides, depth },
    }),
  );
}
