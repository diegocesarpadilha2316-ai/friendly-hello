/**
 * Inspector — Fase 3.5.
 *
 * Painel de engenharia do móvel selecionado. Consome exclusivamente
 * o `PlannerEditorProvider` (Fases 3.1/3.4) para escrever alterações
 * — TODAS as mutações fluem por `updateProject`, herdando Undo/Redo,
 * Autosave, Histórico e sincronização com 2D/3D/Biblioteca.
 */
import { useMemo, useState } from "react";
import { Ruler, PackageOpen, Wrench, Palette, Layers as LayersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/core/providers/TenantProvider";
import { Button } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";
import { listPrimitives } from "../editor-2d/serialization";
import type { Editor2DPrimitive } from "../editor-2d/types";
import type { PlannerParametricNode } from "../types/project";
import { MATERIAL_BRANDS, findBrand } from "./materials";
import { HARDWARE_ITEMS, listHardware } from "./hardware";
import {
  ASSEMBLY_OPTIONS,
  BACK_OPTIONS,
  BASE_OPTIONS,
  DOOR_OPTIONS,
  DRAWER_OPTIONS,
  EDGE_OPTIONS,
  GRAIN_OPTIONS,
  HANDLE_OPTIONS,
} from "./standards";
import { loadRules } from "./company-rules";
import { applyEngineeringOverride, resolveEngineering } from "./parameters";
import type { FurnitureEngineeringParams, HardwareKind } from "./types";
import { decomposeFurniture } from "./decompose";

type Furniture = Extract<Editor2DPrimitive, { kind: "furniture" }>;

function useFurnitureList(): {
  list: readonly Furniture[];
  environmentId: string | null;
  roomId: string | null;
} {
  const { state } = usePlannerEditor();
  return useMemo(() => {
    const env = state.project?.environments.find((e) => e.id === state.selectedEnvironmentId) ?? null;
    const room = env?.rooms.find((r) => r.id === state.selectedRoomId) ?? null;
    const list = room
      ? (listPrimitives(room).filter((p) => p.kind === "furniture") as Furniture[])
      : [];
    return { list, environmentId: env?.id ?? null, roomId: room?.id ?? null };
  }, [state.project, state.selectedEnvironmentId, state.selectedRoomId]);
}

export function Inspector({ initialFurnitureId }: { initialFurnitureId?: string | null } = {}) {
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const rules = useMemo(() => loadRules(tenantId), [tenantId]);
  const { list, environmentId, roomId } = useFurnitureList();
  const { updateProject } = usePlannerEditor();
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFurnitureId ?? list[list.length - 1]?.id ?? null,
  );
  const current = list.find((f) => f.id === selectedId) ?? list[list.length - 1] ?? null;

  if (!environmentId || !roomId) {
    return (
      <Empty title="Selecione um cômodo" description="Escolha um cômodo no projeto para editar seus móveis." />
    );
  }
  if (!current) {
    return (
      <Empty
        title="Nenhum móvel neste cômodo"
        description="Arraste peças da Biblioteca para o editor 2D e depois use este inspector."
      />
    );
  }

  const eng = resolveEngineering(current, rules);
  const decomposition = decomposeFurniture(current, rules);

  function patch(next: Partial<FurnitureEngineeringParams>) {
    if (!current || !environmentId || !roomId) return;
    const id = current.id;
    updateProject((project) => ({
      ...project,
      environments: project.environments.map((env) =>
        env.id !== environmentId
          ? env
          : {
              ...env,
              rooms: env.rooms.map((r) =>
                r.id !== roomId
                  ? r
                  : {
                      ...r,
                      updatedAt: new Date().toISOString(),
                      nodes: patchNodeParams(r.nodes, id, next),
                    },
              ),
            },
      ),
    }));
  }

  const brand = findBrand(eng.brandId);
  const finishes = brand?.finishes ?? [];
  const thicknesses = brand?.thicknesses.map((t) => t.mm) ?? [15, 18, 25];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 backdrop-blur">
      <header className="flex flex-col gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wrench className="h-3.5 w-3.5" />
          <span>Engenharia de Marcenaria</span>
          <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-primary">
            {rules.label}
          </span>
        </div>
        <select
          value={current.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {list.map((f) => (
            <option key={f.id} value={f.id}>
              {f.subtype} · {f.width}×{f.depth}×{f.height} mm
            </option>
          ))}
        </select>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <Section icon={Ruler} title="Dimensões (mm)">
          <NumberRow label="Largura" value={current.width} onChange={(v) => patchDim(current, v, "width", updateProject, environmentId, roomId)} />
          <NumberRow label="Profundidade" value={current.depth} onChange={(v) => patchDim(current, v, "depth", updateProject, environmentId, roomId)} />
          <NumberRow label="Altura" value={current.height} onChange={(v) => patchDim(current, v, "height", updateProject, environmentId, roomId)} />
          <NumberRow label="Rotação" value={current.rotation} onChange={(v) => patchDim(current, v, "rotation", updateProject, environmentId, roomId)} suffix="°" />
        </Section>

        <Section icon={LayersIcon} title="Chapa & Acabamento">
          <SelectRow
            label="Marca"
            value={eng.brandId}
            onChange={(v) => patch({ brandId: v })}
            options={MATERIAL_BRANDS.map((b) => ({ value: b.id, label: `${b.label} (${b.category})` }))}
          />
          <SelectRow
            label="Acabamento"
            value={eng.finishId}
            onChange={(v) => patch({ finishId: v })}
            options={finishes.map((f) => ({ value: f.id, label: f.label }))}
          />
          <SelectRow
            label="Espessura corpo"
            value={String(eng.thicknessMm)}
            onChange={(v) => patch({ thicknessMm: Number(v) })}
            options={thicknesses.map((mm) => ({ value: String(mm), label: `${mm} mm` }))}
          />
          <SelectRow
            label="Espessura fundo"
            value={String(eng.backThicknessMm)}
            onChange={(v) => patch({ backThicknessMm: Number(v) })}
            options={[3, 6, 9, 15, 18].map((mm) => ({ value: String(mm), label: `${mm} mm` }))}
          />
          <SelectRow
            label="Fita de borda"
            value={eng.edge}
            onChange={(v) => patch({ edge: v as FurnitureEngineeringParams["edge"] })}
            options={EDGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectRow
            label="Sentido do veio"
            value={eng.grain}
            onChange={(v) => patch({ grain: v as FurnitureEngineeringParams["grain"] })}
            options={GRAIN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <NumberRow label="Folga" value={eng.clearanceMm} onChange={(v) => patch({ clearanceMm: v })} suffix="mm" />
          <NumberRow label="Reveal" value={eng.reveal} onChange={(v) => patch({ reveal: v })} suffix="mm" />
        </Section>

        <Section icon={PackageOpen} title="Fabricação">
          <SelectRow
            label="Fundo"
            value={eng.back}
            onChange={(v) => patch({ back: v as FurnitureEngineeringParams["back"] })}
            options={BACK_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectRow
            label="Base"
            value={eng.base}
            onChange={(v) => patch({ base: v as FurnitureEngineeringParams["base"] })}
            options={BASE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectRow
            label="Montagem"
            value={eng.assembly}
            onChange={(v) => patch({ assembly: v as FurnitureEngineeringParams["assembly"] })}
            options={ASSEMBLY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectRow
            label="Tipo de porta"
            value={eng.door}
            onChange={(v) => patch({ door: v as FurnitureEngineeringParams["door"] })}
            options={DOOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectRow
            label="Tipo de gaveta"
            value={eng.drawer}
            onChange={(v) => patch({ drawer: v as FurnitureEngineeringParams["drawer"] })}
            options={DRAWER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectRow
            label="Puxador"
            value={eng.handle}
            onChange={(v) => patch({ handle: v as FurnitureEngineeringParams["handle"] })}
            options={HANDLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <NumberRow label="Portas" value={eng.doors} onChange={(v) => patch({ doors: Math.max(0, Math.round(v)) })} />
          <NumberRow label="Gavetas" value={eng.drawers} onChange={(v) => patch({ drawers: Math.max(0, Math.round(v)) })} />
          <NumberRow label="Prateleiras" value={eng.shelves} onChange={(v) => patch({ shelves: Math.max(0, Math.round(v)) })} />
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Espelhado</span>
            <input
              type="checkbox"
              checked={eng.mirrored}
              onChange={(e) => patch({ mirrored: e.target.checked })}
            />
          </label>
        </Section>

        <Section icon={Palette} title="Ferragens">
          {(
            ["dobradica", "corredica", "pistao", "trilho", "cabideiro", "perfil", "puxador", "amortecedor"] as HardwareKind[]
          ).map((kind) => (
            <SelectRow
              key={kind}
              label={kind}
              value={eng.hardware[kind] ?? ""}
              onChange={(v) => patch({ hardware: { ...eng.hardware, [kind]: v } })}
              options={[
                { value: "", label: "— nenhum —" },
                ...listHardware(kind).map((h) => ({
                  value: h.id,
                  label: `${h.brand} · ${h.label}`,
                })),
              ]}
            />
          ))}
          {HARDWARE_ITEMS.length === 0 ? null : null}
        </Section>

        <Section icon={PackageOpen} title="Peças geradas">
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <MetricPill label="Peças" value={String(decomposition.totals.partCount)} />
            <MetricPill label="Área m²" value={decomposition.totals.boardAreaM2.toFixed(2)} />
            <MetricPill label="Fita m" value={decomposition.totals.edgeMeters.toFixed(2)} />
          </div>
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2 text-[11px] leading-tight">
            {decomposition.parts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-0.5">
                <span className="truncate">
                  <span className="text-muted-foreground">{p.qty}×</span> {p.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {p.widthMm}×{p.heightMm}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Ruler;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function NumberRow({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="capitalize text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right text-xs tabular-nums"
        />
        {suffix ? <span className="text-[10px] text-muted-foreground">{suffix}</span> : null}
      </span>
    </label>
  );
}

function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="capitalize text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[65%] flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-center")}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 p-6 text-center">
      <Wrench className="h-8 w-8 text-muted-foreground/70" />
      <div className="text-sm font-medium">{title}</div>
      <div className="max-w-xs text-xs text-muted-foreground">{description}</div>
      <Button size="sm" variant="ghost" className="mt-2" onClick={() => undefined}>
        Abra a Biblioteca (2D)
      </Button>
    </div>
  );
}

function patchNodeParams(
  nodes: Record<string, PlannerParametricNode>,
  furnitureId: string,
  next: Partial<FurnitureEngineeringParams>,
): Record<string, PlannerParametricNode> {
  const node = nodes[furnitureId];
  if (!node) return nodes;
  const nextParams = applyEngineeringOverride(node.params, next);
  return { ...nodes, [furnitureId]: { ...node, params: nextParams } };
}

function patchDim(
  current: Furniture,
  value: number,
  key: "width" | "depth" | "height" | "rotation",
  updateProject: ReturnType<typeof usePlannerEditor>["updateProject"],
  environmentId: string,
  roomId: string,
) {
  const id = current.id;
  updateProject((project) => ({
    ...project,
    environments: project.environments.map((env) =>
      env.id !== environmentId
        ? env
        : {
            ...env,
            rooms: env.rooms.map((r) => {
              if (r.id !== roomId) return r;
              const n = r.nodes[id];
              if (!n) return r;
              return {
                ...r,
                updatedAt: new Date().toISOString(),
                nodes: { ...r.nodes, [id]: { ...n, params: { ...n.params, [key]: value } } },
              };
            }),
          },
    ),
  }));
}