/**
 * Inspector — Módulo 04 (Reconstrução completa).
 *
 * Editor profissional de móveis planejados. Todas as mutações passam
 * por `updateProject()` do PlannerEditorProvider — herda Undo/Redo,
 * Autosave, Histórico, Banco (Supabase), 2D, 3D e Lista de Corte.
 *
 * Abas: Geral · Dimensões · Materiais · Portas · Gavetas · Prateleiras
 *      · LED · Avançado.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Ruler,
  PackageOpen,
  Wrench,
  Palette,
  Layers as LayersIcon,
  Crosshair,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Info,
  Settings,
  Lightbulb,
  Plus,
  Minus,
  DoorClosed,
  Archive,
  Rows3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/core/providers/TenantProvider";
import { usePlannerEditor } from "../state/editor-context";
import { listPrimitives } from "../editor-2d/serialization";
import type { Editor2DPrimitive } from "../editor-2d/types";
import type { PlannerParametricNode } from "../types/project";
import { getPlannerEventBus, bridgeToWindow } from "../events";
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
import { LibraryMaterialPicker } from "./LibraryMaterialPicker";

type Furniture = Extract<Editor2DPrimitive, { kind: "furniture" }>;
type ParamValue = string | number | boolean | null;
type ParamMap = Readonly<Record<string, ParamValue>>;

const TAB_DEFS = [
  { id: "geral", label: "Geral", icon: Info },
  { id: "dimensoes", label: "Dimensões", icon: Ruler },
  { id: "materiais", label: "Materiais", icon: Palette },
  { id: "portas", label: "Portas", icon: DoorClosed },
  { id: "gavetas", label: "Gavetas", icon: Archive },
  { id: "prateleiras", label: "Prateleiras", icon: Rows3 },
  { id: "led", label: "LED", icon: Lightbulb },
  { id: "avancado", label: "Avançado", icon: Settings },
] as const;
type TabId = (typeof TAB_DEFS)[number]["id"];

// Paleta rápida — acabamentos comuns por família. Usada no seletor de
// cor rápida (Materiais → Cores). Persiste em `params.__color` (hex),
// que a extrusão 3D lê como override sobre o material selecionado.
const COLOR_PALETTE = [
  { group: "Sólidos", swatches: [
    { hex: "#F4F4F4", name: "Branco TX" },
    { hex: "#E7E4DD", name: "Off White" },
    { hex: "#141414", name: "Preto TX" },
    { hex: "#3A3D42", name: "Grafite" },
    { hex: "#B2B4B8", name: "Cinza Cristal" },
    { hex: "#5C6B73", name: "Chumbo" },
  ] },
  { group: "Madeiras", swatches: [
    { hex: "#C9A87A", name: "Carvalho Naturale" },
    { hex: "#8B5E3C", name: "Freijó" },
    { hex: "#6B4A2B", name: "Nogueira" },
    { hex: "#9E7B4F", name: "Itapuã" },
    { hex: "#A3835B", name: "Bali" },
    { hex: "#4A2E1A", name: "Ébano" },
  ] },
  { group: "Lacas & Metálicos", swatches: [
    { hex: "#B24E3A", name: "Terracota" },
    { hex: "#0B3D5C", name: "Azul Petróleo" },
    { hex: "#2F4A3A", name: "Verde Musgo" },
    { hex: "#C9B37E", name: "Champagne" },
    { hex: "#D4AF37", name: "Dourado" },
    { hex: "#A9A9A9", name: "Inox Escovado" },
  ] },
] as const;

/* ------------------------------------------------------------------
 *  Hooks utilitários — leitura da seleção corrente
 * ---------------------------------------------------------------- */
function useFurnitureList(): {
  list: readonly Furniture[];
  environmentId: string | null;
  environmentLabel: string | null;
  roomId: string | null;
  roomLabel: string | null;
} {
  const { state } = usePlannerEditor();
  return useMemo(() => {
    const env = state.project?.environments.find((e) => e.id === state.selectedEnvironmentId) ?? null;
    const room = env?.rooms.find((r) => r.id === state.selectedRoomId) ?? null;
    const list = room
      ? (listPrimitives(room).filter((p) => p.kind === "furniture") as Furniture[])
      : [];
    return {
      list,
      environmentId: env?.id ?? null,
      environmentLabel: env?.name ?? null,
      roomId: room?.id ?? null,
      roomLabel: room?.name ?? null,
    };
  }, [state.project, state.selectedEnvironmentId, state.selectedRoomId]);
}

