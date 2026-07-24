import type {
  PlannerEnvironment,
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

export function createRoom(input: {
  name: string;
  type?: PlannerRoomType;
  width?: number;
  height?: number;
  depth?: number;
}): PlannerRoom {
  const now = new Date().toISOString();
  return {
    id: uid("room"),
    name: input.name,
    type: input.type ?? "outro",
    dimensions: {
      width: input.width ?? 3000,
      height: input.height ?? 2600,
      depth: input.depth ?? 3000,
    },
    nodes: {},
    nodeOrder: [],
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