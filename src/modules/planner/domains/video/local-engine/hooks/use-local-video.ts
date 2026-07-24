/**
 * Fase 3.22 — Hook orquestrador do motor local de vídeo.
 *
 * Estado local session-only. Nenhum store novo, nenhum provider,
 * nenhum banco. Lê o `PlannerProject` via `usePlannerEditor()`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { DEFAULT_LOCAL_QUALITY } from "../../../render/local-engine/quality";
import { buildVideoPlaybook, buildVideoScene } from "../video-builder";
import { defaultTimeline } from "../timeline";
import { DEFAULT_VIDEO_OUTPUT } from "../encoder";
import { DEFAULT_AUDIO, buildVideoCapture } from "../capture";
import { expandVideoCapture } from "../batch";
import {
  LOCAL_VIDEO_STAGES,
  advanceVideo,
  completeVideo,
  estimateVideoDurationMs,
  markVideoCancelled,
  markVideoStart,
} from "../queue";
import type {
  LocalAudioTrack,
  LocalTimeline,
  LocalVideoCaptureRequest,
  LocalVideoJob,
  LocalVideoOutputSpec,
  LocalVideoPlaybook,
  LocalVideoScene,
  LocalVideoViewportState,
} from "../types";
import type { LocalQualityId } from "../../../render/local-engine/types";

const HISTORY_LIMIT = 40;

const DEFAULT_VIEWPORT: LocalVideoViewportState = {
  mode: "realtime",
  showGrid: true,
  showSafeArea: true,
  showTimecode: true,
  cursorSec: 0,
};

export interface UseLocalVideo {
  readonly scene: LocalVideoScene | null;
  readonly playbook: LocalVideoPlaybook | null;
  readonly timeline: LocalTimeline;
  readonly output: LocalVideoOutputSpec;
  readonly qualityId: LocalQualityId;
  readonly audio: LocalAudioTrack;
  readonly viewport: LocalVideoViewportState;
  readonly queue: readonly LocalVideoJob[];
  readonly active: LocalVideoJob | null;
  readonly history: readonly LocalVideoJob[];
  setTimeline(next: LocalTimeline): void;
  setOutput(next: LocalVideoOutputSpec): void;
  setQuality(id: LocalQualityId): void;
  setAudio(next: LocalAudioTrack): void;
  setViewport(next: LocalVideoViewportState): void;
  enqueue(req: LocalVideoCaptureRequest): readonly LocalVideoJob[];
  enqueueCurrent(): readonly LocalVideoJob[];
  cancel(jobId: string): void;
  retry(jobId: string): void;
  clearHistory(): void;
}

export function useLocalVideo(): UseLocalVideo {
  const { state } = usePlannerEditor();
  const project = state.project;

  const [timeline, setTimeline] = useState<LocalTimeline>(() => defaultTimeline());
  const [output, setOutput] = useState<LocalVideoOutputSpec>(DEFAULT_VIDEO_OUTPUT);
  const [qualityId, setQualityId] = useState<LocalQualityId>(DEFAULT_LOCAL_QUALITY);
  const [audio, setAudio] = useState<LocalAudioTrack>(DEFAULT_AUDIO);
  const [viewport, setViewport] = useState<LocalVideoViewportState>(DEFAULT_VIEWPORT);

  const [queue, setQueue] = useState<readonly LocalVideoJob[]>([]);
  const [history, setHistory] = useState<readonly LocalVideoJob[]>([]);
  const cancelledRef = useRef<Set<string>>(new Set());

  const scene = useMemo(
    () => (project ? buildVideoScene(project, state.selectedRoomId, timeline) : null),
    [project, state.selectedRoomId, timeline],
  );

  const playbook = useMemo(
    () => (scene ? buildVideoPlaybook({ scene, timeline, output, qualityId }) : null),
    [scene, timeline, output, qualityId],
  );

  const active = useMemo(
    () => queue.find((j) => j.status !== "queued" && j.status !== "done" && j.status !== "cancelled" && j.status !== "failed") ?? null,
    [queue],
  );

  const finish = useCallback((jobId: string, finalJob: LocalVideoJob) => {
    setQueue((q) => q.filter((j) => j.id !== jobId));
    setHistory((h) => [finalJob, ...h].slice(0, HISTORY_LIMIT));
  }, []);

  useEffect(() => {
    if (active) return;
    const next = queue.find((j) => j.status === "queued");
    if (!next) return;
    let cancelled = false;

    const run = async () => {
      let cur = markVideoStart(next);
      setQueue((q) => q.map((j) => (j.id === cur.id ? cur : j)));
      const total = estimateVideoDurationMs(cur);
      for (let s = 0; s < LOCAL_VIDEO_STAGES.length; s += 1) {
        const dur = LOCAL_VIDEO_STAGES[s].weight * total;
        const steps = LOCAL_VIDEO_STAGES[s].id === "render" ? 16 : 10;
        for (let i = 1; i <= steps; i += 1) {
          if (cancelled || cancelledRef.current.has(cur.id)) {
            const final = markVideoCancelled(cur);
            cancelledRef.current.delete(cur.id);
            finish(cur.id, final);
            return;
          }
          await new Promise((r) => setTimeout(r, dur / steps));
          cur = advanceVideo(cur, s, i / steps);
          setQueue((q) => q.map((j) => (j.id === cur.id ? cur : j)));
        }
      }
      const done = completeVideo(cur);
      finish(cur.id, done);
    };

    void run();
    return () => { cancelled = true; };
  }, [queue, active, finish]);

  const enqueue = useCallback(
    (req: LocalVideoCaptureRequest): readonly LocalVideoJob[] => {
      if (!project) return [];
      const jobs = expandVideoCapture(project, state.selectedRoomId, req);
      setQueue((q) => [...q, ...jobs]);
      return jobs;
    },
    [project, state.selectedRoomId],
  );

  const enqueueCurrent = useCallback((): readonly LocalVideoJob[] => {
    return enqueue(
      buildVideoCapture({
        scope: "current-environment",
        qualityId,
        output,
        timeline,
        audio,
      }),
    );
  }, [enqueue, qualityId, output, timeline, audio]);

  const cancel = useCallback((jobId: string) => {
    cancelledRef.current.add(jobId);
    setQueue((q) => {
      const j = q.find((x) => x.id === jobId);
      if (!j) return q;
      if (j.status === "queued") {
        setHistory((h) => [markVideoCancelled(j), ...h].slice(0, HISTORY_LIMIT));
        return q.filter((x) => x.id !== jobId);
      }
      return q;
    });
  }, []);

  const retry = useCallback((jobId: string) => {
    setHistory((h) => {
      const found = h.find((j) => j.id === jobId);
      if (!found) return h;
      const clone: LocalVideoJob = {
        ...found,
        id: `${found.id}_retry_${Date.now().toString(36)}`,
        status: "queued",
        stage: "queued",
        progress: 0,
        frameCursor: 0,
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

  return {
    scene,
    playbook,
    timeline,
    output,
    qualityId,
    audio,
    viewport,
    queue,
    active,
    history,
    setTimeline,
    setOutput,
    setQuality: setQualityId,
    setAudio,
    setViewport,
    enqueue,
    enqueueCurrent,
    cancel,
    retry,
    clearHistory,
  };
}