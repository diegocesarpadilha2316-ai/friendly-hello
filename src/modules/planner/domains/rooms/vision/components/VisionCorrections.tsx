import { FormSection } from "@/core/components/ui-kit";
import type { VisionCorrectionPatch, VisionRoomModel } from "../types";

interface Props {
  model: VisionRoomModel;
  onPatch: (patch: (prev: VisionCorrectionPatch) => VisionCorrectionPatch) => void;
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 10,
  suffix = "mm",
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
    </label>
  );
}

export function VisionCorrections({ model, onPatch }: Props) {
  return (
    <div className="space-y-6">
      <FormSection title="Ambiente detectado" description="Ajuste nome, tipo e dimensões estimadas.">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Nome</span>
            <input
              type="text"
              value={model.suggestedName}
              onChange={(e) => onPatch((prev) => ({ ...prev, suggestedName: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</span>
            <select
              value={model.suggestedType}
              onChange={(e) =>
                onPatch((prev) => ({ ...prev, suggestedType: e.target.value as VisionRoomModel["suggestedType"] }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="cozinha">Cozinha</option>
              <option value="sala">Sala</option>
              <option value="dormitorio">Dormitório</option>
              <option value="closet">Closet</option>
              <option value="banheiro">Banheiro</option>
              <option value="lavanderia">Lavanderia</option>
              <option value="escritorio">Escritório</option>
              <option value="comercial">Comercial</option>
              <option value="corporativo">Corporativo</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <NumberField
            label="Largura"
            value={model.bounds.width}
            onChange={(n) => onPatch((prev) => ({ ...prev, bounds: { ...prev.bounds, width: n } }))}
          />
          <NumberField
            label="Profundidade"
            value={model.bounds.depth}
            onChange={(n) => onPatch((prev) => ({ ...prev, bounds: { ...prev.bounds, depth: n } }))}
          />
          <NumberField
            label="Altura (pé-direito)"
            value={model.bounds.height}
            onChange={(n) => onPatch((prev) => ({ ...prev, bounds: { ...prev.bounds, height: n } }))}
          />
        </div>
      </FormSection>

      <FormSection title="Paredes" description="Espessura e altura por parede detectada.">
        <div className="space-y-2">
          {model.walls.map((wall) => (
            <div key={wall.id} className="grid gap-3 rounded-lg border border-border/60 bg-muted/10 p-3 md:grid-cols-4">
              <div className="text-xs">
                <div className="font-medium">{wall.id}</div>
                <div className="text-muted-foreground">
                  ({wall.a.x}, {wall.a.y}) → ({wall.b.x}, {wall.b.y})
                </div>
                <div className="mt-1 text-muted-foreground">
                  confiança {(wall.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <NumberField
                label="Espessura"
                value={wall.thickness}
                onChange={(n) =>
                  onPatch((prev) => ({
                    ...prev,
                    walls: { ...(prev.walls ?? {}), [wall.id]: { ...(prev.walls?.[wall.id] ?? {}), thickness: n } },
                  }))
                }
              />
              <NumberField
                label="Altura"
                value={wall.height}
                onChange={(n) =>
                  onPatch((prev) => ({
                    ...prev,
                    walls: { ...(prev.walls ?? {}), [wall.id]: { ...(prev.walls?.[wall.id] ?? {}), height: n } },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Portas e janelas" description="Ajuste dimensões e posicionamento.">
        <div className="space-y-2">
          {model.openings.map((op) => (
            <div key={op.id} className="grid gap-3 rounded-lg border border-border/60 bg-muted/10 p-3 md:grid-cols-4">
              <div className="text-xs">
                <div className="font-medium capitalize">{op.role === "door" ? "Porta" : "Janela"}</div>
                <div className="text-muted-foreground">na parede {op.wallId}</div>
                <div className="mt-1 text-muted-foreground">
                  confiança {(op.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <NumberField
                label="Largura"
                value={op.width}
                onChange={(n) =>
                  onPatch((prev) => ({
                    ...prev,
                    openings: {
                      ...(prev.openings ?? {}),
                      [op.id]: { ...(prev.openings?.[op.id] ?? {}), width: n },
                    },
                  }))
                }
              />
              <NumberField
                label="Altura"
                value={op.height}
                onChange={(n) =>
                  onPatch((prev) => ({
                    ...prev,
                    openings: {
                      ...(prev.openings ?? {}),
                      [op.id]: { ...(prev.openings?.[op.id] ?? {}), height: n },
                    },
                  }))
                }
              />
              <NumberField
                label="Distância na parede"
                value={op.offset}
                onChange={(n) =>
                  onPatch((prev) => ({
                    ...prev,
                    openings: {
                      ...(prev.openings ?? {}),
                      [op.id]: { ...(prev.openings?.[op.id] ?? {}), offset: n },
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );
}