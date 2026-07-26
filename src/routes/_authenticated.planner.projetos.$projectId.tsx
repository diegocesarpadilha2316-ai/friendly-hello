import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Home,
  Save,
  Share2,
  Box,
  Layers as LayersIcon,
  Scissors,
  Calculator,
  Camera,
  Move,
  Hand,
  ZoomIn,
  Ruler,
  MousePointer2,
  Undo2,
  Redo2,
  Maximize2,
  Grid3x3,
  Sun,
  PlusCircle,
} from "lucide-react";
import { Button, EmptyState } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useTenant } from "@/core/providers/TenantProvider";
import {
  usePlannerEditor,
  createEnvironment,
  createRoom,
  EditorCanvas,
} from "@/modules/planner/shared";
import { ProjectTree } from "@/modules/planner/shared/components/ProjectTree";
import { PlannerAIPanel } from "@/modules/planner/domains/ia";

export const Route = createFileRoute("/_authenticated/planner/projetos/$projectId")({
  component: PlannerProjectDetail,
});

function PlannerProjectDetail() {
  const { projectId } = useParams({ from: "/_authenticated/planner/projetos/$projectId" });
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const {
    state,
    loadProjectById,
    updateProject,
    select,
    saveNow,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePlannerEditor();

  const [envName, setEnvName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [viewportMode, setViewportMode] = useState<"2d" | "3d">("3d");
  const [tool, setTool] = useState<"orbit" | "pan" | "zoom" | "measure" | "select">("orbit");
  const [view, setView] = useState<"perspectiva" | "topo" | "frontal" | "lateral">("perspectiva");
  const [gridOn, setGridOn] = useState(true);
  const [lightOn, setLightOn] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);

  useEffect(() => {
    if (!activeCompany?.id) return;
    loadProjectById(projectId);
  }, [activeCompany?.id, projectId, loadProjectById]);

  useEffect(() => {
    const onFocus = () => setAiOpen(true);
    window.addEventListener("planner:focus-ai", onFocus);
    return () => window.removeEventListener("planner:focus-ai", onFocus);
  }, []);

  const project = state.project;
  const selectedEnv = useMemo(
    () => project?.environments.find((e) => e.id === state.selectedEnvironmentId),
    [project, state.selectedEnvironmentId],
  );
  const selectedRoom = useMemo(
    () => selectedEnv?.rooms.find((r) => r.id === state.selectedRoomId) ?? null,
    [selectedEnv, state.selectedRoomId],
  );
  const hasContext = Boolean(project && state.selectedEnvironmentId && state.selectedRoomId);

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Home className="h-6 w-6" />}
          title="Projeto não encontrado"
          description="Este projeto pode ter sido removido ou pertence a outro tenant."
          action={
            <Link to="/planner/projetos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Handlers de adição rápida (Enter no input)
  const handleAddEnv = () => {
    if (!envName.trim()) return;
    const env = createEnvironment({ name: envName.trim() });
    updateProject((p) => ({ ...p, environments: [...p.environments, env] }));
    select({ environmentId: env.id, roomId: null });
    setEnvName("");
  };
  const handleAddRoom = () => {
    if (!selectedEnv || !roomName.trim()) return;
    const room = createRoom({ name: roomName.trim() });
    updateProject((p) => ({
      ...p,
      environments: p.environments.map((en) =>
        en.id === selectedEnv.id ? { ...en, rooms: [...en.rooms, room] } : en,
      ),
    }));
    select({ roomId: room.id });
    setRoomName("");
  };

  const tabs: Array<{
    id: "editor3d" | "planta2d" | "corte" | "orcamento" | "render";
    label: string;
    icon: typeof Box;
    to?: string;
  }> = [
    { id: "editor3d", label: "Editor 3D", icon: Box },
    { id: "planta2d", label: "Planta 2D", icon: LayersIcon },
    { id: "corte", label: "Lista de Corte", icon: Scissors, to: "/planner/engenharia" },
    { id: "orcamento", label: "Orçamento", icon: Calculator, to: "/planner/orcamentos" },
    { id: "render", label: "Render", icon: Camera, to: "/planner/render" },
  ];
  const activeTab: "editor3d" | "planta2d" = viewportMode === "3d" ? "editor3d" : "planta2d";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-0 bg-background">
      {/* Topbar do projeto */}
      <header className="flex items-center gap-4 border-b border-border/60 bg-background/60 px-4 py-3 backdrop-blur">
        <nav aria-label="Trilha" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/planner" className="hover:text-foreground">Planner</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/planner/projetos" className="hover:text-foreground">Projetos</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{project.name}</span>
        </nav>

        {/* Tabs centrais */}
        <div className="mx-auto flex items-center gap-1 rounded-lg border border-border/50 bg-card/60 p-1">
          {tabs.map((t) => {
            const isActive =
              (t.id === "editor3d" || t.id === "planta2d") && activeTab === t.id;
            const Icon = t.icon;
            const inner = (
              <button
                type="button"
                onClick={() => {
                  if (t.id === "editor3d") setViewportMode("3d");
                  else if (t.id === "planta2d") setViewportMode("2d");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary shadow-inner ring-1 ring-primary/30"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
            return t.to ? (
              <Link key={t.id} to={t.to}>
                {inner}
              </Link>
            ) : (
              <span key={t.id}>{inner}</span>
            );
          })}
        </div>

        {/* Ações da direita */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={saveNow}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              state.dirty
                ? "border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border/60 bg-card text-foreground hover:bg-muted",
            )}
          >
            <Save className="h-3.5 w-3.5" /> Salvar
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </button>
        </div>
      </header>

      {/* Corpo — 3 colunas (viewport sempre centralizado) */}
      <div className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-[240px,1fr,300px] xl:grid-cols-[300px,1fr,380px]">
        {/* Coluna 1 — Estrutura do Projeto */}
        <aside className="order-2 flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card md:order-none md:min-h-0">
          <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Estrutura do Projeto
            </h2>
            <ChevronRight className="h-3.5 w-3.5 -rotate-90 text-muted-foreground" />
          </div>

          <div className="border-b border-border/60 px-3 py-2 text-xs text-foreground/90">
            {project.name}
          </div>

          <div className="min-h-0 flex-1">
            <ProjectTree />
          </div>

          {/* Quick-add */}
          <div className="space-y-2 border-t border-border/60 bg-background/40 p-2">
            {selectedEnv ? (
              <div className="flex gap-1.5">
                <input
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  placeholder={`+ Adicionar cômodo em ${selectedEnv.name}`}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRoom()}
                />
                <Button size="sm" variant="outline" onClick={handleAddRoom}>
                  <PlusCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  placeholder="+ Adicionar ambiente"
                  value={envName}
                  onChange={(e) => setEnvName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEnv()}
                />
                <Button size="sm" variant="outline" onClick={handleAddEnv}>
                  <PlusCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Coluna 2 — Viewport */}
        <section className="order-1 relative flex min-h-[580px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card md:order-none md:min-h-0">
          {/* Toolbar flutuante superior */}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border/60 bg-background/85 p-1.5 shadow-lg backdrop-blur-md">
              <ToolBtn active={tool === "orbit"} onClick={() => setTool("orbit")} icon={Box} label="Orbit" />
              <ToolBtn active={tool === "pan"} onClick={() => setTool("pan")} icon={Hand} label="Pan" />
              <ToolBtn active={tool === "zoom"} onClick={() => setTool("zoom")} icon={ZoomIn} label="Zoom" />
              <ToolBtn active={tool === "measure"} onClick={() => setTool("measure")} icon={Ruler} label="Measure" />
              <ToolBtn active={tool === "select"} onClick={() => setTool("select")} icon={MousePointer2} label="Select" />
              <span className="mx-1 h-6 w-px bg-border/60" />
              <ToolBtn disabled={!canUndo} onClick={undo} icon={Undo2} label="Undo" />
              <ToolBtn disabled={!canRedo} onClick={redo} icon={Redo2} label="Redo" />
            </div>
          </div>

          {/* Canvas */}
          <div className="relative min-h-[520px] flex-1 bg-[#0a1020]">
            <EditorCanvas
              mode={viewportMode}
              controls={{ showGrid: gridOn, view, showLights: lightOn }}
            />

            {/* Mini mapa 2D */}
            <div className="pointer-events-auto absolute bottom-4 left-4 h-32 w-44 overflow-hidden rounded-lg border border-border/60 bg-background/90 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between border-b border-border/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>Planta 2D</span>
                <button
                  type="button"
                  onClick={() => setViewportMode(viewportMode === "2d" ? "3d" : "2d")}
                  className="rounded p-0.5 hover:text-foreground"
                  title="Expandir"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <div className="pointer-events-none relative h-[calc(100%-1.5rem)] w-full opacity-80">
                <EditorCanvas mode="2d" />
              </div>
            </div>

            {!hasContext && (
              <div className="pointer-events-none absolute inset-x-0 bottom-20 mx-auto max-w-md rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 text-center text-xs text-warning-foreground shadow-lg">
                Selecione um ambiente e um cômodo à esquerda para habilitar edição.
              </div>
            )}
          </div>

          {/* Barra inferior */}
          <div className="flex items-center gap-4 border-t border-border/60 bg-background/60 px-4 py-2 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <span>Vista:</span>
              <select
                value={view}
                onChange={(e) => setView(e.target.value as typeof view)}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
              >
                <option value="perspectiva">Perspectiva</option>
                <option value="topo">Topo</option>
                <option value="frontal">Frontal</option>
                <option value="lateral">Lateral</option>
              </select>
            </label>

            <ToggleChip on={gridOn} onClick={() => setGridOn((v) => !v)} icon={Grid3x3} label="Grade" />
            <ToggleChip on={lightOn} onClick={() => setLightOn((v) => !v)} icon={Sun} label="Iluminação" />

            <div className="ml-auto flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">Preview · 720p</span>
            </div>
          </div>
        </section>

        {/* Coluna 3 — IA Copiloto */}
        {aiOpen ? (
          <aside className="order-3 flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card md:order-none md:min-h-0">
            <div className="min-h-0 flex-1">
              <PlannerAIPanel className="h-full w-full" onClose={() => setAiOpen(false)} />
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card p-3 text-xs text-muted-foreground hover:bg-muted"
          >
            IA
          </button>
        )}
      </div>
    </div>
  );
}

function ToolBtn({
  active,
  disabled,
  onClick,
  icon: Icon,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  icon: typeof Move;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary ring-1 ring-primary/30"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function ToggleChip({
  on,
  onClick,
  icon: Icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  icon: typeof Move;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1 transition-colors",
        on
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span
        className={cn(
          "relative h-3 w-6 rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-2 w-2 rounded-full bg-background transition-all",
            on ? "left-3.5" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}