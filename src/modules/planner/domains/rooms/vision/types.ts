/**
 * Fase 3.7 — IA Visão: modelo de dados.
 *
 * Representa o que uma IA de Visão (GPT / Gemini / Claude / OSS) irá
 * devolver ao interpretar uma ou mais fotos de um ambiente. NUNCA
 * substitui `PlannerRoom` — é um formato intermediário, editável pelo
 * usuário antes da conversão para o modelo paramétrico oficial.
 *
 * Unidade: milímetros (mesmo motor do Planner).
 */

export type VisionUploadStatus = "queued" | "reading" | "ready" | "error";

export interface VisionUpload {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  /** ObjectURL local (revogar ao descartar). */
  previewUrl: string;
  status: VisionUploadStatus;
  /** Dimensões em pixels da imagem original. */
  width?: number;
  height?: number;
  createdAt: string;
}

export type VisionStageId =
  | "analyze"
  | "walls"
  | "floor"
  | "ceiling"
  | "doors"
  | "windows"
  | "perspective"
  | "reconstruction";

export type VisionStageStatus = "pending" | "running" | "done" | "error";

export interface VisionStage {
  id: VisionStageId;
  label: string;
  detail: string;
  status: VisionStageStatus;
  /** 0..1 — progresso simulado nesta fase. */
  progress: number;
  startedAt?: string;
  finishedAt?: string;
}

/** Ponto 2D em milímetros no plano do piso (X=largura, Y=profundidade). */
export interface VisionPoint2D {
  x: number;
  y: number;
}

export interface VisionWall {
  id: string;
  a: VisionPoint2D;
  b: VisionPoint2D;
  /** Espessura em mm (padrão: 100). */
  thickness: number;
  /** Altura em mm (padrão: 2600). */
  height: number;
  /** 0..1 — confiança da IA de visão. */
  confidence: number;
}

export interface VisionOpening {
  id: string;
  /** Parede à qual pertence. */
  wallId: string;
  role: "door" | "window";
  /** Distância desde o ponto A da parede, em mm. */
  offset: number;
  width: number;
  height: number;
  /** Altura do peitoril (janela) ou 0 (porta). */
  sillHeight: number;
  confidence: number;
}

export interface VisionFloor {
  material: string;
  color: string;
  confidence: number;
}

export interface VisionCeiling {
  height: number;
  material: string;
  color: string;
  confidence: number;
}

export interface VisionDetectedObject {
  id: string;
  /** Categoria semântica reconhecida (ex.: "armario", "geladeira"). */
  category: string;
  label: string;
  position: VisionPoint2D;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  confidence: number;
  /** Mapeamento opcional para um item da Biblioteca. */
  catalogHint?: string;
}

export interface VisionPerspective {
  /** Ângulo em graus da câmera em relação à parede frontal. */
  yaw: number;
  pitch: number;
  /** Estimativa de altura da câmera em mm. */
  cameraHeight: number;
  /** Distância focal estimada (35mm equivalent). */
  focalMm: number;
  confidence: number;
}

export interface VisionRoomModel {
  /** Id local do modelo detectado (não é `PlannerRoomId`). */
  id: string;
  /** Nome sugerido pelo modelo de visão. */
  suggestedName: string;
  /** Tipo sugerido (mesma enumeração de `PlannerRoomType`). */
  suggestedType:
    | "cozinha"
    | "sala"
    | "dormitorio"
    | "closet"
    | "banheiro"
    | "lavanderia"
    | "escritorio"
    | "comercial"
    | "corporativo"
    | "outro";
  bounds: {
    width: number;
    depth: number;
    height: number;
  };
  walls: VisionWall[];
  openings: VisionOpening[];
  floor: VisionFloor;
  ceiling: VisionCeiling;
  objects: VisionDetectedObject[];
  perspective: VisionPerspective;
  /** Referência aos uploads que geraram este modelo. */
  sourceUploadIds: readonly string[];
  /** Provider que gerou o modelo (stub nesta fase). */
  provider: string;
  createdAt: string;
}

/** Correções manuais aplicadas pelo usuário sobre o modelo detectado. */
export interface VisionCorrectionPatch {
  bounds?: Partial<VisionRoomModel["bounds"]>;
  walls?: Record<string, Partial<Omit<VisionWall, "id">>>;
  openings?: Record<string, Partial<Omit<VisionOpening, "id">>>;
  floor?: Partial<VisionFloor>;
  ceiling?: Partial<VisionCeiling>;
  suggestedName?: string;
  suggestedType?: VisionRoomModel["suggestedType"];
}

export type VisionSessionStatus =
  "idle" | "uploading" | "processing" | "review" | "applied" | "error";

export interface VisionSession {
  id: string;
  status: VisionSessionStatus;
  uploads: VisionUpload[];
  stages: VisionStage[];
  model: VisionRoomModel | null;
  corrections: VisionCorrectionPatch;
  /** Provider selecionado para a próxima execução. */
  providerId: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