/* ------------------------------------------------------------------
 *  Inspector principal
 * ---------------------------------------------------------------- */
export function Inspector({ initialFurnitureId }: { initialFurnitureId?: string | null } = {}) {
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const rules = useMemo(() => loadRules(tenantId), [tenantId]);
  const { list, environmentId, environmentLabel, roomId, roomLabel } = useFurnitureList();
  const { state, updateProject, selectNode } = usePlannerEditor();
  const [tab, setTab] = useState<TabId>("geral");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFurnitureId ?? state.selectedNodeId ?? list[list.length - 1]?.id ?? null,
  );
  useEffect(() => {
    const externalId = initialFurnitureId ?? state.selectedNodeId;
    if (externalId && list.some((f) => f.id === externalId)) {
      setSelectedId(externalId);
      return;
    }
    if (selectedId && list.some((f) => f.id === selectedId)) return;
    setSelectedId(list[list.length - 1]?.id ?? null);
  }, [initialFurnitureId, list, selectedId, state.selectedNodeId]);
  const current = list.find((f) => f.id === selectedId) ?? list[list.length - 1] ?? null;

  if (!environmentId || !roomId) {
    return <Empty title="Selecione um cômodo" description="Escolha um cômodo no projeto para editar seus móveis." />;
  }
  if (!current) {
    return (
      <Empty
        title="Nenhum móvel neste cômodo"
        description="Arraste peças da Biblioteca para o editor 2D e depois use este inspector."
      />
    );
  }

  const rawParams = (state.project?.environments
    .find((e) => e.id === environmentId)
    ?.rooms.find((r) => r.id === roomId)
    ?.nodes[current.id]?.params ?? {}) as ParamMap;

  const eng = resolveEngineering(current, rules);
  const decomposition = decomposeFurniture(current, rules);
  const brand = findBrand(eng.brandId);
  const finishes = brand?.finishes ?? [];
  const thicknesses = brand?.thicknesses.map((t) => t.mm) ?? [15, 18, 25];

  const isHidden = rawParams["__hidden"] === true;
  const isLocked = rawParams["locked"] === true || rawParams["__locked"] === true;
  const currentColor = typeof rawParams["__color"] === "string" ? (rawParams["__color"] as string) : "";
  const zOffsetMm = num(rawParams["mount:y"], 0);
  const tiltDeg = num(rawParams["p:tilt"], 0);
  const notes = typeof rawParams["p:notes"] === "string" ? (rawParams["p:notes"] as string) : "";

  /* ---------------- mutators ---------------- */
  const mutateFurniture = (fn: (n: PlannerParametricNode) => PlannerParametricNode) => {
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
                const node = r.nodes[id];
                if (!node) return r;
                return {
                  ...r,
                  updatedAt: new Date().toISOString(),
                  nodes: { ...r.nodes, [id]: fn(node) },
                };
              }),
            },
      ),
    }));
  };

  const patchEng = (next: Partial<FurnitureEngineeringParams>) => {
    mutateFurniture((n) => ({ ...n, params: applyEngineeringOverride(n.params, next) }));
  };
  const patchParams = (next: Record<string, ParamValue>) => {
    mutateFurniture((n) => ({ ...n, params: { ...n.params, ...next } }));
  };
  const patchDim = (
    key: "width" | "depth" | "height" | "rotation" | "x" | "y",
    value: number,
  ) => patchParams({ [key]: value });

  const applyLibraryMaterial = (materialId: string | null) => {
    patchParams({ materialId: materialId ?? null });
  };

  const setVisible = (visible: boolean) => patchParams({ __hidden: !visible });
  const setLocked = (locked: boolean) => patchParams({ locked, __locked: locked });
  const setColor = (hex: string | null) => patchParams({ __color: hex });

  const duplicateFurniture = () => {
    const src = current;
    updateProject((project) => ({
      ...project,
      environments: project.environments.map((env) =>
        env.id !== environmentId
          ? env
          : {
              ...env,
              rooms: env.rooms.map((r) => {
                if (r.id !== roomId) return r;
                const original = r.nodes[src.id];
                if (!original) return r;
                const newId = `${src.id}-copy-${Math.random().toString(36).slice(2, 8)}`;
                const params = { ...original.params };
                params.x = num(params.x, 0) + 300;
                return {
                  ...r,
                  updatedAt: new Date().toISOString(),
                  nodes: { ...r.nodes, [newId]: { ...original, id: newId, params } },
                  nodeOrder: [...r.nodeOrder, newId],
                };
              }),
            },
      ),
    }));
  };

  const deleteFurniture = () => {
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
                if (!r.nodes[id]) return r;
                const { [id]: _drop, ...rest } = r.nodes;
                return {
                  ...r,
                  updatedAt: new Date().toISOString(),
                  nodes: rest,
                  nodeOrder: r.nodeOrder.filter((x) => x !== id),
                };
              }),
            },
      ),
    }));
    selectNode(null);
  };

  const centerInRoom = () => {
    const room = state.project?.environments
      .find((e) => e.id === environmentId)
      ?.rooms.find((r) => r.id === roomId);
    if (!room) return;
    const cx = Math.max(0, (room.dimensions.width - current.width) / 2);
    const cy = Math.max(0, (room.dimensions.depth - current.depth) / 2);
    patchParams({ x: Math.round(cx), y: Math.round(cy) });
  };

  const focusInViewport = () => {
    selectNode(current.id);
    const bus = getPlannerEventBus();
    bus.emit("ui:focus-selection", { primitiveId: current.id });
    bridgeToWindow("ui:focus-selection", { primitiveId: current.id });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/70 backdrop-blur">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-2 border-b border-border/60 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wrench className="h-3.5 w-3.5" />
          <span>Inspector</span>
          <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-primary">{rules.label}</span>
        </div>
        <select
          value={current.id}
          onChange={(e) => {
            setSelectedId(e.target.value);
            selectNode(e.target.value);
          }}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {list.map((f) => (
            <option key={f.id} value={f.id}>
              {pieceLabel(f)} · {f.width}×{f.depth}×{f.height} mm
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
          <span><strong className="text-foreground/80">Categoria:</strong> {current.subtype}</span>
          {environmentLabel ? <span><strong className="text-foreground/80">Ambiente:</strong> {environmentLabel}</span> : null}
          {roomLabel ? <span><strong className="text-foreground/80">Cômodo:</strong> {roomLabel}</span> : null}
        </div>

        {/* Barra de ações rápidas */}
        <div className="flex flex-wrap items-center gap-1">
          <IconAction title={isHidden ? "Mostrar móvel" : "Ocultar móvel"} onClick={() => setVisible(isHidden)} active={isHidden}>
            {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </IconAction>
          <IconAction title={isLocked ? "Desbloquear edição" : "Bloquear edição"} onClick={() => setLocked(!isLocked)} active={isLocked}>
            {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </IconAction>
          <IconAction title="Duplicar (Ctrl+D)" onClick={duplicateFurniture}><Copy className="h-3.5 w-3.5" /></IconAction>
          <IconAction title="Centralizar no cômodo" onClick={centerInRoom}><Crosshair className="h-3.5 w-3.5" /></IconAction>
          <IconAction title="Focar no viewport (F)" onClick={focusInViewport}><Crosshair className="h-3.5 w-3.5" /></IconAction>
          <span className="ml-auto" />
          <IconAction title="Excluir móvel" onClick={deleteFurniture} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconAction>
        </div>

        {/* Abas */}
        <div className="-mx-1 flex flex-wrap gap-0.5 border-t border-border/40 pt-2">
          {TAB_DEFS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  tab === t.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" /> {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className={cn("flex-1 space-y-4 overflow-y-auto px-3 py-3", isLocked && "pointer-events-none opacity-70")}>
        {tab === "geral" && (
          <>
            <Section icon={Info} title="Identificação">
              <TextRow
                label="Nome"
                value={typeof rawParams["p:label"] === "string" ? (rawParams["p:label"] as string) : ""}
                placeholder={pieceLabel(current)}
                onChange={(v) => patchParams({ "p:label": v })}
              />
              <ReadRow label="ID" value={current.id.slice(-8)} />
              <ReadRow label="Subtipo" value={current.subtype} />
              <ReadRow label="Catálogo" value={current.catalogItemId || "—"} />
            </Section>
            <Section icon={PackageOpen} title="Peças geradas">
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <MetricPill label="Peças" value={String(decomposition.totals.partCount)} />
                <MetricPill label="Área m²" value={decomposition.totals.boardAreaM2.toFixed(2)} />
                <MetricPill label="Fita m" value={decomposition.totals.edgeMeters.toFixed(2)} />
              </div>
            </Section>
            <Section icon={Info} title="Observações">
              <textarea
                value={notes}
                onChange={(e) => patchParams({ "p:notes": e.target.value })}
                placeholder="Anotações internas para produção / cliente…"
                rows={4}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              />
            </Section>
          </>
        )}

        {tab === "dimensoes" && (
          <>
            <Section icon={Ruler} title="Dimensões (mm)">
              <NumberRow label="Largura" value={current.width} min={100} max={6000} step={10} onChange={(v) => patchDim("width", v)} />
              <NumberRow label="Profundidade" value={current.depth} min={100} max={2000} step={10} onChange={(v) => patchDim("depth", v)} />
              <NumberRow label="Altura" value={current.height} min={100} max={3500} step={10} onChange={(v) => patchDim("height", v)} />
            </Section>
            <Section icon={Ruler} title="Posição (mm)">
              <NumberRow label="X (plano)" value={current.x} step={10} onChange={(v) => patchDim("x", v)} />
              <NumberRow label="Y (plano)" value={current.y} step={10} onChange={(v) => patchDim("y", v)} />
              <NumberRow
                label="Z (elevação)"
                value={zOffsetMm}
                min={0}
                max={3500}
                step={10}
                suffix="mm"
                onChange={(v) => patchParams({ "mount:y": v })}
              />
              <NumberRow
                label="Rotação"
                value={current.rotation}
                step={15}
                suffix="°"
                onChange={(v) => patchDim("rotation", normalizeRotation(v))}
              />
              <NumberRow
                label="Inclinação"
                value={tiltDeg}
                min={-45}
                max={45}
                step={1}
                suffix="°"
                onChange={(v) => patchParams({ "p:tilt": v })}
              />
              <ToggleRow
                label="Espelhar peça"
                checked={eng.mirrored}
                onChange={(c) => patchEng({ mirrored: c })}
              />
            </Section>
          </>
        )}

        {tab === "materiais" && (
          <>
            <Section icon={LayersIcon} title="Biblioteca Dioris">
              <LibraryMaterialPicker materialId={current.materialId} onApply={applyLibraryMaterial} />
            </Section>
            <Section icon={Palette} title="Cores & Acabamentos">
              <div className="space-y-2">
                {COLOR_PALETTE.map((grp) => (
                  <div key={grp.group}>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{grp.group}</div>
                    <div className="flex flex-wrap gap-1">
                      {grp.swatches.map((s) => (
                        <button
                          key={s.hex}
                          type="button"
                          onClick={() => setColor(s.hex)}
                          title={s.name}
                          className={cn(
                            "h-7 w-7 rounded-md border border-border/60 transition-all hover:scale-110",
                            currentColor.toLowerCase() === s.hex.toLowerCase() &&
                              "ring-2 ring-primary ring-offset-1 ring-offset-background",
                          )}
                          style={{ background: s.hex }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground">Personalizada</span>
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(currentColor) ? currentColor : "#ffffff"}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded-md border border-border/60 bg-background"
                  />
                  {currentColor ? (
                    <button
                      type="button"
                      onClick={() => setColor(null)}
                      className="rounded-md border border-border/60 bg-background px-2 py-1 text-[10px] hover:bg-muted"
                    >
                      Limpar
                    </button>
                  ) : null}
                </div>
              </div>
            </Section>
            <Section icon={LayersIcon} title="Chapa">
              <SelectRow
                label="Marca"
                value={eng.brandId}
                onChange={(v) => patchEng({ brandId: v })}
                options={MATERIAL_BRANDS.map((b) => ({ value: b.id, label: `${b.label} (${b.category})` }))}
              />
              <SelectRow
                label="Acabamento"
                value={eng.finishId}
                onChange={(v) => patchEng({ finishId: v })}
                options={finishes.map((f) => ({ value: f.id, label: f.label }))}
              />
              <SelectRow
                label="Espessura corpo"
                value={String(eng.thicknessMm)}
                onChange={(v) => patchEng({ thicknessMm: Number(v) })}
                options={thicknesses.map((mm) => ({ value: String(mm), label: `${mm} mm` }))}
              />
              <SelectRow
                label="Espessura fundo"
                value={String(eng.backThicknessMm)}
                onChange={(v) => patchEng({ backThicknessMm: Number(v) })}
                options={[3, 6, 9, 15, 18].map((mm) => ({ value: String(mm), label: `${mm} mm` }))}
              />
              <SelectRow
                label="Fita de borda"
                value={eng.edge}
                onChange={(v) => patchEng({ edge: v as FurnitureEngineeringParams["edge"] })}
                options={EDGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <SelectRow
                label="Sentido do veio"
                value={eng.grain}
                onChange={(v) => patchEng({ grain: v as FurnitureEngineeringParams["grain"] })}
                options={GRAIN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </Section>
          </>
        )}

        {tab === "portas" && (
          <Section icon={DoorClosed} title="Portas">
            <StepperRow
              label="Quantidade"
              value={eng.doors}
              min={0}
              max={12}
              onChange={(v) => patchEng({ doors: v })}
            />
            <SelectRow
              label="Modelo"
              value={eng.door}
              onChange={(v) => patchEng({ door: v as FurnitureEngineeringParams["door"] })}
              options={DOOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <SelectRow
              label="Sentido de abertura"
              value={typeof rawParams["p:openSide"] === "string" ? (rawParams["p:openSide"] as string) : "right"}
              onChange={(v) => patchParams({ "p:openSide": v })}
              options={[
                { value: "left", label: "Esquerda" },
                { value: "right", label: "Direita" },
                { value: "up", label: "Basculante (cima)" },
                { value: "down", label: "Basculante (baixo)" },
              ]}
            />
            <SelectRow
              label="Dobradiça"
              value={eng.hardware.dobradica ?? ""}
              onChange={(v) => patchEng({ hardware: { ...eng.hardware, dobradica: v } })}
              options={[{ value: "", label: "— padrão —" }, ...listHardware("dobradica").map((h) => ({ value: h.id, label: `${h.brand} · ${h.label}` }))]}
            />
            <SelectRow
              label="Puxador"
              value={eng.handle}
              onChange={(v) => patchEng({ handle: v as FurnitureEngineeringParams["handle"] })}
              options={HANDLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <SelectRow
              label="Modelo do puxador"
              value={eng.hardware.puxador ?? ""}
              onChange={(v) => patchEng({ hardware: { ...eng.hardware, puxador: v } })}
              options={[{ value: "", label: "— nenhum —" }, ...listHardware("puxador").map((h) => ({ value: h.id, label: `${h.brand} · ${h.label}` }))]}
            />
            <SelectRow
              label="Perfil"
              value={eng.hardware.perfil ?? ""}
              onChange={(v) => patchEng({ hardware: { ...eng.hardware, perfil: v } })}
              options={[{ value: "", label: "— nenhum —" }, ...listHardware("perfil").map((h) => ({ value: h.id, label: `${h.brand} · ${h.label}` }))]}
            />
            <SelectRow
              label="Vidro / recheio"
              value={typeof rawParams["glass:tint"] === "string" ? (rawParams["glass:tint"] as string) : ""}
              onChange={(v) => patchParams({ "glass:tint": v || null })}
              options={[
                { value: "", label: "— sem vidro —" },
                { value: "clear", label: "Cristal" },
                { value: "bronze", label: "Bronze" },
                { value: "fume", label: "Fumê" },
                { value: "reeded", label: "Canelado" },
                { value: "mirror", label: "Espelho" },
              ]}
            />
            <ToggleRow
              label="Portas abertas (preview)"
              checked={rawParams["mod:openDoors"] === true || rawParams["openDoors"] === true}
              onChange={(c) => patchParams({ "mod:openDoors": c })}
            />
          </Section>
        )}

        {tab === "gavetas" && (
          <Section icon={Archive} title="Gavetas">
            <StepperRow label="Quantidade" value={eng.drawers} min={0} max={12} onChange={(v) => patchEng({ drawers: v })} />
            <SelectRow
              label="Tipo"
              value={eng.drawer}
              onChange={(v) => patchEng({ drawer: v as FurnitureEngineeringParams["drawer"] })}
              options={DRAWER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <NumberRow
              label="Altura frontal"
              value={num(rawParams["p:drawerHeight"], 180)}
              min={80}
              max={400}
              step={10}
              suffix="mm"
              onChange={(v) => patchParams({ "p:drawerHeight": v })}
            />
            <NumberRow
              label="Profundidade útil"
              value={num(rawParams["p:drawerDepth"], Math.max(300, current.depth - 60))}
              min={200}
              max={current.depth}
              step={10}
              suffix="mm"
              onChange={(v) => patchParams({ "p:drawerDepth": v })}
            />
            <StepperRow
              label="Divisórias"
              value={num(rawParams["p:drawerDividers"], 0)}
              min={0}
              max={6}
              onChange={(v) => patchParams({ "p:drawerDividers": v })}
            />
            <SelectRow
              label="Corrediça"
              value={eng.hardware.corredica ?? ""}
              onChange={(v) => patchEng({ hardware: { ...eng.hardware, corredica: v } })}
              options={[{ value: "", label: "— padrão —" }, ...listHardware("corredica").map((h) => ({ value: h.id, label: `${h.brand} · ${h.label}` }))]}
            />
            <SelectRow
              label="Amortecimento"
              value={eng.hardware.amortecedor ?? ""}
              onChange={(v) => patchEng({ hardware: { ...eng.hardware, amortecedor: v } })}
              options={[{ value: "", label: "— sem —" }, ...listHardware("amortecedor").map((h) => ({ value: h.id, label: `${h.brand} · ${h.label}` }))]}
            />
            <SelectRow
              label="Abertura"
              value={typeof rawParams["p:drawerOpen"] === "string" ? (rawParams["p:drawerOpen"] as string) : "handle"}
              onChange={(v) => patchParams({ "p:drawerOpen": v })}
              options={[
                { value: "handle", label: "Puxador" },
                { value: "tipon", label: "Tip-On (toque)" },
                { value: "servo", label: "Servo Drive" },
              ]}
            />
            <ToggleRow
              label="Gavetas abertas (preview)"
              checked={rawParams["mod:openDrawers"] === true || rawParams["openDrawers"] === true}
              onChange={(c) => patchParams({ "mod:openDrawers": c })}
            />
          </Section>
        )}

        {tab === "prateleiras" && (
          <Section icon={Rows3} title="Prateleiras">
            <div className="flex items-center gap-1">
              <StepperRow
                label="Quantidade"
                value={eng.shelves}
                min={0}
                max={20}
                onChange={(v) => patchEng({ shelves: v })}
              />
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              <button
                type="button"
                onClick={() => patchEng({ shelves: eng.shelves + 1 })}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted"
              >
                <Plus className="h-3 w-3" /> Adicionar
              </button>
              <button
                type="button"
                onClick={() => patchEng({ shelves: Math.max(0, eng.shelves - 1) })}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted"
              >
                <Minus className="h-3 w-3" /> Remover
              </button>
              <button
                type="button"
                onClick={() => patchEng({ shelves: eng.shelves * 2 })}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted"
              >
                <Copy className="h-3 w-3" /> Duplicar
              </button>
            </div>
            <NumberRow
              label="Espessura"
              value={num(rawParams["p:shelfThickness"], eng.thicknessMm)}
              min={9}
              max={40}
              step={1}
              suffix="mm"
              onChange={(v) => patchParams({ "p:shelfThickness": v })}
            />
            <NumberRow
              label="Profundidade"
              value={num(rawParams["p:shelfDepth"], Math.max(150, current.depth - 20))}
              min={100}
              max={current.depth}
              step={10}
              suffix="mm"
              onChange={(v) => patchParams({ "p:shelfDepth": v })}
            />
            <NumberRow
              label="Recuo frontal"
              value={num(rawParams["p:shelfInset"], 0)}
              min={0}
              max={100}
              step={1}
              suffix="mm"
              onChange={(v) => patchParams({ "p:shelfInset": v })}
            />
            <SelectRow
              label="Suporte"
              value={typeof rawParams["p:shelfSupport"] === "string" ? (rawParams["p:shelfSupport"] as string) : "pin"}
              onChange={(v) => patchParams({ "p:shelfSupport": v })}
              options={[
                { value: "pin", label: "Pino removível" },
                { value: "trilho", label: "Trilho fixo" },
                { value: "cabo", label: "Cabo de aço" },
                { value: "vidro", label: "Suporte vidro" },
              ]}
            />
          </Section>
        )}

        {tab === "led" && (
          <Section icon={Lightbulb} title="Iluminação LED">
            <ToggleRow
              label="Ativar LED"
              checked={rawParams["mod:led"] === true || rawParams["led"] === true}
              onChange={(c) => patchParams({ "mod:led": c })}
            />
            <SelectRow
              label="Tipo de fita"
              value={typeof rawParams["led:type"] === "string" ? (rawParams["led:type"] as string) : "strip"}
              onChange={(v) => patchParams({ "led:type": v })}
              options={[
                { value: "strip", label: "Fita 5050" },
                { value: "cob", label: "Fita COB (contínua)" },
                { value: "puck", label: "Spot puck" },
                { value: "rail", label: "Trilho perfil" },
              ]}
            />
            <SelectRow
              label="Posição"
              value={typeof rawParams["led:position"] === "string" ? (rawParams["led:position"] as string) : "top"}
              onChange={(v) => patchParams({ "led:position": v })}
              options={[
                { value: "top", label: "Topo" },
                { value: "bottom", label: "Rodapé" },
                { value: "front", label: "Frente (embutido)" },
                { value: "back", label: "Fundo (indireto)" },
                { value: "shelves", label: "Cada prateleira" },
              ]}
            />
            <NumberRow
              label="Temperatura"
              value={num(rawParams["led:kelvin"], 3000)}
              min={2000}
              max={6500}
              step={100}
              suffix="K"
              onChange={(v) => patchParams({ "led:kelvin": v })}
            />
            <NumberRow
              label="Intensidade"
              value={num(rawParams["led:intensity"], 80)}
              min={0}
              max={100}
              step={5}
              suffix="%"
              onChange={(v) => patchParams({ "led:intensity": v })}
            />
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Cor</span>
              <input
                type="color"
                value={typeof rawParams["led:color"] === "string" ? (rawParams["led:color"] as string) : "#fff2cc"}
                onChange={(e) => patchParams({ "led:color": e.target.value })}
                className="h-7 w-14 cursor-pointer rounded-md border border-border/60 bg-background"
              />
            </label>
          </Section>
        )}

        {tab === "avancado" && (
          <>
            <Section icon={PackageOpen} title="Fabricação">
              <SelectRow
                label="Fundo"
                value={eng.back}
                onChange={(v) => patchEng({ back: v as FurnitureEngineeringParams["back"] })}
                options={BACK_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <SelectRow
                label="Base"
                value={eng.base}
                onChange={(v) => patchEng({ base: v as FurnitureEngineeringParams["base"] })}
                options={BASE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <SelectRow
                label="Montagem"
                value={eng.assembly}
                onChange={(v) => patchEng({ assembly: v as FurnitureEngineeringParams["assembly"] })}
                options={ASSEMBLY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <NumberRow label="Folga" value={eng.clearanceMm} min={0} max={50} onChange={(v) => patchEng({ clearanceMm: v })} suffix="mm" />
              <NumberRow label="Reveal" value={eng.reveal} min={0} max={50} onChange={(v) => patchEng({ reveal: v })} suffix="mm" />
            </Section>
            <Section icon={Palette} title="Ferragens (todas)">
              {(
                ["dobradica", "corredica", "pistao", "trilho", "cabideiro", "perfil", "puxador", "amortecedor"] as HardwareKind[]
              ).map((kind) => (
                <SelectRow
                  key={kind}
                  label={kind}
                  value={eng.hardware[kind] ?? ""}
                  onChange={(v) => patchEng({ hardware: { ...eng.hardware, [kind]: v } })}
                  options={[
                    { value: "", label: "— nenhum —" },
                    ...listHardware(kind).map((h) => ({ value: h.id, label: `${h.brand} · ${h.label}` })),
                  ]}
                />
              ))}
              {HARDWARE_ITEMS.length === 0 ? null : null}
            </Section>
            <Section icon={PackageOpen} title="Lista de corte">
              <ul className="max-h-52 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2 text-[11px] leading-tight">
                {decomposition.parts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="min-w-0 flex-1 break-words">
                      <span className="text-muted-foreground">{p.qty}×</span> {p.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.widthMm}×{p.heightMm}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 *  Sub-componentes reutilizáveis
 * ---------------------------------------------------------------- */
function Section({ icon: Icon, title, children }: { icon: typeof Ruler; title: string; children: React.ReactNode }) {
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
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [draft, setDraft] = useState<string>(() => (Number.isFinite(value) ? String(value) : "0"));
  useEffect(() => {
    setDraft(Number.isFinite(value) ? String(value) : "0");
  }, [value]);
  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    let v = parsed;
    if (typeof min === "number") v = Math.max(min, v);
    if (typeof max === "number") v = Math.min(max, v);
    if (v !== value) onChange(v);
    setDraft(String(v));
  };
  const bump = (delta: number) => {
    let v = (Number(draft) || 0) + delta;
    if (typeof min === "number") v = Math.max(min, v);
    if (typeof max === "number") v = Math.min(max, v);
    setDraft(String(v));
    if (v !== value) onChange(v);
  };
  const s = step ?? 1;
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="capitalize text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => bump(-s)}
          className="rounded-md border border-border/60 bg-background px-1.5 py-1 text-[10px] hover:bg-muted"
          aria-label="Diminuir"
        >
          −
        </button>
        <input
          type="number"
          value={draft}
          min={min}
          max={max}
          step={s}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setDraft(String(value));
              e.currentTarget.blur();
            }
          }}
          className="w-20 rounded-md border border-border bg-background px-2 py-1 text-right text-xs tabular-nums"
        />
        <button
          type="button"
          onClick={() => bump(s)}
          className="rounded-md border border-border/60 bg-background px-1.5 py-1 text-[10px] hover:bg-muted"
          aria-label="Aumentar"
        >
          +
        </button>
        {suffix ? <span className="text-[10px] text-muted-foreground">{suffix}</span> : null}
      </span>
    </label>
  );
}

function StepperRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <NumberRow
      label={label}
      value={Math.max(min, Math.min(max, Math.round(value)))}
      min={min}
      max={max}
      step={1}
      onChange={(v) => onChange(Math.max(min, Math.min(max, Math.round(v))))}
    />
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

function TextRow({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="capitalize text-muted-foreground">{label}</span>
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== value && onChange(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value);
            e.currentTarget.blur();
          }
        }}
        className="max-w-[65%] flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
      />
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="capitalize text-muted-foreground">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="capitalize text-muted-foreground">{label}</span>
      <span className="max-w-[65%] truncate text-right text-foreground/90">{value}</span>
    </div>
  );
}

function IconAction({
  title,
  onClick,
  children,
  active,
  danger,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
        danger
          ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
          : active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
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
    </div>
  );
}

function pieceLabel(f: Furniture): string {
  const p = f.params ?? {};
  const label = typeof p.label === "string" ? p.label : "";
  if (label) return label;
  const brand = typeof p.brand === "string" ? p.brand : "";
  const line = typeof p.line === "string" ? p.line : "";
  const suffix = [brand, line].filter(Boolean).join(" ");
  return suffix ? `${f.subtype} · ${suffix}` : String(f.subtype);
}

function normalizeRotation(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const n = ((v % 360) + 360) % 360;
  return n;
}

function num(v: ParamValue | undefined, def: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v !== "" && Number.isFinite(Number(v))) return Number(v);
  return def;
}
