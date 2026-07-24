import { Check, Palette, Sparkles, X, Lightbulb, Layers } from "lucide-react";
import { Button, StatusBadge } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { getDecorItem } from "../catalog";
import { getLightingScene } from "../lighting";
import { getDecorMaterial } from "../materials";
import type { DecorSuggestion, DecorSuggestionStatus } from "../types";

interface Props {
  suggestions: readonly DecorSuggestion[];
  onStatus: (id: string, status: DecorSuggestionStatus) => void;
}

function iconFor(s: DecorSuggestion) {
  if (s.target === "lighting") return Lightbulb;
  if (s.target === "material") return Layers;
  if (s.target === "palette") return Palette;
  return Sparkles;
}

function detailsFor(s: DecorSuggestion): string {
  if (s.target === "item" && s.itemId) {
    const item = getDecorItem(s.itemId);
    if (!item) return "";
    return `${item.defaults.width}×${item.defaults.depth}×${item.defaults.height} mm${item.material ? ` · ${item.material}` : ""}`;
  }
  if (s.target === "lighting" && s.lightingSceneId) {
    const scene = getLightingScene(s.lightingSceneId);
    if (!scene) return "";
    return `${scene.emitters.length} emissores · ${scene.emitters[0]?.temperature ?? "neutra"}`;
  }
  if (s.target === "material" && s.materialId) {
    const m = getDecorMaterial(s.materialId);
    if (!m) return "";
    return `${m.family} · ${m.description}`;
  }
  if (s.target === "palette" && s.paletteHex) {
    return s.paletteHex.slice(0, 5).join(" · ");
  }
  return "";
}

function StatusChip({ status }: { status: DecorSuggestionStatus }) {
  if (status === "accepted") return <StatusBadge tone="success">aceito</StatusBadge>;
  if (status === "rejected") return <StatusBadge tone="danger">rejeitado</StatusBadge>;
  return <StatusBadge tone="neutral">pendente</StatusBadge>;
}

export function SuggestionList({ suggestions, onStatus }: Props) {
  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
        Nenhuma sugestão nesta lista.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {suggestions.map((s) => {
        const Icon = iconFor(s);
        const palette = s.target === "palette" ? s.paletteHex : undefined;
        return (
          <li
            key={s.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 transition-colors",
              s.status === "accepted" && "border-emerald-500/40 bg-emerald-500/5",
              s.status === "rejected" && "border-destructive/30 bg-destructive/5 opacity-70",
              s.status === "pending" && "border-border/60 bg-background/60",
            )}
          >
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">{s.title}</div>
                <StatusChip status={s.status} />
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.reason}</div>
              <div className="mt-1 text-xs text-muted-foreground/80">{detailsFor(s)}</div>
              {palette && (
                <div className="mt-2 flex items-center gap-1.5">
                  {palette.map((c, i) => (
                    <span
                      key={`${c}-${i}`}
                      className="h-4 w-4 rounded-full border border-border/60"
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant={s.status === "accepted" ? "default" : "outline"}
                onClick={() => onStatus(s.id, s.status === "accepted" ? "pending" : "accepted")}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={s.status === "rejected" ? "destructive" : "ghost"}
                onClick={() => onStatus(s.id, s.status === "rejected" ? "pending" : "rejected")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}