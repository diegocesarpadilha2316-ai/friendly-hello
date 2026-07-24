import { ANIMATION_TEMPLATES } from "../services/animations";
import { cn } from "@/lib/utils";
import type { VideoAnimationKind } from "../types";

export interface AnimationsPanelProps {
  readonly selectedKinds: readonly VideoAnimationKind[];
  readonly onToggle: (kind: VideoAnimationKind) => void;
}

export function AnimationsPanel({ selectedKinds, onToggle }: AnimationsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {ANIMATION_TEMPLATES.map((t) => {
        const active = selectedKinds.includes(t.kind);
        return (
          <button
            key={t.kind}
            type="button"
            onClick={() => onToggle(t.kind)}
            className={cn(
              "flex items-start justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition",
              active
                ? "border-primary/60 bg-primary/10"
                : "border-border/50 bg-muted/10 text-muted-foreground hover:border-primary/30",
            )}
          >
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-foreground">{t.label}</div>
              <p className="line-clamp-2 text-[10px] opacity-80">{t.description}</p>
            </div>
            <span className="shrink-0 text-[9px] uppercase tracking-widest opacity-70">
              {t.defaultDurationSec}s
            </span>
          </button>
        );
      })}
    </div>
  );
}
