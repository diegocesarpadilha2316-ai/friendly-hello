/**
 * Extrusão paramétrica: converte `Editor2DPrimitive[]` (derivados dos
 * mesmos `PlannerParametricNode` já persistidos) em descritores 3D
 * puros. Funções sem I/O e sem three.js — o renderer consome estes
 * descritores diretamente. Unidade de entrada: milímetros; saída em
 * metros (÷ 1000) para a cena 3D.
 */
import type { Editor2DPrimitive } from "../editor-2d/types";
import { listPrimitives } from "../editor-2d/serialization";
import type { PlannerRoom } from "../types/project";
import { ROOM_DEFAULTS } from "../room";

const MM = 1 / 1000;
/**
 * Espessuras REAIS de laje, vindas do Room Architecture Engine (mm → m).
 * O piso é ancorado de modo que sua face SUPERIOR fique exatamente em
 * y=0 (plano do mundo). Isso faz com que a grade, as sombras de contato
 * e a base dos móveis coincidam no mesmo plano — origem única do
 * ambiente 3D.
 */
const FLOOR_THICKNESS = ROOM_DEFAULTS.floorThicknessMm * MM;
const CEILING_THICKNESS = ROOM_DEFAULTS.ceilingThicknessMm * MM;
/** Piso: centro do slab abaixo de zero, topo em y=0. */
const FLOOR_CENTER_Y = -FLOOR_THICKNESS / 2;
/** Rodapé arquitetônico (independente do móvel). */
const BASEBOARD_HEIGHT = ROOM_DEFAULTS.baseboard.heightMm * MM;
const BASEBOARD_THICKNESS = ROOM_DEFAULTS.baseboard.thicknessMm * MM;
/** Peitoril: avanço para dentro do ambiente e espessura (m). */
const SILL_OVERHANG = ROOM_DEFAULTS.sillOverhangMm * MM;
const SILL_DEPTH_IN = ROOM_DEFAULTS.sillDepthMm * MM;
const SILL_THICKNESS = ROOM_DEFAULTS.sillThicknessMm * MM;
/** Altura padrão de peitoril quando a abertura não declara (m). */
const WINDOW_SILL_Y = ROOM_DEFAULTS.windowSillHeightMm * MM;

export interface WallCutoutDescriptor {
  id: string;
  role: "door" | "window";
  /** ao longo do comprimento da parede, a partir da extremidade inicial (m) */
  startM: number;
  endM: number;
  /** faixa vertical do vão (m, 0 = topo do piso) */
  bottomM: number;
  topM: number;
}

export interface WallDescriptor {
  id: string;
  cx: number; // centro X (m)
  cz: number; // centro Z (m)
  length: number; // m
  thickness: number; // m
  height: number; // m
  rotationY: number; // rad
  materialId?: string;
  overrideColor?: string;
  /** recortes reais (portas/janelas) desta parede */
  cutouts?: readonly WallCutoutDescriptor[];
  /** rodapé arquitetônico (m) — interrompido nos vãos de porta */
  baseboard?: { heightM: number; thicknessM: number };
}

export interface SillDescriptor {
  id: string;
  cx: number;
  cz: number;
  width: number;
  depth: number;
  thickness: number;
  /** cota da face superior (m) */
  y: number;
  rotationY: number;
  materialId?: string;
}

export interface SlabDescriptor {
  id: string;
  cx: number;
  cz: number;
  width: number;
  depth: number;
  y: number;
  thickness: number;
  materialId?: string;
  overrideColor?: string;
}

export interface OpeningDescriptor {
  id: string;
  role: "door" | "window";
  cx: number;
  cz: number;
  width: number;
  height: number;
  y: number;
  rotationY: number;
  materialId?: string;
  overrideColor?: string;
}

