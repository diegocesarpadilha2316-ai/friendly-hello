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

const MM = 1 / 1000;
/**
 * Espessura do slab de piso/teto (m). O piso é ancorado de modo que sua
 * face SUPERIOR fique exatamente em y=0 (plano do mundo). Isso faz com
 * que a grade, as sombras de contato e a base dos móveis coincidam no
 * mesmo plano — origem única do ambiente 3D.
 */
const SLAB_THICKNESS = 0.02;
/** Piso: centro do slab um pouco abaixo de zero, topo em y=0. */
const FLOOR_CENTER_Y = -SLAB_THICKNESS / 2;

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
}

export interface Scene3DModel {
  walls: readonly WallDescriptor[];
  floors: readonly SlabDescriptor[];
  ceilings: readonly SlabDescriptor[];
  openings: readonly OpeningDescriptor[];
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
): SlabDescriptor {
  return {
    id: p.id,
    cx: (p.x + p.width / 2) * MM,
    cz: (p.y + p.depth / 2) * MM,
    width: p.width * MM,
    depth: p.depth * MM,
    y,
    thickness: SLAB_THICKNESS,
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
    y: p.role === "door" ? height / 2 : 1.0 + height / 2,
    rotationY: -(p.rotation * Math.PI) / 180,
    materialId: p.materialId,
  };
}

export function buildScene3D(room: PlannerRoom, wallHeight: number): Scene3DModel {
  const primitives = listPrimitives(room);
  const walls: WallDescriptor[] = [];
  const floors: SlabDescriptor[] = [];
  const ceilings: SlabDescriptor[] = [];
  const openings: OpeningDescriptor[] = [];
  const furniture: FurnitureDescriptor[] = [];
  const wallH = wallHeight * MM;
  /** Teto: centro do slab logo acima da altura da parede, face inferior em y=wallH. */
  const CEILING_CENTER_Y = wallH + SLAB_THICKNESS / 2;

  // Cores customizadas por nó (definidas via ProjectTree → params.__color).
  const colorFor = (id: string): string | undefined => {
    const n = room.nodes[id];
    const c = n?.params["__color"];
    return typeof c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : undefined;
  };

  for (const p of primitives) {
    if (p.kind === "wall") walls.push({ ...extrudeWall(p, wallHeight), overrideColor: colorFor(p.id) });
    else if (p.kind === "floor") floors.push({ ...extrudeSlab(p, FLOOR_CENTER_Y), overrideColor: colorFor(p.id) });
    else if (p.kind === "ceiling") ceilings.push({ ...extrudeSlab(p, CEILING_CENTER_Y), overrideColor: colorFor(p.id) });
    else if (p.kind === "opening") openings.push({ ...extrudeOpening(p), overrideColor: colorFor(p.id) });
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
      thickness: SLAB_THICKNESS,
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

  return { walls, floors, ceilings, openings, furniture, bounds: { minX, maxX, minZ, maxZ, maxY: wallH } };
}