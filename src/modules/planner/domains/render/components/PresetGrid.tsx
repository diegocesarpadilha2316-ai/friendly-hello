import { cn } from "@/lib/utils";
import { RENDER_PRESETS } from "../services/presets";
import type { RenderPresetId } from "../types";

interface Props {
  selectedId: RenderPresetId;
  onSelect: (id: RenderPresetId) => void;
}

export function PresetGrid({ selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
      {RENDER_PRESETS.map((p) => {
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border p-3 text-left transition",
              active
                ? "border-primary/60 bg-primary/10 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.6)]"
                : "border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-tight">{p.label}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.quality.resolution.label}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Chip label={`Samples ${p.quality.samples}`} />
              <Chip label={`AA ${p.quality.antialiasing.toUpperCase()}`} />
              <Chip label={`GI ${p.quality.globalIllumination}`} />
              <Chip label={`Denoise ${p.quality.denoise}`} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border/60">
      {label}
    </span>
  );
}
