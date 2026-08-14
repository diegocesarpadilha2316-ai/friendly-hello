/**
 * Fase 3.7 — IA Visão: pipeline simulado.
 *
 * Executa uma sequência determinística de estágios que emulam a análise
 * de imagens por uma IA de visão. Cada estágio emite um evento
 * (`onStage`) para que a UI mostre progresso em tempo real. Ao final,
 * devolve um `VisionRoomModel` plausível derivado das imagens enviadas.
 *
 * Nenhum acesso a APIs externas — a implementação real será plugada em
 * `providers.ts` sem alterar consumidores.
 */
import type {
  VisionOpening,
  VisionRoomModel,
  VisionStage,
  VisionStageId,
  VisionUpload,
  VisionWall,
} from "./types";

interface SimulateInput {
  uploads: readonly VisionUpload[];
  providerId: string;
  onStage?: (stage: VisionStage) => void;
  signal?: AbortSignal;
}

const STAGE_BLUEPRINT: readonly Omit<VisionStage, "progress" | "status">[] = [
  { id: "analyze", label: "Analisando ambiente", detail: "Interpretando imagem e contexto." },
  { id: "walls", label: "Detectando paredes", detail: "Identificando arestas verticais." },
  { id: "floor", label: "Detectando piso", detail: "Reconhecendo plano horizontal inferior." },
  { id: "ceiling", label: "Detectando teto", detail: "Reconhecendo plano horizontal superior." },
  { id: "doors", label: "Detectando portas", detail: "Localizando vãos e batentes." },
  { id: "windows", label: "Detectando janelas", detail: "Localizando aberturas envidraçadas." },
  { id: "perspective", label: "Calculando perspectiva", detail: "Estimando câmera e escala." },
  {
    id: "reconstruction",
    label: "Preparando reconstrução",
    detail: "Gerando modelo paramétrico inicial.",
  },
];

export function createStages(): VisionStage[] {
  return STAGE_BLUEPRINT.map((s) => ({ ...s, status: "pending", progress: 0 }));
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      });
    }
  });
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildModel(input: SimulateInput): VisionRoomModel {
  const seedBase =
    input.uploads.map((u) => `${u.name}:${u.sizeBytes}`).join("|") || input.providerId;
  const rand = mulberry32(hashSeed(seedBase));

  const width = Math.round(3200 + rand() * 1800); // 3200-5000mm
  const depth = Math.round(2800 + rand() * 1600); // 2800-4400mm
  const height = Math.round(2500 + rand() * 400); // 2500-2900mm

  const walls: VisionWall[] = [
    {
      id: "w-n",
      a: { x: 0, y: 0 },
      b: { x: width, y: 0 },
      thickness: 100,
      height,
      confidence: 0.9 + rand() * 0.08,
    },
    {
      id: "w-e",
      a: { x: width, y: 0 },
      b: { x: width, y: depth },
      thickness: 100,
      height,
      confidence: 0.88 + rand() * 0.1,
    },
    {
      id: "w-s",
      a: { x: width, y: depth },
      b: { x: 0, y: depth },
      thickness: 100,
      height,
      confidence: 0.85 + rand() * 0.1,
    },
    {
      id: "w-w",
      a: { x: 0, y: depth },
      b: { x: 0, y: 0 },
      thickness: 100,
      height,
      confidence: 0.86 + rand() * 0.1,
    },
  ];

  const openings: VisionOpening[] = [
    {
      id: "op-door-1",
      wallId: "w-w",
      role: "door",
      offset: Math.round(depth * 0.5 - 400),
      width: 800,
      height: 2100,
      sillHeight: 0,
      confidence: 0.82,
    },
    {
      id: "op-win-1",
      wallId: "w-n",
      role: "window",
      offset: Math.round(width * 0.5 - 600),
      width: 1200,
      height: 1200,
      sillHeight: 1000,
      confidence: 0.78,
    },
  ];

  const guessedType: VisionRoomModel["suggestedType"] = input.uploads[0]?.name
    .toLowerCase()
    .includes("cozin")
    ? "cozinha"
    : input.uploads[0]?.name.toLowerCase().includes("quarto")
      ? "dormitorio"
      : "sala";

  return {
    id: `vroom_${Date.now().toString(36)}`,
    suggestedName:
      guessedType === "cozinha"
        ? "Cozinha detectada"
        : guessedType === "dormitorio"
          ? "Dormitório detectado"
          : "Sala detectada",
    suggestedType: guessedType,
    bounds: { width, depth, height },
    walls,
    openings,
    floor: { material: "porcelanato", color: "#d8d4cc", confidence: 0.7 },
    ceiling: { height, material: "gesso", color: "#f5f5f5", confidence: 0.9 },
    objects: [],
    perspective: {
      yaw: Math.round((rand() * 20 - 10) * 10) / 10,
      pitch: Math.round((rand() * 6 - 3) * 10) / 10,
      cameraHeight: 1550,
      focalMm: 28,
      confidence: 0.75,
    },
    sourceUploadIds: input.uploads.map((u) => u.id),
    provider: input.providerId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Emula uma análise completa. Emite estágios (`onStage`) e responde
 * ao `AbortSignal`. Não altera nenhum estado global.
 */
export async function simulateVisionAnalysis(input: SimulateInput): Promise<VisionRoomModel> {
  const stages = createStages();
  const stepMs = 260;
  for (const stage of stages) {
    if (input.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const startedAt = new Date().toISOString();
    input.onStage?.({ ...stage, status: "running", progress: 0.1, startedAt });
    await delay(stepMs, input.signal);
    input.onStage?.({ ...stage, status: "running", progress: 0.6, startedAt });
    await delay(stepMs, input.signal);
    input.onStage?.({
      ...stage,
      status: "done",
      progress: 1,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
  }
  return buildModel(input);
}

export const STAGE_ORDER: readonly VisionStageId[] = STAGE_BLUEPRINT.map((s) => s.id);
