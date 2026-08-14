/**
 * Fase 3.22 — Adapter FFmpeg (puro).
 *
 * Não executa FFmpeg. Retorna a linha de comando/args que qualquer
 * runner futuro (WASM, WebCodecs, servidor) usará. Zero side-effect.
 */
import type { LocalVideoJob, LocalVideoOutputSpec } from "./types";

export interface FfmpegPlan {
  readonly bin: "ffmpeg";
  readonly input: string;
  readonly output: string;
  readonly args: readonly string[];
  readonly command: string;
}

function codecArg(spec: LocalVideoOutputSpec): readonly string[] {
  switch (spec.codec) {
    case "h264":
      return ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium"];
    case "h265":
      return ["-c:v", "libx265", "-pix_fmt", "yuv420p", "-preset", "medium"];
    case "vp9":
      return ["-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-b:v", `${spec.bitrateKbps}k`];
    case "av1":
      return ["-c:v", "libaom-av1", "-pix_fmt", "yuv420p"];
    case "prores":
      return ["-c:v", "prores_ks", "-profile:v", "3"];
    case "gif":
      return ["-loop", "0"];
    case "png":
      return ["-c:v", "png"];
  }
}

function containerExt(spec: LocalVideoOutputSpec): string {
  return spec.container === "png-sequence" ? "png" : spec.container;
}

export function buildFfmpegPlan(job: LocalVideoJob, framesGlob = "frames/%06d.png"): FfmpegPlan {
  const spec = job.output;
  const output = `dioris-${job.id}.${containerExt(spec)}`;
  const args = [
    "-y",
    "-framerate",
    String(spec.fps),
    "-i",
    framesGlob,
    "-vf",
    `scale=${spec.resolution.width}:${spec.resolution.height}`,
    ...codecArg(spec),
    "-b:v",
    `${spec.bitrateKbps}k`,
    "-r",
    String(spec.fps),
    output,
  ];
  return {
    bin: "ffmpeg",
    input: framesGlob,
    output,
    args,
    command: `ffmpeg ${args.map((a) => (a.includes(" ") ? JSON.stringify(a) : a)).join(" ")}`,
  };
}
