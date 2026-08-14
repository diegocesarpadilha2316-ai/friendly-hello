import { Sparkles, Zap } from "lucide-react";
import { VIDEO_ENGINES } from "../services/engines";
import { cn } from "@/lib/utils";
import type { VideoEngineId } from "../types";

export interface EnginePanelProps {
  readonly engineId: VideoEngineId;
  readonly onSelect: (id: VideoEngineId) => void;
}

export function EnginePanel({ engineId, onSelect }: EnginePanelProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {VIDEO_ENGINES.map((e) => {
        const active = e.id === engineId;
        const Icon = e.tier === "free" ? Zap : Sparkles;
        return (
          <button
            key={e.id}
            type="button"
            disabled={!e.available}
            onClick={() => onSelect(e.id)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border px-3 py-2 text-left transition",
              active
                ? "border-primary/60 bg-primary/10"
                : "border-border/50 bg-muted/10 hover:border-primary/30",
              !e.available && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    e.tier === "free" ? "text-emerald-400" : "text-primary",
                  )}
                />
                <span className="text-[12px] font-semibold text-foreground">{e.label}</span>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-widest ring-1 ring-inset",
                  e.tier === "free"
                    ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                    : "bg-primary/10 text-primary ring-primary/30",
                )}
              >
                {e.tier === "free" ? "Grátis" : e.available ? "Premium" : "Em breve"}
              </span>
            </div>
            <p className="line-clamp-2 text-[10px] text-muted-foreground">{e.description}</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {e.features.slice(0, 3).map((f) => (
                <li
                  key={f}
                  className="rounded-md bg-background/40 px-1.5 py-0.5 text-[9px] text-muted-foreground ring-1 ring-inset ring-border/40"
                >
                  {f}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
