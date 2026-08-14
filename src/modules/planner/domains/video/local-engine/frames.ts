/**
 * Fase 3.22 — Utilitários de frames (timecodes, seek, mapping).
 */
import type { LocalFps, LocalTimeline } from "./types";

export function frameToTime(frame: number, fps: LocalFps): number {
  return frame / fps;
}

export function timeToFrame(sec: number, fps: LocalFps): number {
  return Math.round(sec * fps);
}

export function timecode(frame: number, fps: LocalFps): string {
  const total = frame / fps;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const f = frame % fps;
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

export function timelineFrames(t: LocalTimeline): readonly number[] {
  const total = Math.round(t.durationSec * t.fps);
  const out: number[] = [];
  for (let f = 0; f < total; f += 1) out.push(f);
  return out;
}

export function frameAtClip(
  t: LocalTimeline,
  clipId: string,
): { start: number; end: number } | null {
  const c = t.clips.find((x) => x.id === clipId);
  if (!c) return null;
  return {
    start: timeToFrame(c.startSec, t.fps),
    end: timeToFrame(c.startSec + c.durationSec, t.fps),
  };
}
