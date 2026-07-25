/**
 * Fase 3.27 — Tipos do domínio Importer (CAD/BIM).
 *
 * Determinístico e sem I/O — os `services/*` populam estas estruturas e o
 * `converter.ts` traduz em mutações via `updateProject()` do
 * PlannerEditorProvider (preservando Undo/Redo/Autosave/Histórico).
 */
export type ImporterFormat =
  | "dwg" | "dxf" | "ifc" | "obj" | "fbx" | "glb" | "gltf" | "stl"
  | "step" | "iges" | "skp" | "pdf" | "png" | "jpg" | "webp" | "svg";

export type ImporterUnit = "mm" | "cm" | "m" | "in" | "ft";

export interface ImporterLayer {
  readonly id: string;
  readonly name: string;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly color?: string;
  readonly count: number;
  readonly role?: ImporterEntityRole;
}

export type ImporterEntityRole =
  | "wall" | "door" | "window" | "floor" | "ceiling" | "room"
  | "furniture" | "dimension" | "text" | "block" | "unknown";

export interface ImporterEntity {
  readonly id: string;
  readonly role: ImporterEntityRole;
  readonly layerId: string;
  /** coordenadas em mm no referencial do arquivo. */
  readonly points: readonly (readonly [number, number])[];
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface ImporterMaterialRef {
  readonly id: string;
  readonly name: string;
  readonly color?: string | null;
  readonly textureUrl?: string | null;
}

export interface ImporterBBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface ImporterScale {
  /** Fator para converter coordenadas do arquivo para milímetros. */
  readonly factorToMm: number;
  readonly detectedUnit: ImporterUnit;
  readonly overrideUnit?: ImporterUnit;
}

export interface ImporterWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning" | "error";
}

export interface ImportResult {
  readonly id: string;
  readonly filename: string;
  readonly format: ImporterFormat;
  readonly binary: boolean;
  readonly bytes: number;
  readonly scale: ImporterScale;
  readonly bbox: ImporterBBox | null;
  readonly layers: readonly ImporterLayer[];
  readonly entities: readonly ImporterEntity[];
  readonly materials: readonly ImporterMaterialRef[];
  readonly texts: readonly string[];
  readonly previewSvg: string | null;
  readonly warnings: readonly ImporterWarning[];
  readonly createdAt: string;
}

export interface ImporterHistoryEntry {
  readonly id: string;
  readonly filename: string;
  readonly format: ImporterFormat;
  readonly bytes: number;
  readonly entities: number;
  readonly warnings: number;
  readonly createdAt: string;
}

export type ImporterExportFormat = "dwg" | "dxf" | "glb" | "obj" | "pdf" | "svg";