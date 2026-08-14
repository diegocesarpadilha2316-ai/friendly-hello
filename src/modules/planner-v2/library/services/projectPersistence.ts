import type { FurnitureItem } from "../../pkg/types";
import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { OpeningSpec, WallSide } from "../../pkg/state/useRoomBuilderStore";

export const PROJECT_STORAGE_KEY = "dioris.planner-v2.project.v4";

export interface PersistedRoomState {
  width: number;
  depth: number;
  height: number;
  wallThickness: number;
  openings: OpeningSpec[];
  referenceImage: string | null;
  referenceName: string | null;
  referenceStyle: "natural" | "green-kitchen";
}

export interface PersistedProject {
  schema: "dioris.planner-v2.project";
  version: 4;
  savedAt: string;
  planner: {
    furniture: FurnitureItem[];
    instances: FurnitureInstance[];
    selectedId: string | null;
    gridVisible: boolean;
    lightsEnabled: boolean;
    snapEnabled: boolean;
  };
  room: PersistedRoomState;
  immersive: {
    qualityMode: "work" | "realistic" | "presentation";
    autoOcclusion: boolean;
  };
}

export function serializeProject(input: Omit<PersistedProject, "schema" | "version" | "savedAt">): PersistedProject {
  return {
    schema: "dioris.planner-v2.project",
    version: 4,
    savedAt: new Date().toISOString(),
    planner: {
      furniture: input.planner.furniture,
      instances: input.planner.instances,
      selectedId: input.planner.selectedId,
      gridVisible: input.planner.gridVisible,
      lightsEnabled: input.planner.lightsEnabled,
      snapEnabled: input.planner.snapEnabled,
    },
    room: {
      width: input.room.width,
      depth: input.room.depth,
      height: input.room.height,
      wallThickness: input.room.wallThickness,
      openings: input.room.openings,
      referenceImage: input.room.referenceImage,
      referenceName: input.room.referenceName,
      referenceStyle: input.room.referenceStyle,
    },
    immersive: {
      qualityMode: input.immersive.qualityMode,
      autoOcclusion: input.immersive.autoOcclusion,
    },
  };
}

export function parseProject(raw: string): PersistedProject | null {
  try {
    const value = JSON.parse(raw) as Partial<PersistedProject>;
    if (value.schema !== "dioris.planner-v2.project" || value.version !== 4) return null;
    if (!value.planner || !Array.isArray(value.planner.instances) || !value.room) return null;
    return value as PersistedProject;
  } catch {
    return null;
  }
}

export function saveProjectToStorage(project: PersistedProject): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
}

export function loadProjectFromStorage(): PersistedProject | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);
  return raw ? parseProject(raw) : null;
}

export function clearProjectStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROJECT_STORAGE_KEY);
}

export function isOpeningOnWall(value: unknown): value is WallSide {
  return value === "back" || value === "left" || value === "right";
}

export function sanitizeOpenings(openings: OpeningSpec[]): OpeningSpec[] {
  return openings.filter((opening) => isOpeningOnWall(opening.wall));
}
