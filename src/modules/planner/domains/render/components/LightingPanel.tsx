import { cn } from "@/lib/utils";
import { RENDER_HDRIS, RENDER_LIGHT_PRESETS } from "../services/lighting";

interface Props {
  hdriId: string | null;
  extraLightIds: readonly string[];
  onHdriChange: (id: string | null) => void;
  onToggleLight: (id: string) => void;
}

export function LightingPanel({ hdriId, extraLightIds, onHdriChange, onToggleLight }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">HDRI</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {RENDER_HDRIS.map((h) => {
            const active = hdriId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onHdriChange(active ? null : h.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-left text-xs transition",
                  active ? "border-primary/60 bg-primary/10" : "border-border/60 bg-muted/20 hover:bg-muted/40",
                )}
              >
                <div className="font-medium">{h.label}</div>
                <div className="text-[10px] text-muted-foreground">{h.temperatureK}K · int {h.intensity.toFixed(1)}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Luzes adicionais</h4>
        <div className="grid grid-cols-1 gap-1">
          {RENDER_LIGHT_PRESETS.map((l) => {
            const active = extraLightIds.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onToggleLight(l.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs transition",
                  active ? "border-primary/60 bg-primary/10" : "border-border/60 bg-muted/20 hover:bg-muted/40",
                )}
              >
                <span>
                  <span className="font-medium">{l.label}</span>{" "}
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{l.kind}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">{l.temperatureK}K</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}