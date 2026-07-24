import { CAMERA_MOVES } from "../services/camera-moves";
import { cn } from "@/lib/utils";
import type { VideoCameraMoveKind } from "../types";

export interface CameraMovePanelProps {
  readonly selectedKinds: readonly VideoCameraMoveKind[];
  readonly onToggle: (kind: VideoCameraMoveKind) => void;
}

export function CameraMovePanel({ selectedKinds, onToggle }: CameraMovePanelProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CAMERA_MOVES.map((m) => {
        const active = selectedKinds.includes(m.kind);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggle(m.kind)}
            className={cn(
              "rounded-lg border px-2.5 py-2 text-left text-[11px] transition",
              active
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border/50 bg-muted/10 text-muted-foreground hover:border-primary/30",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{m.label}</span>
              <span className="text-[9px] opacity-70">{m.durationSec}s</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[10px] opacity-80">{m.description}</p>
          </button>
        );
      })}
    </div>
  );
}
