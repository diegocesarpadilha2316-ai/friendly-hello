import { SCENE_PRESETS } from "../services/scenes";
import { cn } from "@/lib/utils";
import type { VideoSceneKind } from "../types";

export interface SceneGridProps {
  readonly selectedKind: VideoSceneKind;
  readonly onSelect: (kind: VideoSceneKind) => void;
}

export function SceneGrid({ selectedKind, onSelect }: SceneGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-1 2xl:grid-cols-2">
      {SCENE_PRESETS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.kind)}
          className={cn(
            "group flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition",
            s.kind === selectedKind
              ? "border-primary/60 bg-primary/10"
              : "border-border/50 bg-muted/10 hover:border-primary/30 hover:bg-primary/5",
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-semibold">{s.label}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
              {s.aspectRatio} · {s.durationSec}s
            </span>
          </div>
          <p className="line-clamp-2 text-[10px] text-muted-foreground">{s.description}</p>
        </button>
      ))}
    </div>
  );
}
