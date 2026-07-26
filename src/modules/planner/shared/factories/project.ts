import type {
  PlannerEnvironment,
  PlannerParametricNode,
  PlannerProject,
  PlannerProjectId,
  PlannerProjectBriefing,
  PlannerRoom,
  PlannerRoomType,
} from "../types";

function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

function roomShellNodes(input: {
  roomId: string;
  width: number;
  depth: number;
  height: number;
}): readonly PlannerParametricNode[] {
  const { roomId, width, depth, height } = input;
  const thickness = 100;
  return [
    {
      id: `${roomId}_floor`,
      kind: "floor",
      label: "Piso",
      params: { x: 0, y: 0, width, depth, layer: "floors", locked: true, materialId: null },
    },
    {
      id: `${roomId}_wall_bottom`,
      kind: "wall",
      label: "Parede frontal",
      params: { x1: 0, y1: 0, x2: width, y2: 0, thickness, layer: "walls", locked: true, materialId: null },
    },
    {
      id: `${roomId}_wall_right`,
      kind: "wall",
      label: "Parede direita",
      params: { x1: width, y1: 0, x2: width, y2: depth, thickness, layer: "walls", locked: true, materialId: null },
    },
    {
      id: `${roomId}_wall_top`,
      kind: "wall",
      label: "Parede do fundo",
      params: { x1: width, y1: depth, x2: 0, y2: depth, thickness, layer: "walls", locked: true, materialId: null },
    },
    {
      id: `${roomId}_wall_left`,
      kind: "wall",
      label: "Parede esquerda",
      params: { x1: 0, y1: depth, x2: 0, y2: 0, thickness, layer: "walls", locked: true, materialId: null },
    },
    {
      id: `${roomId}_window_main`,
      kind: "opening",
      label: "Janela",
      params: {
        role: "window",
        x: Math.round(width * 0.52),
        y: depth,
        width: Math.min(1600, Math.max(900, Math.round(width * 0.35))),
        height: 1100,
        rotation: 180,
        layer: "openings",
        locked: false,
        materialId: null,
      },
    },
  ];
}

export function ensureRoomShell(room: PlannerRoom): PlannerRoom {
  const hasFloor = room.nodeOrder.some((id) => room.nodes[id]?.kind === "floor");
  const hasWall = room.nodeOrder.some((id) => room.nodes[id]?.kind === "wall");
  if (hasFloor && hasWall) return room;

  const shell = roomShellNodes({
    roomId: room.id,
    width: room.dimensions.width,
    depth: room.dimensions.depth,
    height: room.dimensions.height,
  });
  const nodes: Record<string, PlannerParametricNode> = { ...room.nodes };
  const shellOrder: string[] = [];
  for (const node of shell) {
    if (!nodes[node.id]) {
      nodes[node.id] = node;
      shellOrder.push(node.id);
    }
  }
  if (shellOrder.length === 0) return room;
  return {
    ...room,
    nodes,
    nodeOrder: [...shellOrder, ...room.nodeOrder],
    updatedAt: new Date().toISOString(),
  };
}

export function ensureProjectRoomShells(project: PlannerProject): PlannerProject {
  let changed = false;
  const environments = project.environments.map((environment) => {
    const rooms = environment.rooms.map((room) => {
      const nextRoom = ensureRoomShell(room);
      if (nextRoom !== room) changed = true;
      return nextRoom;
    });
    return changed ? { ...environment, rooms } : environment;
  });
  return changed ? { ...project, environments } : project;
}

export function createRoom(input: {
  name: string;
  type?: PlannerRoomType;
  width?: number;
  height?: number;
  depth?: number;
}): PlannerRoom {
  const now = new Date().toISOString();
  const id = uid("room");
  const dimensions = {
    width: input.width ?? 3000,
    height: input.height ?? 2600,
    depth: input.depth ?? 3000,
  };
  const shell = roomShellNodes({ roomId: id, ...dimensions });
  return {
    id,
    name: input.name,
    type: input.type ?? "outro",
    dimensions,
    nodes: Object.fromEntries(shell.map((node) => [node.id, node])),
    nodeOrder: shell.map((node) => node.id),
    createdAt: now,
    updatedAt: now,
  };
}

export function createEnvironment(input: { name: string; description?: string }): PlannerEnvironment {
  const now = new Date().toISOString();
  return {
    id: uid("env"),
    name: input.name,
    description: input.description,
    rooms: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createProject(input: {
  tenantId: string;
  ownerId: string;
  name: string;
  client?: string;
  briefing?: PlannerProjectBriefing;
}): PlannerProject {
  const now = new Date().toISOString();
  return {
    id: uid("proj") as PlannerProjectId,
    tenantId: input.tenantId,
    ownerId: input.ownerId,
    name: input.name,
    client: input.client,
    status: "draft",
    environments: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    briefing: input.briefing,
  };
}