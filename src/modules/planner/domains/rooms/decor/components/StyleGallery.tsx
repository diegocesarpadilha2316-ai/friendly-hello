import { cn } from "@/lib/utils";
import { DECOR_STYLES } from "../styles";
import type { DecorStyleId } from "../types";

interface Props {
  value: DecorStyleId;
  onChange: (id: DecorStyleId) => void;
  disabled?: boolean;
}

export function StyleGallery({ value, onChange, disabled }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {DECOR_STYLES.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => !disabled && onChange(s.id)}
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              "group flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
              active
                ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                : "border-border/60 bg-muted/10 hover:border-primary/30 hover:bg-muted/20",
              disabled && "opacity-60",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50">
              <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                {s.palette.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ background: c }} className="h-full w-full" />
                ))}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className={cn("text-sm font-medium", active && "text-primary")}>{s.name}</div>
              <div className="truncate text-xs text-muted-foreground">{s.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