export interface FurnitureDescriptor {
  id: string;
  subtype: string;
  catalogItemId: string;
  cx: number;
  cz: number;
  width: number;   // m (X)
  depth: number;   // m (Z)
  height: number;  // m (Y)
  y: number;       // altura do centro (m)
  rotationY: number; // rad
  materialId?: string;
  overrideColor?: string;
  /** Tipo de frente para renderização PBR (Parte 5). */
  frontType?: "vidro" | "reeded" | "solid" | "aberto";
  /** Cor/tinta do vidro quando a frente é vidro/reeded. */
  glassTint?: string;
  /** Composição custom (via IA / Editor de Módulo). */
  doorsCount?: number;
  drawersCount?: number;
  shelvesCount?: number;
  openDoors?: boolean;
  openDrawers?: boolean;
  led?: boolean;
  hasSink?: boolean;
  /** Linha de marcenaria (design spec) — estilo e ferragens. */
  style?: string;
  handleStyle?: string;
  hardwareFinish?: string;
  frontStyle?: string;
  /** Params crus do nó — usados pelas famílias paramétricas (ex.: roupeiro). */
  params?: Readonly<Record<string, string | number | boolean | null | undefined>>;
}

export interface Scene3DModel {
  walls: readonly WallDescriptor[];
  floors: readonly SlabDescriptor[];
  ceilings: readonly SlabDescriptor[];
  openings: readonly OpeningDescriptor[];
  sills: readonly SillDescriptor[];
  furniture: readonly FurnitureDescriptor[];
  /** bounding box em metros */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxY: number };
}

function extrudeWall(p: Extract<Editor2DPrimitive, { kind: "wall" }>, wallHeight: number): WallDescriptor {
  const x1 = p.x1 * MM;
  const y1 = p.y1 * MM;
  const x2 = p.x2 * MM;
  const y2 = p.y2 * MM;
  const dx = x2 - x1;
  const dz = y2 - y1;
  const length = Math.hypot(dx, dz);
  return {
    id: p.id,
    cx: (x1 + x2) / 2,
    cz: (y1 + y2) / 2,
    length,
    thickness: p.thickness * MM,
    height: wallHeight * MM,
    rotationY: -Math.atan2(dz, dx),
    materialId: p.materialId,
  };
}

function extrudeSlab(
  p: Extract<Editor2DPrimitive, { kind: "floor" | "ceiling" }>,
  y: number,
  thickness: number,
): SlabDescriptor {
  return {
    id: p.id,
    cx: (p.x + p.width / 2) * MM,
    cz: (p.y + p.depth / 2) * MM,
    width: p.width * MM,
    depth: p.depth * MM,
    y,
    thickness,
    materialId: p.materialId,
  };
}

function extrudeOpening(p: Extract<Editor2DPrimitive, { kind: "opening" }>): OpeningDescriptor {
  const width = p.width * MM;
  const height = p.height * MM;
  return {
    id: p.id,
    role: p.role,
    cx: p.x * MM,
    cz: p.y * MM,
    width,
    height,
    y: p.role === "door" ? height / 2 : WINDOW_SILL_Y + height / 2,
    rotationY: -(p.rotation * Math.PI) / 180,
    materialId: p.materialId,
  };
}

/**
 * Recortes reais: projeta cada abertura sobre a parede e devolve a faixa
 * ocupada no sistema local da parede. Puro e geométrico — funciona para
 * paredes desenhadas em qualquer ângulo.
 */
function cutoutsForWall(
  wall: Extract<Editor2DPrimitive, { kind: "wall" }>,
  openings: readonly Extract<Editor2DPrimitive, { kind: "opening" }>[],
): WallCutoutDescriptor[] {
  const x1 = wall.x1 * MM;
  const z1 = wall.y1 * MM;
  const x2 = wall.x2 * MM;
  const z2 = wall.y2 * MM;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  if (length <= 0) return [];
  const ux = dx / length;
  const uz = dz / length;
  const tolerance = (wall.thickness * MM) / 2 + 0.08;
  const out: WallCutoutDescriptor[] = [];
  for (const o of openings) {
    const ox = o.x * MM - x1;
    const oz = o.y * MM - z1;
    const along = ox * ux + oz * uz;
    const perp = Math.abs(ox * -uz + oz * ux);
    if (perp > tolerance) continue;
    const w = o.width * MM;
    const start = Math.max(0, along - w / 2);
    const end = Math.min(length, along + w / 2);
    if (end - start <= 0.001) continue;
    const bottomM = o.role === "door" ? 0 : WINDOW_SILL_Y;
    out.push({
      id: o.id,
      role: o.role,
      startM: start,
      endM: end,
      bottomM,
      topM: bottomM + o.height * MM,
    });
  }
  return out.sort((a, b) => a.startM - b.startM);
}

