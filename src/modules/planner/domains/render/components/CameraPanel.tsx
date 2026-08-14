import { cn } from "@/lib/utils";
import { RENDER_CAMERAS } from "../services/cameras";

interface Props {
  cameraId: string;
  onSelect: (id: string) => void;
}

export function CameraPanel({ cameraId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {RENDER_CAMERAS.map((c) => {
        const active = c.id === cameraId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left transition",
              active
                ? "border-primary/60 bg-primary/10"
                : "border-border/60 bg-muted/20 hover:bg-muted/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{c.label}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {c.kind}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {c.focalLengthMm}mm · f/{c.apertureF} · 1/{c.shutter}s · ISO {c.iso}
            </div>
          </button>
        );
      })}
    </div>
  );
}
