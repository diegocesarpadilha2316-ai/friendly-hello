/**
 * Conversão bidirecional entre `PlannerParametricNode` (persistência
 * paramétrica da Fase 3.1) e `Editor2DPrimitive` (representação visual
 * do editor). Nenhum novo campo é introduzido no domínio — os atributos
 * 2D vivem em `params`, respeitando o contrato existente.
 */
import type { PlannerParametricNode, PlannerRoom } from "../types/project";
import type { Editor2DLayerId, Editor2DPrimitive } from "./types";

function num(node: PlannerParametricNode, key: string, def: number): number {
  const v = node.params[key];
  return typeof v === "number" && Number.isFinite(v) ? v : def;
}
function str(node: PlannerParametricNode, key: string, def: string): string {
  const v = node.params[key];
  return typeof v === "string" ? v : def;
}
function bool(node: PlannerParametricNode, key: string, def: boolean): boolean {
  const v = node.params[key];
  return typeof v === "boolean" ? v : def;
}

export function toPrimitive(node: PlannerParametricNode): Editor2DPrimitive | null {
  const layer = (str(node, "layer", "") || defaultLayerFor(node.kind, node.params["role"])) as Editor2DLayerId;
  const locked = bool(node, "locked", false);
  switch (node.kind) {
    case "wall":
      return {
        id: node.id,
        kind: "wall",
        layer,
        locked,
        x1: num(node, "x1", 0),
        y1: num(node, "y1", 0),
        x2: num(node, "x2", 0),
        y2: num(node, "y2", 0),
        thickness: num(node, "thickness", 100),
      };
    case "opening": {
      const role = str(node, "role", "door") === "window" ? "window" : "door";
      return {
        id: node.id,
        kind: "opening",
        role,
        layer,
        locked,
        x: num(node, "x", 0),
        y: num(node, "y", 0),
        width: num(node, "width", role === "door" ? 800 : 1200),
        height: num(node, "height", role === "door" ? 2100 : 1200),
        rotation: num(node, "rotation", 0),
      };
    }
    case "floor":
    case "ceiling":
      return {
        id: node.id,
        kind: node.kind,
        layer,
        locked,
        x: num(node, "x", 0),
        y: num(node, "y", 0),
        width: num(node, "width", 1000),
        depth: num(node, "depth", 1000),
      };
    case "material": {
      if (str(node, "role", "") !== "guide") return null;
      return {
        id: node.id,
        kind: "guide",
        layer,
        locked,
        axis: str(node, "axis", "h") === "v" ? "v" : "h",
        pos: num(node, "pos", 0),
      };
    }
    case "module": {
      if (str(node, "role", "") !== "furniture") return null;
      const params: Record<string, string | number | boolean | null> = {};
      for (const [k, v] of Object.entries(node.params)) {
        if (k.startsWith("p:")) params[k.slice(2)] = v;
      }
      return {
        id: node.id,
        kind: "furniture",
        layer,
        locked,
        subtype: str(node, "subtype", "modulo"),
        catalogItemId: str(node, "catalogItemId", ""),
        x: num(node, "x", 0),
        y: num(node, "y", 0),
        width: num(node, "width", 600),
        depth: num(node, "depth", 400),
        height: num(node, "height", 900),
        rotation: num(node, "rotation", 0),
        params,
      };
    }
    default:
      return null;
  }
}

function defaultLayerFor(kind: PlannerParametricNode["kind"], role: unknown): Editor2DLayerId {
  switch (kind) {
    case "wall": return "walls";
    case "opening": return "openings";
    case "floor": return "floors";
    case "ceiling": return "ceilings";
    case "material":
      return role === "guide" ? "guides" : "walls";
    case "module":
      return role === "furniture" ? "furniture" : "walls";
    default: return "walls";
  }
}

export function fromPrimitive(p: Editor2DPrimitive, label?: string): PlannerParametricNode {
  const base = { id: p.id, label: label ?? defaultLabel(p) };
  switch (p.kind) {
    case "wall":
      return {
        ...base,
        kind: "wall",
        params: {
          x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2,
          thickness: p.thickness, layer: p.layer, locked: p.locked,
        },
      };
    case "opening":
      return {
        ...base,
        kind: "opening",
        params: {
          role: p.role,
          x: p.x, y: p.y, width: p.width, height: p.height,
          rotation: p.rotation, layer: p.layer, locked: p.locked,
        },
      };
    case "floor":
    case "ceiling":
      return {
        ...base,
        kind: p.kind,
        params: {
          x: p.x, y: p.y, width: p.width, depth: p.depth,
          layer: p.layer, locked: p.locked,
        },
      };
    case "guide":
      return {
        ...base,
        kind: "material",
        params: {
          role: "guide",
          axis: p.axis, pos: p.pos,
          layer: p.layer, locked: p.locked,
        },
      };
    case "furniture": {
      const custom: Record<string, string | number | boolean | null> = {};
      for (const [k, v] of Object.entries(p.params)) custom[`p:${k}`] = v;
      return {
        ...base,
        kind: "module",
        params: {
          role: "furniture",
          subtype: p.subtype,
          catalogItemId: p.catalogItemId,
          x: p.x, y: p.y,
          width: p.width, depth: p.depth, height: p.height,
          rotation: p.rotation,
          layer: p.layer, locked: p.locked,
          ...custom,
        },
      };
    }
  }
}

function defaultLabel(p: Editor2DPrimitive): string {
  switch (p.kind) {
    case "wall": return "Parede";
    case "opening": return p.role === "door" ? "Porta" : "Janela";
    case "floor": return "Piso";
    case "ceiling": return "Teto";
    case "guide": return "Guia";
    case "furniture": return p.subtype;
  }
}

export function listPrimitives(room: PlannerRoom): Editor2DPrimitive[] {
  const out: Editor2DPrimitive[] = [];
  for (const id of room.nodeOrder) {
    const n = room.nodes[id];
    if (!n) continue;
    const p = toPrimitive(n);
    if (p) out.push(p);
  }
  return out;
}