/** Peitoril real por janela, avançando para dentro do ambiente. */
function sillForOpening(
  o: Extract<Editor2DPrimitive, { kind: "opening" }>,
  wallThicknessM: number,
): SillDescriptor {
  const depth = wallThicknessM + SILL_DEPTH_IN;
  const rotationY = -(o.rotation * Math.PI) / 180;
  // desloca o centro do peitoril para dentro do ambiente ao longo da
  // normal da abertura (a rotação já aponta para o interior).
  const inset = depth / 2 - wallThicknessM / 2;
  return {
    id: `${o.id}_sill`,
    cx: o.x * MM + Math.sin(rotationY) * inset,
    cz: o.y * MM + Math.cos(rotationY) * inset,
    width: o.width * MM + 2 * SILL_OVERHANG,
    depth,
    thickness: SILL_THICKNESS,
    y: WINDOW_SILL_Y,
    rotationY,
    materialId: o.materialId,
  };
}

export function buildScene3D(room: PlannerRoom, wallHeight: number): Scene3DModel {
  const primitives = listPrimitives(room);
  const walls: WallDescriptor[] = [];
  const floors: SlabDescriptor[] = [];
  const ceilings: SlabDescriptor[] = [];
  const openings: OpeningDescriptor[] = [];
  const sills: SillDescriptor[] = [];
  const furniture: FurnitureDescriptor[] = [];
  const wallH = wallHeight * MM;
  /** Teto: centro do slab logo acima da altura da parede, face inferior em y=wallH. */
  const CEILING_CENTER_Y = wallH + CEILING_THICKNESS / 2;
  const openingPrimitives = primitives.filter(
    (p): p is Extract<Editor2DPrimitive, { kind: "opening" }> => p.kind === "opening",
  );

  // Cores customizadas por nó (definidas via ProjectTree → params.__color).
  const colorFor = (id: string): string | undefined => {
    const n = room.nodes[id];
    const c = n?.params["__color"];
    return typeof c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : undefined;
  };

  for (const p of primitives) {
    if (p.kind === "wall") {
      walls.push({
        ...extrudeWall(p, wallHeight),
        overrideColor: colorFor(p.id),
        cutouts: cutoutsForWall(p, openingPrimitives),
        baseboard: { heightM: BASEBOARD_HEIGHT, thicknessM: BASEBOARD_THICKNESS },
      });
    } else if (p.kind === "floor") {
      floors.push({ ...extrudeSlab(p, FLOOR_CENTER_Y, FLOOR_THICKNESS), overrideColor: colorFor(p.id) });
    } else if (p.kind === "ceiling") {
      ceilings.push({ ...extrudeSlab(p, CEILING_CENTER_Y, CEILING_THICKNESS), overrideColor: colorFor(p.id) });
    } else if (p.kind === "opening") {
      openings.push({ ...extrudeOpening(p), overrideColor: colorFor(p.id) });
      if (p.role === "window") {
        const host = primitives.find(
          (w): w is Extract<Editor2DPrimitive, { kind: "wall" }> => w.kind === "wall",
        );
        sills.push(sillForOpening(p, (host?.thickness ?? ROOM_DEFAULTS.wallThicknessMm) * MM));
      }
    }
    else if (p.kind === "furniture") {
      const w = p.width * MM;
      const d = p.depth * MM;
      const h = p.height * MM;
      const ft = p.params?.frontType ?? p.params?.["eng:front"];
      const frontType =
        ft === "vidro" || ft === "reeded" || ft === "solid" || ft === "aberto"
          ? (ft as "vidro" | "reeded" | "solid" | "aberto")
          : undefined;
      const tint = typeof p.params?.["glass:tint"] === "string" ? (p.params["glass:tint"] as string) : undefined;
      const strParam = (...keys: string[]): string | undefined => {
        for (const k of keys) {
          const v = p.params?.[k];
          if (typeof v === "string" && v.trim() !== "") return v;
        }
        return undefined;
      };
      const numParam = (k: string): number | undefined => {
        const v = p.params?.[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
        return undefined;
      };
      const boolParam = (k: string): boolean | undefined => {
        const v = p.params?.[k];
        if (typeof v === "boolean") return v;
        if (v === "true" || v === 1 || v === "1") return true;
        if (v === "false" || v === 0 || v === "0") return false;
        return undefined;
      };
      const hasSink =
        boolParam("eng:sink") === true ||
        boolParam("hasSink") === true ||
        /(?:pia|cuba|sob-pia|balcao-gourmet)/i.test(`${p.catalogItemId} ${p.params?.["eng:plumbing"] ?? ""}`);
      // ── Ancoragem Y do móvel (Y = 0 é o TOPO do piso) ──
      // Módulos DE PAREDE reais (suspensos a 1400 mm do piso): apenas
      // aéreo, nicho e prateleira. Painel, cristaleira, roupeiro, torre
      // etc. são módulos de piso e nascem apoiados. Um override explícito
      // `mount:y` (bottom em mm) sempre vence — usado pela IA/inspetor.
      // Módulos que NASCEM SUSPENSOS na parede quando nenhum override é
      // dado. `prateleira` foi removido: shelves genéricos costumam ficar
      // em várias alturas e o comportamento antigo dava sensação de
      // "flutuando". `nicho` e `aereo` continuam suspensos por padrão.
      const uppers = new Set(["aereo", "nicho"]);
      const overrideBottomMm = numParam("mount:y") ?? numParam("mount:baseY");
      let bottomY: number;
      if (overrideBottomMm != null) {
        bottomY = overrideBottomMm * MM;
      } else if (uppers.has(p.subtype)) {
        bottomY = 1.4; // suspenso a 1.4 m
      } else {
        bottomY = 0;   // apoiado no piso (y=0)
      }
      // Clamp: nunca enterra abaixo do piso, nunca ultrapassa o teto.
      const ceilY = wallH > 0 ? wallH : Infinity;
      if (bottomY < 0) bottomY = 0;
      if (bottomY + h > ceilY) bottomY = Math.max(0, ceilY - h);
      const baseY = bottomY + h / 2;
      furniture.push({
        id: p.id,
        subtype: p.subtype,
        catalogItemId: p.catalogItemId,
        cx: (p.x + p.width / 2) * MM,
        cz: (p.y + p.depth / 2) * MM,
        width: w,
        depth: d,
        height: h,
        y: baseY,
        rotationY: -(p.rotation * Math.PI) / 180,
        materialId: p.materialId,
        overrideColor: colorFor(p.id),
        frontType,
        glassTint: tint,
        doorsCount: numParam("mod:doors") ?? numParam("doors"),
        drawersCount: numParam("mod:drawers") ?? numParam("drawers"),
        shelvesCount: numParam("mod:shelves") ?? numParam("shelves"),
        openDoors: boolParam("mod:openDoors") ?? boolParam("openDoors"),
        openDrawers: boolParam("mod:openDrawers") ?? boolParam("openDrawers"),
        led: boolParam("mod:led") ?? boolParam("led"),
        hasSink,
        style: strParam("style", "mod:style", "design:style", "estilo"),
        handleStyle: strParam("mod:handle", "handle", "puxador"),
        hardwareFinish: strParam("mod:hardware", "hardware", "ferragem"),
        frontStyle: strParam("mod:front", "front:style"),
        params: p.params as FurnitureDescriptor["params"],
      });
    }
  }

  // Fallback: se não há floor/ceiling explícitos, gera a partir das dimensões da sala
  if (floors.length === 0 && room.dimensions.width > 0 && room.dimensions.depth > 0) {
    floors.push({
      id: `${room.id}-floor`,
      cx: (room.dimensions.width / 2) * MM,
      cz: (room.dimensions.depth / 2) * MM,
      width: room.dimensions.width * MM,
      depth: room.dimensions.depth * MM,
      y: FLOOR_CENTER_Y,
      thickness: FLOOR_THICKNESS,
    });
  }

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const consider = (cx: number, cz: number, w: number, d: number) => {
    minX = Math.min(minX, cx - w / 2); maxX = Math.max(maxX, cx + w / 2);
    minZ = Math.min(minZ, cz - d / 2); maxZ = Math.max(maxZ, cz + d / 2);
  };
  for (const w of walls) consider(w.cx, w.cz, w.length, w.thickness);
  for (const s of floors) consider(s.cx, s.cz, s.width, s.depth);
  for (const f of furniture) consider(f.cx, f.cz, f.width, f.depth);
  if (!Number.isFinite(minX)) {
    minX = 0; maxX = (room.dimensions.width || 5000) * MM;
    minZ = 0; maxZ = (room.dimensions.depth || 5000) * MM;
  }

  return {
    walls,
    floors,
    ceilings,
    openings,
    sills,
    furniture,
    bounds: { minX, maxX, minZ, maxZ, maxY: wallH },
  };
}

/**
 * Divide uma parede em peças sólidas que contornam os vãos — recortes
 * REAIS, sem CSG. Coordenadas locais: `offset` a partir do centro da
 * parede no eixo do comprimento, `y` a partir do centro da altura.
 */
export interface WallPiece {
  key: string;
  offset: number;
  width: number;
  y: number;
  height: number;
}

export function wallPieces(w: WallDescriptor): readonly WallPiece[] {
  const cuts = (w.cutouts ?? []).filter((c) => c.endM > c.startM);
  if (cuts.length === 0) {
    return [{ key: `${w.id}-full`, offset: 0, width: w.length, y: 0, height: w.height }];
  }
  const pieces: WallPiece[] = [];
  const half = w.length / 2;
  const halfH = w.height / 2;
  let cursor = 0;
  for (const c of cuts) {
    const start = Math.max(0, Math.min(w.length, c.startM));
    const end = Math.max(0, Math.min(w.length, c.endM));
    if (start - cursor > 0.001) {
      const width = start - cursor;
      pieces.push({
        key: `${w.id}-solid-${cursor.toFixed(3)}`,
        offset: cursor + width / 2 - half,
        width,
        y: 0,
        height: w.height,
      });
    }
    const width = Math.max(0, end - start);
    const bottom = Math.max(0, c.bottomM);
    const top = Math.min(w.height, c.topM);
    if (width > 0.001 && bottom > 0.001) {
      pieces.push({
        key: `${c.id}-under`,
        offset: start + width / 2 - half,
        width,
        y: bottom / 2 - halfH,
        height: bottom,
      });
    }
    if (width > 0.001 && w.height - top > 0.001) {
      const lintel = w.height - top;
      pieces.push({
        key: `${c.id}-lintel`,
        offset: start + width / 2 - half,
        width,
        y: top + lintel / 2 - halfH,
        height: lintel,
      });
    }
    cursor = Math.max(cursor, end);
  }
  if (w.length - cursor > 0.001) {
    const width = w.length - cursor;
    pieces.push({
      key: `${w.id}-solid-${cursor.toFixed(3)}`,
      offset: cursor + width / 2 - half,
      width,
      y: 0,
      height: w.height,
    });
  }
  return pieces;
}

/** Faixas de rodapé de uma parede (m), interrompidas nos vãos de porta. */
export function baseboardRuns(w: WallDescriptor): readonly { key: string; offset: number; width: number }[] {
  const doors = (w.cutouts ?? []).filter((c) => c.role === "door");
  const half = w.length / 2;
  const runs: { key: string; offset: number; width: number }[] = [];
  let cursor = 0;
  for (const d of doors) {
    const start = Math.max(0, Math.min(w.length, d.startM));
    if (start - cursor > 0.01) {
      const width = start - cursor;
      runs.push({ key: `${w.id}-bb-${cursor.toFixed(3)}`, offset: cursor + width / 2 - half, width });
    }
    cursor = Math.max(cursor, Math.min(w.length, d.endM));
  }
  if (w.length - cursor > 0.01) {
    const width = w.length - cursor;
    runs.push({ key: `${w.id}-bb-${cursor.toFixed(3)}`, offset: cursor + width / 2 - half, width });
  }
  return runs;
}