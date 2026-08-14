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
}): readonly PlannerParametricNode[] {
  const { roomId, width, depth } = input;
  const thickness = 100;
  return [
    {
      id: `${roomId}_floor`,
      kind: "floor",
      label: "Piso",
      params: { x: 0, y: 0, width, depth, layer: "floors", locked: true, materialId: null },
    },
    {
      id: `${roomId}_ceiling`,
      kind: "ceiling",
      label: "Teto (forro)",
      params: { x: 0, y: 0, width, depth, layer: "ceilings", locked: true, materialId: null },
    },
    {
      id: `${roomId}_wall_bottom`,
      kind: "wall",
      label: "Parede frontal",
      params: {
        x1: 0,
        y1: 0,
        x2: width,
        y2: 0,
        thickness,
        layer: "walls",
        locked: true,
        materialId: null,
      },
    },
    {
      id: `${roomId}_wall_right`,
      kind: "wall",
      label: "Parede direita",
      params: {
        x1: width,
        y1: 0,
        x2: width,
        y2: depth,
        thickness,
        layer: "walls",
        locked: true,
        materialId: null,
      },
    },
    {
      id: `${roomId}_wall_top`,
      kind: "wall",
      label: "Parede do fundo",
      params: {
        x1: width,
        y1: depth,
        x2: 0,
        y2: depth,
        thickness,
        layer: "walls",
        locked: true,
        materialId: null,
      },
    },
    {
      id: `${roomId}_wall_left`,
      kind: "wall",
      label: "Parede esquerda",
      params: {
        x1: 0,
        y1: depth,
        x2: 0,
        y2: 0,
        thickness,
        layer: "walls",
        locked: true,
        materialId: null,
      },
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
  const hasCeiling = room.nodeOrder.some((id) => room.nodes[id]?.kind === "ceiling");
  if (hasFloor && hasWall && hasCeiling) return room;

  const shell = roomShellNodes({
    roomId: room.id,
    width: room.dimensions.width,
    depth: room.dimensions.depth,
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
  const roomType = project.briefing?.environmentType ?? "cozinha";
  const roomName = roomType === "cozinha" ? "Cozinha" : "Ambiente";
  const bootEnvironments =
    project.environments.length > 0
      ? project.environments
      : [
          {
            ...createEnvironment({ name: "Ambiente principal" }),
            rooms: [
              createRoom({
                name: roomName,
                type: roomType,
                width: 4200,
                depth: 3200,
                height: 2700,
              }),
            ],
          },
        ];
  if (bootEnvironments !== project.environments) changed = true;

  const environments = bootEnvironments.map((environment) => {
    const sourceRooms =
      environment.rooms.length > 0
        ? environment.rooms
        : [createRoom({ name: roomName, type: roomType, width: 4200, depth: 3200, height: 2700 })];
    if (sourceRooms !== environment.rooms) changed = true;
    const normalizedRooms = sourceRooms.map((room) => {
      const nextRoom = ensureRoomShell(room);
      if (nextRoom !== room) changed = true;
      return nextRoom;
    });
    return normalizedRooms !== environment.rooms
      ? { ...environment, rooms: normalizedRooms }
      : environment;
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
  const shell = roomShellNodes({ roomId: id, width: dimensions.width, depth: dimensions.depth });
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

export function createEnvironment(input: {
  name: string;
  description?: string;
}): PlannerEnvironment {
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
