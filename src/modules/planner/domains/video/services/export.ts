/**
 * Fase 3.10 — Formatos de exportação.
 */
import type { VideoAspectRatio, VideoExportFormat, VideoResolution } from "../types";

function res(
  width: number,
  height: number,
  tier: VideoResolution["tier"],
  label: string,
): VideoResolution {
  return { width, height, tier, label };
}

export const VIDEO_RESOLUTIONS: readonly VideoResolution[] = [
  res(1280, 720, "hd", "HD 720p"),
  res(1920, 1080, "fhd", "Full HD 1080p"),
  res(2560, 1440, "qhd", "QHD 1440p"),
  res(3840, 2160, "4k", "4K UHD"),
  res(7680, 4320, "8k", "8K UHD"),
];

export const VIDEO_FORMATS: readonly VideoExportFormat[] = [
  {
    id: "fmt-fhd-16-9",
    label: "MP4 · Full HD · 16:9",
    container: "mp4",
    aspect: "16:9",
    resolution: VIDEO_RESOLUTIONS[1],
    fps: 30,
    bitrateKbps: 12000,
    codec: "h264",
  },
  {
    id: "fmt-4k-16-9",
    label: "MP4 · 4K · 16:9",
    container: "mp4",
    aspect: "16:9",
    resolution: VIDEO_RESOLUTIONS[3],
    fps: 30,
    bitrateKbps: 40000,
    codec: "h265",
  },
  {
    id: "fmt-8k-16-9",
    label: "MP4 · 8K · 16:9",
    container: "mp4",
    aspect: "16:9",
    resolution: VIDEO_RESOLUTIONS[4],
    fps: 30,
    bitrateKbps: 100000,
    codec: "h265",
  },
  {
    id: "fmt-fhd-9-16",
    label: "MP4 · Full HD · 9:16 Vertical",
    container: "mp4",
    aspect: "9:16",
    resolution: { width: 1080, height: 1920, tier: "fhd", label: "1080×1920" },
    fps: 30,
    bitrateKbps: 10000,
    codec: "h264",
  },
  {
    id: "fmt-4k-9-16",
    label: "MP4 · 4K · 9:16 Vertical",
    container: "mp4",
    aspect: "9:16",
    resolution: { width: 2160, height: 3840, tier: "4k", label: "2160×3840" },
    fps: 30,
    bitrateKbps: 35000,
    codec: "h265",
  },
  {
    id: "fmt-fhd-1-1",
    label: "MP4 · Full HD · 1:1 Quadrado",
    container: "mp4",
    aspect: "1:1",
    resolution: { width: 1080, height: 1080, tier: "fhd", label: "1080×1080" },
    fps: 30,
    bitrateKbps: 9000,
    codec: "h264",
  },
  {
    id: "fmt-fhd-4-5",
    label: "MP4 · Full HD · 4:5 Feed",
    container: "mp4",
    aspect: "4:5",
    resolution: { width: 1080, height: 1350, tier: "fhd", label: "1080×1350" },
    fps: 30,
    bitrateKbps: 9000,
    codec: "h264",
  },
  {
    id: "fmt-mov-prores-4k",
    label: "MOV · ProRes · 4K",
    container: "mov",
    aspect: "16:9",
    resolution: VIDEO_RESOLUTIONS[3],
    fps: 30,
    bitrateKbps: 350000,
    codec: "prores",
    notes: "Master para edição externa.",
  },
  {
    id: "fmt-gif-fhd",
    label: "GIF · 720p · 16:9",
    container: "gif",
    aspect: "16:9",
    resolution: VIDEO_RESOLUTIONS[0],
    fps: 24,
    bitrateKbps: 4000,
    codec: "gif",
  },
  {
    id: "fmt-png-4k",
    label: "Frames PNG · 4K",
    container: "png-sequence",
    aspect: "16:9",
    resolution: VIDEO_RESOLUTIONS[3],
    fps: 30,
    bitrateKbps: 0,
    codec: "png",
    notes: "Sequência para composição pós externa.",
  },
];

export const DEFAULT_VIDEO_FORMAT_ID = "fmt-fhd-16-9";

export function getVideoFormat(id: string): VideoExportFormat {
  return VIDEO_FORMATS.find((f) => f.id === id) ?? VIDEO_FORMATS[0];
}
export function formatsByAspect(aspect: VideoAspectRatio): readonly VideoExportFormat[] {
  return VIDEO_FORMATS.filter((f) => f.aspect === aspect);
}
