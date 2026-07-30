/**
 * Viewport 3D — Fase 3.3.
 *
 * Componente cliente, isolado por `React.lazy` + `<ClientOnly>` no
 * `EditorCanvas`. Lê o mesmo `PlannerRoom` do `PlannerEditorProvider`
 * (Fase 3.1) — nenhum store novo. A cena 3D é montada a partir dos
 * descritores puros gerados em `extrusion.ts`.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Axis3d,
  Boxes,
  Camera,
  Compass,
  Eye,
  EyeOff,
  Grid3x3,
  Layers,
  Move3D,
  Pointer,
  Scissors,
  Sparkles,
  ZapOff,
  ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { usePlannerEditor } from "../state/editor-context";
import { buildScene3D } from "./extrusion";
import { DEFAULT_VIEWPORT_3D, type Camera3DMode, type Camera3DView, type Render3DMode, type Viewport3DState } from "./types";
import { Scene3D } from "./Scene3D";
import type { PlannerProject, PlannerRoom } from "../types/project";
import { RotateCw, Trash2, Copy } from "lucide-react";

const CAM_LABEL: Record<Camera3DMode, string> = {
  orbit: "Orbit",
  "first-person": "1ª Pessoa",
  fly: "Fly",
};

const RENDER_LABEL: Record<Render3DMode, string> = {
  solid: "Solid",
  wireframe: "Wireframe",
  material: "Material",
};

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
        active
          ? "bg-primary/25 text-primary-foreground ring-1 ring-primary/40"
          : "text-foreground/85 hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SceneTree({
  ids,
  selectedId,
  onSelect,
}: {
  ids: readonly { id: string; label: string; kind: string }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 overflow-auto text-xs">
      {ids.length === 0 ? (
        <p className="px-2 py-3 text-muted-foreground">Sem elementos na cena.</p>
      ) : (
        ids.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => onSelect(n.id)}
            className={cn(
              "flex items-center justify-between rounded px-2 py-1 text-left transition-colors",
              selectedId === n.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="min-w-0 flex-1 break-words leading-snug">{n.label}</span>
            <span className="ml-2 shrink-0 rounded bg-background/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
              {n.kind}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

export interface Viewport3DControls {
  showGrid?: boolean;
  camera?: Camera3DMode;
  view?: Camera3DView;
  showLights?: boolean;
  openDoors?: boolean;
  openDrawers?: boolean;
  render?: Render3DMode;
  sectionHeight?: number | null;
  wallOpacity?: number;
  cinematic?: boolean;
}

export function Viewport3D({ controls }: { controls?: Viewport3DControls } = {}) {
  const { state, selectNode, updateProject } = usePlannerEditor();
  const room = state.project?.environments
    .find((e) => e.id === state.selectedEnvironmentId)
    ?.rooms.find((r) => r.id === state.selectedRoomId);

  const [viewport, setViewport] = useState<Viewport3DState>(DEFAULT_VIEWPORT_3D);
  const [gizmoMode, setGizmoMode] = useState<"translate" | "rotate">("translate");
  // Reenquadramento automático: sempre que a IA (ou o próprio usuário)
  // troca de cômodo, ou o cômodo muda de tamanho/número de móveis, o
  // Planner "apresenta" o ambiente inteiro de novo. Sem isso, um projeto
  // recém-criado pela IA nasce com a câmera olhando o vazio.
  const fitKey = useMemo(() => {
    if (!room) return "empty";
    return [
      room.id,
      room.dimensions.width,
      room.dimensions.depth,
      room.dimensions.height,
      room.nodeOrder.length,
    ].join(":");
  }, [
    room?.id,
    room?.dimensions.width,
    room?.dimensions.depth,
    room?.dimensions.height,
    room?.nodeOrder.length,
  ]);
  useEffect(() => {
    setViewport((v) => ({ ...v, autoFitVersion: (v.autoFitVersion ?? 0) + 1 }));
  }, [fitKey]);
  // A seleção agora vive no PlannerEditorProvider — a IA lê o mesmo
  // `selectedNodeId` para operar tools sobre o item que o usuário
  // clicou no viewport ou na árvore da cena.
  const selectedId = state.selectedNodeId;
  const setSelectedId = selectNode;

  // Sincroniza controles externos (barra inferior do editor) com o estado
  // interno do viewport, sem introduzir stores novos.
  useEffect(() => {
    if (!controls) return;
    setViewport((v) => ({
      ...v,
      ...(controls.showGrid != null ? { showGrid: controls.showGrid } : {}),
      ...(controls.camera ? { camera: controls.camera } : {}),
      ...(controls.view ? { view: controls.view } : {}),
      ...(controls.showLights != null ? { showLights: controls.showLights } : {}),
      ...(controls.openDoors != null ? { openDoors: controls.openDoors } : {}),
      ...(controls.openDrawers != null ? { openDrawers: controls.openDrawers } : {}),
      ...(controls.render ? { render: controls.render } : {}),
      ...(controls.sectionHeight !== undefined ? { sectionHeight: controls.sectionHeight } : {}),
      ...(controls.wallOpacity != null ? { wallOpacity: controls.wallOpacity } : {}),
      ...(controls.cinematic != null ? { cinematic: controls.cinematic } : {}),
    }));
  }, [
    controls?.showGrid,
    controls?.camera,
    controls?.view,
    controls?.showLights,
    controls?.openDoors,
    controls?.openDrawers,
    controls?.render,
    controls?.sectionHeight,
    controls?.wallOpacity,
    controls?.cinematic,
  ]);

  const model = useMemo(() => (room ? buildScene3D(room, viewport.wallHeight) : null), [room, viewport.wallHeight]);

  // ---------------------------------------------------------------
  // Mutação do cômodo a partir do 3D — mesmo pipeline do Editor2D.
  // Passa por updateProject(), portanto: Undo/Redo, autosave, árvore
  // e Inspector permanecem 100 % sincronizados com o banco.
  // ---------------------------------------------------------------
  const envId = state.selectedEnvironmentId;
  const roomId = state.selectedRoomId;
  const mutateRoom = (fn: (r: PlannerRoom) => PlannerRoom) => {
    if (!envId || !roomId) return;
    updateProject((p: PlannerProject) => ({
      ...p,
      environments: p.environments.map((env) =>
        env.id !== envId
          ? env
          : {
              ...env,
              rooms: env.rooms.map((r) => (r.id === roomId ? fn(r) : r)),
              updatedAt: new Date().toISOString(),
            },
      ),
    }));
  };

  const commitTransform = (
    id: string,
    patch: { xMm: number; yMm: number; rotationDeg: number },
  ) => {
    mutateRoom((r) => {
      const node = r.nodes[id];
      if (!node || node.kind !== "module") return r;
      const p = node.params as Record<string, string | number | boolean | null>;
      const wMm = Number(p.width) || 0;
      const dMm = Number(p.depth) || 0;
      // Clamp aos limites do cômodo (mantém o móvel dentro das paredes).
      const maxX = Math.max(0, r.dimensions.width - wMm);
      const maxY = Math.max(0, r.dimensions.depth - dMm);
      const xMm = Math.min(Math.max(0, patch.xMm), maxX);
      const yMm = Math.min(Math.max(0, patch.yMm), maxY);
      // Colisão AABB leve (tolera 5 mm de encosto entre móveis).
      const collides = Object.values(r.nodes).some((n) => {
        if (n.id === id || n.kind !== "module") return false;
        const q = n.params as Record<string, string | number | boolean | null>;
        if (q.role !== "furniture") return false;
        const bx1 = Number(q.x) || 0;
        const by1 = Number(q.y) || 0;
        const bw = Number(q.width) || 0;
        const bd = Number(q.depth) || 0;
        return (
          xMm < bx1 + bw - 5 &&
          xMm + wMm > bx1 + 5 &&
          yMm < by1 + bd - 5 &&
          yMm + dMm > by1 + 5
        );
      });
      if (collides) return r; // aborta o commit — a proxy do gizmo será
      // re-sincronizada no próximo render pelo useEffect do FurnitureGizmo.
      const nextParams = { ...node.params, x: xMm, y: yMm, rotation: patch.rotationDeg };
      return {
        ...r,
        nodes: {
          ...r.nodes,
          [id]: { ...node, params: nextParams },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    mutateRoom((r) => {
      if (!r.nodes[selectedId]) return r;
      const { [selectedId]: _, ...rest } = r.nodes;
      return {
        ...r,
        nodes: rest,
        nodeOrder: r.nodeOrder.filter((n) => n !== selectedId),
        updatedAt: new Date().toISOString(),
      };
    });
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    mutateRoom((r) => {
      const src = r.nodes[selectedId];
      if (!src || src.kind !== "module") return r;
      const newId = `${src.id}-copy-${Math.random().toString(36).slice(2, 8)}`;
      const srcParams = src.params as Record<string, string | number | boolean | null>;
      const params = { ...srcParams, x: (Number(srcParams.x) || 0) + 300 };
      return {
        ...r,
        nodes: { ...r.nodes, [newId]: { ...src, id: newId, params } },
        nodeOrder: [...r.nodeOrder, newId],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const sceneNodes = useMemo(() => {
    if (!model) return [] as { id: string; label: string; kind: string }[];
    return [
      ...model.walls.map((w) => ({ id: w.id, label: `Parede ${w.id.slice(-4)}`, kind: "wall" })),
      ...model.floors.map((f) => ({ id: f.id, label: `Piso ${f.id.slice(-4)}`, kind: "floor" })),
      ...model.ceilings.map((c) => ({ id: c.id, label: `Teto ${c.id.slice(-4)}`, kind: "ceiling" })),
      ...model.openings.map((o) => ({
        id: o.id,
        label: `${o.role === "door" ? "Porta" : "Janela"} ${o.id.slice(-4)}`,
        kind: o.role,
      })),
      ...model.furniture.map((f) => ({
        id: f.id,
        label: `${f.subtype} ${f.id.slice(-4)}`,
        kind: f.subtype,
      })),
    ];
  }, [model]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === "INPUT") return;
      switch (e.key.toLowerCase()) {
        case "1": setViewport((v) => ({ ...v, camera: "orbit" })); break;
        case "2": setViewport((v) => ({ ...v, camera: "first-person" })); break;
        case "3": setViewport((v) => ({ ...v, camera: "fly" })); break;
        case "w": setViewport((v) => ({ ...v, render: v.render === "wireframe" ? "solid" : "wireframe" })); break;
        case "m": setViewport((v) => ({ ...v, render: v.render === "material" ? "solid" : "material" })); break;
        case "g": setViewport((v) => ({ ...v, showGrid: !v.showGrid })); break;
        case "t": setGizmoMode("translate"); break;
        case "r":
          if (e.ctrlKey || e.metaKey) return;
          setGizmoMode("rotate");
          break;
        case "delete":
        case "backspace":
          deleteSelected();
          break;
        case "d":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            duplicateSelected();
          }
          break;
        case "escape": setSelectedId(null); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, envId, roomId]);

  if (!room || !model) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-xl border border-border/60 bg-muted/20 text-sm text-muted-foreground">
        Selecione um cômodo para visualizar em 3D.
      </div>
    );
  }

  const selected = selectedId
    ? sceneNodes.find((n) => n.id === selectedId) ?? null
    : null;

  return (
    <div className="grid min-h-[520px] grid-cols-1 gap-2 rounded-xl border border-border/60 bg-background/40 p-2 xl:h-[620px] xl:grid-cols-[220px_1fr_260px]">
      {/* Árvore da cena */}
      <aside className="hidden min-h-0 flex-col rounded-md border border-border/60 bg-background/60 p-2 xl:flex">
        <header className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-foreground">
          <Layers className="h-3.5 w-3.5" /> Árvore da cena
        </header>
        <SceneTree ids={sceneNodes} selectedId={selectedId} onSelect={setSelectedId} />
      </aside>

      {/* Viewport principal */}
      <div className="relative flex min-h-0 flex-col overflow-hidden rounded-md border border-border/60 bg-[#0b0f1a]">
        <div className="absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between gap-2 overflow-x-auto border-b border-border/40 bg-background/70 px-2 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-1">
            {(Object.keys(CAM_LABEL) as Camera3DMode[]).map((m) => (
              <ToolbarButton
                key={m}
                active={viewport.camera === m}
                onClick={() => setViewport((v) => ({ ...v, camera: m }))}
                title={`Câmera ${CAM_LABEL[m]}`}
              >
                <Camera className="h-3.5 w-3.5" /> {CAM_LABEL[m]}
              </ToolbarButton>
            ))}
            <span className="mx-1 h-4 w-px bg-border/60" />
            {(Object.keys(RENDER_LABEL) as Render3DMode[]).map((m) => (
              <ToolbarButton
                key={m}
                active={viewport.render === m}
                onClick={() => setViewport((v) => ({ ...v, render: m }))}
                title={`Modo ${RENDER_LABEL[m]}`}
              >
                {m === "wireframe" ? <ZapOff className="h-3.5 w-3.5" /> : m === "material" ? <Sparkles className="h-3.5 w-3.5" /> : <Boxes className="h-3.5 w-3.5" />}
                {RENDER_LABEL[m]}
              </ToolbarButton>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <ToolbarButton
              active={viewport.showGrid}
              onClick={() => setViewport((v) => ({ ...v, showGrid: !v.showGrid }))}
              title="Grid (G)"
            >
              <Grid3x3 className="h-3.5 w-3.5" /> Grid
            </ToolbarButton>
            <ToolbarButton
              active={viewport.showAxes}
              onClick={() => setViewport((v) => ({ ...v, showAxes: !v.showAxes }))}
              title="Eixos"
            >
              <Axis3d className="h-3.5 w-3.5" /> Eixos
            </ToolbarButton>
            <ToolbarButton
              active={viewport.sectionHeight != null}
              onClick={() =>
                setViewport((v) => ({
                  ...v,
                  sectionHeight: v.sectionHeight == null ? Math.round(v.wallHeight / 2) : null,
                }))
              }
              title="Corte horizontal"
            >
              <Scissors className="h-3.5 w-3.5" /> Corte
            </ToolbarButton>
            <ToolbarButton
              active={viewport.wallHeight < 2500 || viewport.wallOpacity < 0.9}
              onClick={() =>
                setViewport((v) => {
                  // 3 estados: [Cheia 2700 / opaca] → [Rebaixada 900 / opaca]
                  // → [Oculta 2700 / transparente 0.15] → volta a cheia.
                  const full = v.wallHeight >= 2500 && v.wallOpacity >= 0.9;
                  const low = v.wallHeight < 2500 && v.wallOpacity >= 0.9;
                  if (full) return { ...v, wallHeight: 900, wallOpacity: 1 };
                  if (low) return { ...v, wallHeight: 2700, wallOpacity: 0.15 };
                  return { ...v, wallHeight: 2700, wallOpacity: 1 };
                })
              }
              title="Rebaixar / ocultar paredes (cicla: cheia → 900mm → transparente)"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              {viewport.wallHeight < 2500 ? "Rebaixada" : viewport.wallOpacity < 0.9 ? "Oculta" : "Paredes"}
            </ToolbarButton>
            <span className="mx-1 h-4 w-px bg-border/60" />
            <ToolbarButton
              active={!!viewport.cinematic}
              onClick={() =>
                setViewport((v) => ({
                  ...v,
                  cinematic: !v.cinematic,
                  // Preview Fotorrealista exige modo Material
                  render: !v.cinematic ? "material" : v.render,
                }))
              }
              title="Preview Fotorrealista (SSAO + Bloom)"
            >
              <Sparkles className="h-3.5 w-3.5" /> Foto
            </ToolbarButton>
            <span className="mx-1 h-4 w-px bg-border/60" />
            {(["morning", "noon", "golden", "night"] as const).map((d) => (
              <ToolbarButton
                key={d}
                active={(viewport.daytime ?? "noon") === d}
                onClick={() =>
                  setViewport((v) => ({
                    ...v,
                    daytime: d,
                    // Céu/sol só aparecem em modo Material
                    render: v.render === "material" ? v.render : "material",
                  }))
                }
                title={
                  d === "morning"
                    ? "Manhã — sol baixo a leste"
                    : d === "noon"
                    ? "Meio-dia — sol alto"
                    : d === "golden"
                    ? "Golden hour — sol dourado"
                    : "Noite — estrelado"
                }
              >
                {d === "morning" ? "🌅" : d === "noon" ? "☀️" : d === "golden" ? "🌇" : "🌙"}
              </ToolbarButton>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 pt-9">
          <Scene3D
            model={model}
            viewport={viewport}
            selectedId={selectedId}
            onSelect={setSelectedId}
            gizmoMode={gizmoMode}
            onCommitTransform={commitTransform}
          />
        </div>

        {/* Barra de gizmos — flutuante, canto superior direito. */}
        <div className="pointer-events-auto absolute right-2 top-11 z-20 flex items-center gap-1 rounded-md border border-border/50 bg-background/60 p-1 backdrop-blur">
          <ToolbarButton
            active={gizmoMode === "translate"}
            onClick={() => setGizmoMode("translate")}
            title="Mover (T)"
          >
            <Move3D className="h-3.5 w-3.5" /> Mover
          </ToolbarButton>
          <ToolbarButton
            active={gizmoMode === "rotate"}
            onClick={() => setGizmoMode("rotate")}
            title="Girar (R)"
          >
            <RotateCw className="h-3.5 w-3.5" /> Girar
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-border/60" />
          <ToolbarButton
            onClick={duplicateSelected}
            title="Duplicar seleção (Ctrl+D)"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicar
          </ToolbarButton>
          <ToolbarButton
            onClick={deleteSelected}
            title="Excluir seleção (Delete)"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </ToolbarButton>
        </div>

        {/* Status bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border/40 bg-background/50 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
          <span className="inline-flex items-center gap-1">
            <Compass className="h-3 w-3" /> {CAM_LABEL[viewport.camera]} · {RENDER_LABEL[viewport.render]}
          </span>
          <span>
            {model.walls.length} paredes · {model.floors.length + model.ceilings.length} lajes ·{" "}
            {model.openings.length} aberturas · {model.furniture.length} móveis
          </span>
          <span className="inline-flex items-center gap-1">
            <Pointer className="h-3 w-3" /> {selected ? selected.label : "Nenhuma seleção"}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 opacity-70">
            Tecla <kbd className="rounded border border-border/60 bg-background/80 px-1">F</kbd> enquadra a seleção
          </span>
        </div>
      </div>

      {/* Inspector + parâmetros do viewport */}
      <aside className="hidden min-h-0 flex-col gap-2 overflow-auto rounded-md border border-border/60 bg-background/60 p-3 text-xs xl:flex">
        <section>
          <header className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
            <Move3D className="h-3.5 w-3.5" /> Parâmetros do 3D
          </header>
          <label className="mb-2 flex flex-col gap-1">
            <span className="text-muted-foreground">Altura da parede (mm)</span>
            <input
              type="number"
              min={1000}
              max={6000}
              step={50}
              value={viewport.wallHeight}
              onChange={(e) =>
                setViewport((v) => ({ ...v, wallHeight: Number(e.target.value) || v.wallHeight }))
              }
              className="rounded border border-border/60 bg-background px-2 py-1 text-foreground"
            />
          </label>
          <label className="mb-2 flex flex-col gap-1">
            <span className="text-muted-foreground">Opacidade paredes</span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={viewport.wallOpacity}
              onChange={(e) => setViewport((v) => ({ ...v, wallOpacity: Number(e.target.value) }))}
            />
          </label>
          <label className="mb-2 flex flex-col gap-1">
            <span className="text-muted-foreground">Explodir</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={viewport.explode}
              onChange={(e) => setViewport((v) => ({ ...v, explode: Number(e.target.value) }))}
            />
          </label>
          {viewport.sectionHeight != null ? (
            <label className="mb-2 flex flex-col gap-1">
              <span className="text-muted-foreground">Altura do corte (mm)</span>
              <input
                type="range"
                min={100}
                max={viewport.wallHeight}
                step={50}
                value={viewport.sectionHeight}
                onChange={(e) =>
                  setViewport((v) => ({ ...v, sectionHeight: Number(e.target.value) }))
                }
              />
              <span className="text-[10px] text-muted-foreground">{viewport.sectionHeight} mm</span>
            </label>
          ) : null}
        </section>

        <section className="border-t border-border/60 pt-2">
          <header className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
            {selected ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Inspector
          </header>
          {selected ? (
            <div className="flex flex-col gap-1 text-muted-foreground">
              <div className="flex justify-between"><span>ID</span><span className="text-foreground">{selected.id.slice(-8)}</span></div>
              <div className="flex justify-between"><span>Tipo</span><span className="text-foreground">{selected.kind}</span></div>
              <div className="flex justify-between"><span>Rótulo</span><span className="text-foreground">{selected.label}</span></div>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setSelectedId(null)}>
                Limpar seleção
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">Clique num elemento da cena para inspecionar.</p>
          )}
        </section>

        <section className="mt-auto border-t border-border/60 pt-2 text-muted-foreground">
          <p className="text-[11px] leading-relaxed">
            Atalhos: <kbd className="rounded bg-muted px-1">1/2/3</kbd> câmera ·{" "}
            <kbd className="rounded bg-muted px-1">W</kbd> wireframe ·{" "}
            <kbd className="rounded bg-muted px-1">M</kbd> material ·{" "}
            <kbd className="rounded bg-muted px-1">G</kbd> grid ·{" "}
            <kbd className="rounded bg-muted px-1">Esc</kbd> desmarcar.
          </p>
        </section>
      </aside>
    </div>
  );
}

export default Viewport3D;