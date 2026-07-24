import { VIDEO_FORMATS } from "../services/export";
import { cn } from "@/lib/utils";

export interface ExportPanelProps {
  readonly formatId: string;
  readonly onSelect: (formatId: string) => void;
}

export function ExportPanel({ formatId, onSelect }: ExportPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {VIDEO_FORMATS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onSelect(f.id)}
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition",
            f.id === formatId
              ? "border-primary/60 bg-primary/10"
              : "border-border/50 bg-muted/10 text-muted-foreground hover:border-primary/30",
          )}
        >
          <div>
            <div className="text-[11px] font-semibold text-foreground">{f.label}</div>
            <div className="text-[10px] opacity-70">
              {f.resolution.label} · {f.codec.toUpperCase()} · {f.fps}fps
            </div>
          </div>
          <span className="rounded-full bg-background/60 px-2 py-0.5 text-[9px] uppercase tracking-widest ring-1 ring-inset ring-border/60">
            {f.container}
          </span>
        </button>
      ))}
    </div>
  );
}
