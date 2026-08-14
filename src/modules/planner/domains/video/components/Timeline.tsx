import { totalDuration } from "../services/timeline";
import type { VideoTimeline, VideoTrackKind } from "../types";

export interface TimelineProps {
  readonly timeline: VideoTimeline;
}

const KIND_COLORS: Record<VideoTrackKind, string> = {
  camera: "from-primary/70 to-primary/30",
  animation: "from-accent/70 to-accent/30",
  lighting: "from-amber-400/70 to-amber-500/20",
  narration: "from-emerald-400/70 to-emerald-500/20",
  music: "from-fuchsia-400/70 to-fuchsia-500/20",
  subtitle: "from-sky-400/70 to-sky-500/20",
  branding: "from-rose-400/70 to-rose-500/20",
};

const KIND_LABELS: Record<VideoTrackKind, string> = {
  camera: "Câmera",
  animation: "Animação",
  lighting: "Iluminação",
  narration: "Narração",
  music: "Trilha",
  subtitle: "Legenda",
  branding: "Marca",
};

export function Timeline({ timeline }: TimelineProps) {
  const total = Math.max(1, totalDuration(timeline));
  const marks = Array.from(
    { length: Math.min(20, Math.ceil(total)) + 1 },
    (_, i) => (i * total) / Math.min(20, Math.ceil(total)),
  );
  const rows: readonly VideoTrackKind[] = [
    "camera",
    "animation",
    "lighting",
    "narration",
    "music",
    "subtitle",
    "branding",
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-background/50 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>
          Timeline · {timeline.fps}fps · {total.toFixed(1)}s
        </span>
        <span>
          {timeline.sequences.length} seq · {timeline.tracks.length} tracks
        </span>
      </div>

      {/* Régua */}
      <div className="relative mb-2 h-5 rounded-md bg-muted/10 ring-1 ring-inset ring-border/40">
        {marks.map((m, i) => (
          <div
            key={i}
            className="absolute inset-y-0 border-l border-border/40"
            style={{ left: `${(m / total) * 100}%` }}
          >
            <span className="absolute top-0.5 ml-1 text-[9px] text-muted-foreground">
              {m.toFixed(0)}s
            </span>
          </div>
        ))}
      </div>

      {/* Tracks */}
      <div className="space-y-1">
        {rows.map((kind) => {
          const tracks = timeline.tracks.filter((t) => t.kind === kind);
          return (
            <div key={kind} className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {KIND_LABELS[kind]}
              </span>
              <div className="relative h-6 rounded-md bg-muted/10 ring-1 ring-inset ring-border/40">
                {tracks.map((t) => (
                  <div
                    key={t.id}
                    title={`${t.label} · ${t.durationSec.toFixed(1)}s`}
                    className={`absolute top-0.5 bottom-0.5 rounded-md bg-gradient-to-r ring-1 ring-inset ring-white/10 ${KIND_COLORS[kind]}`}
                    style={{
                      left: `${(t.startSec / total) * 100}%`,
                      width: `${Math.max(0.5, (t.durationSec / total) * 100)}%`,
                    }}
                  >
                    <span className="ml-1.5 line-clamp-1 text-[9px] font-medium text-white/90">
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
