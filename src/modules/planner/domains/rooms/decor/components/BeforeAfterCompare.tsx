import { useMemo } from "react";
import type { PlannerRoom } from "@/modules/planner/shared/types/project";
import { toPrimitive } from "@/modules/planner/shared/editor-2d/serialization";
import { cn } from "@/lib/utils";
import type { DecorSuggestion } from "../types";
import { getDecorItem } from "../catalog";

interface Props {
  room: PlannerRoom | null;
  beforeNodeIds: readonly string[];
  suggestions: readonly DecorSuggestion[];
}

/**
 * SVG leve — mostra a planta do cômodo em dois estados:
 * "Antes" (apenas nós presentes em `beforeNodeIds`) e "Depois"
 * (nós atuais + sugestões aceitas projetadas). Não altera o projeto.
 */
function RoomSvg({
  room,
  visibleIds,
  extras,
  label,
  accent,
}: {
  room: PlannerRoom;
  visibleIds: Set<string> | null;
  extras: DecorSuggestion[];
  label: string;
  accent: "before" | "after";
}) {
  const pad = 200;
  const w = room.dimensions.width + pad * 2;
  const h = room.dimensions.depth + pad * 2;

  const walls = useMemo(() => {
    return room.nodeOrder
      .map((id) => room.nodes[id])
      .filter((n) => n && (!visibleIds || visibleIds.has(n.id)))
      .map(toPrimitive)
      .filter(Boolean) as ReturnType<typeof toPrimitive>[];
  }, [room, visibleIds]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        accent === "after" ? "border-primary/40" : "border-border/60",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-xs uppercase tracking-wide",
          accent === "after" ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground",
        )}
      >
        <span>{label}</span>
        <span>
          {room.dimensions.width}×{room.dimensions.depth} mm
        </span>
      </div>
      <div className="aspect-[4/3] bg-background">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
          <rect
            x={pad}
            y={pad}
            width={room.dimensions.width}
            height={room.dimensions.depth}
            fill="hsl(var(--muted)/0.35)"
            stroke="hsl(var(--border))"
            strokeWidth={20}
          />
          {walls.map((p) => {
            if (!p) return null;
            if (p.kind === "wall") {
              return (
                <line
                  key={p.id}
                  x1={p.x1 + pad}
                  y1={p.y1 + pad}
                  x2={p.x2 + pad}
                  y2={p.y2 + pad}
                  stroke="hsl(var(--foreground))"
                  strokeWidth={p.thickness}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              );
            }
            if (p.kind === "furniture") {
              return (
                <g
                  key={p.id}
                  transform={`translate(${p.x + p.width / 2 + pad} ${p.y + p.depth / 2 + pad}) rotate(${p.rotation})`}
                >
                  <rect
                    x={-p.width / 2}
                    y={-p.depth / 2}
                    width={p.width}
                    height={p.depth}
                    fill="hsl(var(--muted))"
                    stroke="hsl(var(--border))"
                    strokeWidth={10}
                    opacity={0.8}
                  />
                </g>
              );
            }
            if (p.kind === "opening") {
              return (
                <rect
                  key={p.id}
                  x={p.x - p.width / 2 + pad}
                  y={p.y - 40 + pad}
                  width={p.width}
                  height={80}
                  fill="hsl(var(--accent))"
                  opacity={0.9}
                />
              );
            }
            return null;
          })}
          {extras.map((s) => {
            if (s.target !== "item" || !s.itemId || !s.at) return null;
            const item = getDecorItem(s.itemId);
            if (!item) return null;
            const w2 = s.overrides?.width ?? item.defaults.width;
            const d2 = s.overrides?.depth ?? item.defaults.depth;
            return (
              <g
                key={s.id}
                transform={`translate(${s.at.x + pad} ${s.at.y + pad}) rotate(${s.rotation ?? 0})`}
              >
                <rect
                  x={-w2 / 2}
                  y={-d2 / 2}
                  width={w2}
                  height={d2}
                  fill={item.color ?? "hsl(var(--primary))"}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="30 20"
                  strokeWidth={15}
                  opacity={0.55}
                />
                <text
                  y={0}
                  textAnchor="middle"
                  fontSize={140}
                  fill="hsl(var(--primary-foreground))"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                >
                  {item.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function BeforeAfterCompare({ room, beforeNodeIds, suggestions }: Props) {
  if (!room) return null;
  const beforeSet = beforeNodeIds.length > 0 ? new Set(beforeNodeIds) : null;
  const acceptedItems = suggestions.filter((s) => s.status === "accepted" && s.target === "item");
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <RoomSvg room={room} visibleIds={beforeSet} extras={[]} label="Antes" accent="before" />
      <RoomSvg room={room} visibleIds={null} extras={acceptedItems} label="Depois" accent="after" />
    </div>
  );
}
