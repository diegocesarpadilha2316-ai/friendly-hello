/**
 * Fase 3.7 — IA Visão: hook orquestrador.
 *
 * Gerencia o ciclo de vida de uma `VisionSession` (uploads → estágios →
 * modelo → correções → aplicação no `PlannerProject`).
 *
 * Zero provider/store novo — todas as mutações no projeto passam por
 * `usePlannerEditor().updateProject`, mantendo Undo/Redo/Autosave/
 * Histórico do canal oficial.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { createEnvironment } from "@/modules/planner/shared/factories/project";
import { mergeCorrections, toPlannerRoom } from "../adapter";
import { createStages } from "../pipeline";
import { DEFAULT_VISION_PROVIDER_ID, getVisionProvider } from "../providers";
import type {
  VisionCorrectionPatch,
  VisionRoomModel,
  VisionSession,
  VisionStage,
  VisionUpload,
} from "../types";

const ACCEPTED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILES = 12;
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptySession(providerId: string): VisionSession {
  const now = new Date().toISOString();
  return {
    id: uid("vs"),
    status: "idle",
    uploads: [],
    stages: createStages(),
    model: null,
    corrections: {},
    providerId,
    createdAt: now,
    updatedAt: now,
  };
}

async function readImageMeta(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

export interface UseVisionSession {
  session: VisionSession;
  mergedModel: VisionRoomModel | null;
  isBusy: boolean;
  canAnalyze: boolean;
  canApply: boolean;
  addFiles(files: FileList | File[]): Promise<void>;
  removeUpload(id: string): void;
  clearUploads(): void;
  setProviderId(id: string): void;
  analyze(): Promise<void>;
  cancel(): void;
  updateCorrections(patch: (prev: VisionCorrectionPatch) => VisionCorrectionPatch): void;
  applyToProject(options?: { environmentId?: string | null; environmentName?: string }): void;
  reset(): void;
}

export function useVisionSession(): UseVisionSession {
  const editor = usePlannerEditor();
  const [session, setSession] = useState<VisionSession>(() =>
    emptySession(DEFAULT_VISION_PROVIDER_ID),
  );
  const abortRef = useRef<AbortController | null>(null);

  // Limpa ObjectURLs ao desmontar.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      setSession((prev) => {
        prev.uploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
        return prev;
      });
    };
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, MAX_FILES);
    const now = new Date().toISOString();
    const toAdd: VisionUpload[] = [];
    for (const file of list) {
      if (!ACCEPTED_MIME.includes(file.type)) continue;
      if (file.size > MAX_SIZE_BYTES) continue;
      const previewUrl = URL.createObjectURL(file);
      const upload: VisionUpload = {
        id: uid("up"),
        name: file.name,
        mime: file.type,
        sizeBytes: file.size,
        previewUrl,
        status: "reading",
        createdAt: now,
      };
      toAdd.push(upload);
      readImageMeta(file).then((meta) => {
        setSession((prev) => ({
          ...prev,
          uploads: prev.uploads.map((u) =>
            u.id === upload.id
              ? { ...u, status: "ready", width: meta.width, height: meta.height }
              : u,
          ),
          updatedAt: new Date().toISOString(),
        }));
      });
    }
    if (toAdd.length === 0) return;
    setSession((prev) => ({
      ...prev,
      status: "uploading",
      uploads: [...prev.uploads, ...toAdd].slice(0, MAX_FILES),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setSession((prev) => {
      const target = prev.uploads.find((u) => u.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return {
        ...prev,
        uploads: prev.uploads.filter((u) => u.id !== id),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const clearUploads = useCallback(() => {
    setSession((prev) => {
      prev.uploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
      return {
        ...prev,
        uploads: [],
        status: "idle",
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const setProviderId = useCallback((id: string) => {
    setSession((prev) => ({ ...prev, providerId: id, updatedAt: new Date().toISOString() }));
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSession((prev) => ({
      ...prev,
      status: prev.model ? "review" : "idle",
      stages: prev.stages.map((s) =>
        s.status === "running" ? { ...s, status: "pending", progress: 0 } : s,
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const analyze = useCallback(async () => {
    const uploads = session.uploads.filter((u) => u.status === "ready");
    if (uploads.length === 0) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSession((prev) => ({
      ...prev,
      status: "processing",
      stages: createStages(),
      model: null,
      corrections: {},
      error: undefined,
      updatedAt: new Date().toISOString(),
    }));

    const onStage = (stage: VisionStage) => {
      setSession((prev) => ({
        ...prev,
        stages: prev.stages.map((s) => (s.id === stage.id ? stage : s)),
        updatedAt: new Date().toISOString(),
      }));
    };

    try {
      const provider = getVisionProvider(session.providerId);
      const model = await provider.analyze({ uploads, onStage, signal: controller.signal });
      setSession((prev) => ({
        ...prev,
        status: "review",
        model,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setSession((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Falha na análise.",
        updatedAt: new Date().toISOString(),
      }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [session.uploads, session.providerId]);

  const updateCorrections = useCallback(
    (patch: (prev: VisionCorrectionPatch) => VisionCorrectionPatch) => {
      setSession((prev) => ({
        ...prev,
        corrections: patch(prev.corrections),
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const mergedModel = useMemo(
    () => (session.model ? mergeCorrections(session.model, session.corrections) : null),
    [session.model, session.corrections],
  );

  const applyToProject = useCallback(
    (options?: { environmentId?: string | null; environmentName?: string }) => {
      if (!mergedModel) return;
      const room = toPlannerRoom(mergedModel);
      editor.updateProject((project) => {
        const envs = [...project.environments];
        let targetIndex = -1;
        if (options?.environmentId) {
          targetIndex = envs.findIndex((e) => e.id === options.environmentId);
        }
        if (targetIndex < 0) {
          const env = createEnvironment({
            name: options?.environmentName ?? "Ambiente detectado por IA",
            description: `Reconstruído a partir de ${mergedModel.sourceUploadIds.length} foto(s).`,
          });
          envs.push({ ...env, rooms: [room] });
        } else {
          const target = envs[targetIndex];
          envs[targetIndex] = { ...target, rooms: [...target.rooms, room] };
        }
        return { ...project, environments: envs, updatedAt: new Date().toISOString() };
      });
      setSession((prev) => ({ ...prev, status: "applied", updatedAt: new Date().toISOString() }));
    },
    [editor, mergedModel],
  );

  const reset = useCallback(() => {
    setSession((prev) => {
      prev.uploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
      return emptySession(prev.providerId);
    });
  }, []);

  return {
    session,
    mergedModel,
    isBusy: session.status === "processing" || session.status === "uploading",
    canAnalyze:
      session.uploads.some((u) => u.status === "ready") && session.status !== "processing",
    canApply: !!mergedModel && (session.status === "review" || session.status === "applied"),
    addFiles,
    removeUpload,
    clearUploads,
    setProviderId,
    analyze,
    cancel,
    updateCorrections,
    applyToProject,
    reset,
  };
}
