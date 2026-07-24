/**
 * Fase 3.10 — Hook orquestrador da fila de vídeo. Estado local session-only.
 * `render-frames` DELEGA ao Render Engine — não duplicamos render.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { VIDEO_PIPELINE, statusForStage } from "../services/pipeline";
import { createVideoJob, frameCountFor, withVideoStatus, type CreateVideoJobInput } from "../services/queue";
import { getVideoFormat } from "../services/export";
import type { VideoJob } from "../types";

const HISTORY_LIMIT = 60;

export interface UseVideoQueue {
  readonly queue: readonly VideoJob[];
  readonly active: VideoJob | null;
  readonly history: readonly VideoJob[];
  enqueue(input: Omit<CreateVideoJobInput, "project">): VideoJob | null;
  cancel(jobId: string): void;
  retry(jobId: string): void;
  clearHistory(): void;
}

export function useVideoQueue(): UseVideoQueue {
  const { state } = usePlannerEditor();
  const project = state.project;

  const [queue, setQueue] = useState<readonly VideoJob[]>([]);
  const [history, setHistory] = useState<readonly VideoJob[]>([]);
  const cancelledRef = useRef<Set<string>>(new Set());

  const active = useMemo(
    () =>
      queue.find(
        (j) =>
          j.status !== "queued" &&
          j.status !== "done" &&
          j.status !== "cancelled" &&
          j.status !== "failed",
      ) ?? null,
    [queue],
  );

  const finish = useCallback((jobId: string, finalJob: VideoJob) => {
    setQueue((q) => q.filter((j) => j.id !== jobId));
    setHistory((h) => [finalJob, ...h].slice(0, HISTORY_LIMIT));
  }, []);

  useEffect(() => {
    if (active) return;
    const next = queue.find((j) => j.status === "queued");
    if (!next) return;
    let cancelled = false;

    const run = async () => {
      let cur = withVideoStatus(next, "planning", VIDEO_PIPELINE[0], 0);
      setQueue((q) => q.map((j) => (j.id === cur.id ? cur : j)));
      let acc = 0;
      const frames = frameCountFor(cur);
      const baseMs = 2400 + frames * 0.5;
      for (const stage of VIDEO_PIPELINE) {
        if (cancelled || cancelledRef.current.has(cur.id)) {
          const final = withVideoStatus(cur, "cancelled");
          finish(cur.id, final);
          cancelledRef.current.delete(cur.id);
          return;
        }
        const steps = 12;
        const dur = stage.weight * baseMs;
        for (let i = 1; i <= steps; i += 1) {
          if (cancelled || cancelledRef.current.has(cur.id)) break;
          await new Promise((r) => setTimeout(r, dur / steps));
          const partial = acc + stage.weight * (i / steps);
          cur = withVideoStatus(cur, statusForStage(stage.id), stage, partial);
          setQueue((q) => q.map((j) => (j.id === cur.id ? cur : j)));
        }
        acc += stage.weight;
      }
      const fmt = getVideoFormat(cur.config.formatId);
      const done = withVideoStatus(cur, "done", VIDEO_PIPELINE[VIDEO_PIPELINE.length - 1], 1, {
        result: {
          widthPx: fmt.resolution.width,
          heightPx: fmt.resolution.height,
          durationMs: Date.now() - new Date(cur.startedAt ?? cur.createdAt).getTime(),
          frameCount: frames,
        },
      });
      finish(cur.id, done);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [queue, active, finish]);

  const enqueue = useCallback(
    (input: Omit<CreateVideoJobInput, "project">): VideoJob | null => {
      if (!project) return null;
      const job = createVideoJob({ ...input, project });
      setQueue((q) => [...q, job]);
      return job;
    },
    [project],
  );

  const cancel = useCallback((jobId: string) => {
    cancelledRef.current.add(jobId);
    setQueue((q) =>
      q.map((j) => (j.id === jobId && j.status === "queued" ? withVideoStatus(j, "cancelled") : j)),
    );
    setQueue((q) => q.filter((j) => j.status !== "cancelled"));
  }, []);

  const retry = useCallback((jobId: string) => {
    setHistory((h) => {
      const found = h.find((j) => j.id === jobId);
      if (!found) return h;
      const clone: VideoJob = {
        ...found,
        id: `${found.id}_retry_${Date.now().toString(36)}`,
        status: "queued",
        progress: 0,
        stage: VIDEO_PIPELINE[0].label,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: undefined,
        finishedAt: undefined,
        result: undefined,
        error: undefined,
      };
      setQueue((q) => [...q, clone]);
      return h;
    });
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { queue, active, history, enqueue, cancel, retry, clearHistory };
}
