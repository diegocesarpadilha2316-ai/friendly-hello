import { useMemo } from "react";
import type { VisionRoomModel } from "../types";

interface Props {
  model: VisionRoomModel;
  photoUrl?: string;
}

/**
 * Renderização 2D leve (SVG) do modelo detectado — usada nas duas colunas
 * "Estrutura detectada" e "Prévia do ambiente". Sem dependência do Editor2D
 * real (que é acoplado ao provider). Apenas leitura visual do modelo.
 */
function VisionSvg({ model, style }: { model: VisionRoomModel; style: "wire" | "solid" }) {
  const pad = 200;
  const w = model.bounds.width + pad * 2;
  const h = model.bounds.depth + pad * 2;
  const openings = useMemo(() => {
    return model.openings.map((op) => {
      const wall = model.walls.find((wa) => wa.id === op.wallId);
      if (!wall) return null;
      const dx = wall.b.x - wall.a.x;
      const dy = wall.b.y - wall.a.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const t = Math.min(Math.max(op.offset / len, 0), 1);
      const cx = wall.a.x + dx * t + pad;
      const cy = wall.a.y + dy * t + pad;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      return { op, cx, cy, angle };
    });
  }, [model]);

  const floorFill = style === "solid" ? model.floor.color : "transparent";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <rect
        x={pad}
        y={pad}
        width={model.bounds.width}
        height={model.bounds.depth}
        fill={floorFill}
        stroke="hsl(var(--border))"
        strokeWidth={20}
      />
      {model.walls.map((wall) => (
        <line
          key={wall.id}
          x1={wall.a.x + pad}
          y1={wall.a.y + pad}
          x2={wall.b.x + pad}
          y2={wall.b.y + pad}
          stroke="hsl(var(--primary))"
          strokeWidth={wall.thickness}
          strokeLinecap="round"
          opacity={style === "wire" ? 0.9 : 0.75}
        />
      ))}
      {openings.map((entry) => {
        if (!entry) return null;
        const color =
          entry.op.role === "door" ? "hsl(var(--accent))" : "hsl(var(--chart-3, var(--primary)))";
        return (
          <g
            key={entry.op.id}
            transform={`translate(${entry.cx} ${entry.cy}) rotate(${entry.angle})`}
          >
            <rect
              x={-entry.op.width / 2}
              y={-60}
              width={entry.op.width}
              height={120}
              fill={color}
              opacity={0.9}
            />
            <text y={-90} textAnchor="middle" fontSize={110} fill="hsl(var(--muted-foreground))">
              {entry.op.role === "door" ? "P" : "J"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function VisionPreview({ model, photoUrl }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Foto original
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-muted/20">
          {photoUrl ? (
            <img src={photoUrl} alt="Foto do ambiente" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sem foto
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Estrutura detectada
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-background">
          <VisionSvg model={model} style="wire" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Prévia do ambiente
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <VisionSvg model={model} style="solid" />
        </div>
      </div>
    </div>
  );
}
