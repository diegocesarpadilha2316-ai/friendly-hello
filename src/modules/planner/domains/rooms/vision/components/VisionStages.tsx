import { Check, Loader2, CircleDashed, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisionStage } from "../types";

function StageIcon({ status }: { status: VisionStage["status"] }) {
  if (status === "done") return <Check className="h-4 w-4 text-emerald-400" />;
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === "error") return <TriangleAlert className="h-4 w-4 text-destructive" />;
  return <CircleDashed className="h-4 w-4 text-muted-foreground/60" />;
}

export function VisionStages({ stages }: { stages: readonly VisionStage[] }) {
  return (
    <ol className="space-y-2">
      {stages.map((s) => {
        const active = s.status === "running";
        const done = s.status === "done";
        return (
          <li
            key={s.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
              active && "border-primary/40 bg-primary/5",
              done && "border-emerald-500/30 bg-emerald-500/5",
              !active && !done && "border-border/60 bg-muted/10",
            )}
          >
            <StageIcon status={s.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className={cn("text-sm font-medium", active && "text-primary")}>
                  {s.label}
                  {active && <span className="ml-1 opacity-70">…</span>}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {s.status === "done"
                    ? "concluído"
                    : s.status === "running"
                      ? "em curso"
                      : s.status === "error"
                        ? "erro"
                        : "aguardando"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{s.detail}</div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    done ? "bg-emerald-500" : "bg-primary",
                  )}
                  style={{ width: `${Math.round(s.progress * 100)}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
