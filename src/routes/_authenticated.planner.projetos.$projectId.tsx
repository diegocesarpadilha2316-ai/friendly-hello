import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Home,
  ChevronDown,
  Search,
  Undo2,
  Redo2,
  Play,
  Sparkles,
  Ruler,
  DoorOpen,
  Archive,
  Lightbulb,
  Layers as LayersIcon,
  Scissors,
  Eye,
  Footprints,
  Box,
  Image as ImageIcon,
  History,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Button, EmptyState } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useTenant } from "@/core/providers/TenantProvider";
import {
  usePlannerEditor,
  EditorCanvas,
  Inspector,
} from "@/modules/planner/shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/planner/projetos/$projectId")({
  component: PlannerProjectDetail,
});

function PlannerProjectDetail() {
  const { projectId } = useParams({ from: "/_authenticated/planner/projetos/$projectId" });
  const { activeCompany } = useTenant();
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

  const [viewportMode, setViewportMode] = useState<"2d" | "3d" | "realista">("3d");
  const [walkMode, setWalkMode] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [drawersOpen, setDrawersOpen] = useState(false);
  const [ledsOn, setLedsOn] = useState(true);
  const [measuring, setMeasuring] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [snapOn, setSnapOn] = useState(true);
  const [gridOn, setGridOn] = useState(true);
  const [zoom, setZoom] = useState(85);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!activeCompany?.id) return;
    loadProjectById(projectId);
  }, [activeCompany?.id, projectId, loadProjectById]);

  const project = state.project;
  const selectedEnv = useMemo(
    () => project?.environments.find((e) => e.id === state.selectedEnvironmentId),
    [project, state.selectedEnvironmentId],
  );
  const selectedRoom = useMemo(
    () => selectedEnv?.rooms.find((r) => r.id === state.selectedRoomId) ?? null,
    [selectedEnv, state.selectedRoomId],
  );
  const totalLayers = useMemo(() => {
    if (!project) return 0;
    return project.environments.reduce((acc, e) => acc + e.rooms.length, 0);
  }, [project]);
  const clientName = (project?.client as { name?: string } | undefined)?.name ?? "Sem cliente";

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

  const modeLabel = viewportMode === "realista" ? "3D Realista" : viewportMode === "3d" ? "Ambiente 3D" : "Planta 2D";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background">
      {/* ===== Header cinematográfico ===== */}
      <header className="flex items-center gap-3 border-b border-border/60 bg-card/40 px-5 py-3 backdrop-blur">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {project.name}
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Auto Save
              <ChevronDown className="h-3 w-3 opacity-70" />
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Cliente: {clientName}</p>
        </div>

        <div className="ml-4 flex items-center gap-1">
          <IconBtn onClick={undo} disabled={!canUndo} icon={Undo2} label="Undo" />
          <IconBtn onClick={redo} disabled={!canRedo} icon={Redo2} label="Redo" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground md:flex md:w-56">
            <Search className="h-3.5 w-3.5" />
            <input
              placeholder="Search"
              className="w-full border-none bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="button"
            onClick={() => setViewportMode("realista")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              viewportMode === "realista"
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]"
                : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" /> Render
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Play className="h-3.5 w-3.5" /> Vídeo
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("planner:focus-ai"))}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5" /> IA
          </button>
          <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 text-xs font-bold text-primary-foreground">
            D
          </div>
        </div>
      </header>

      {/* ===== Corpo: viewport + inspector ===== */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 xl:grid-cols-[1fr,340px]">
        {/* Viewport */}
        <section className="relative flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-[#0a0f1c] shadow-[inset_0_1px_0_hsl(var(--border)/0.4)]">
          {/* Toolbar flutuante superior */}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
            <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-background/75 p-1.5 shadow-xl backdrop-blur-md">
              <ToolBtn
                active={viewportMode === "2d"}
                onClick={() => setViewportMode("2d")}
                icon={LayersIcon}
                label="Planta 2D"
              />
              <ToolBtn
                active={viewportMode === "3d"}
                onClick={() => setViewportMode("3d")}
                icon={Box}
                label="Ambiente 3D"
              />
              <ToolBtn
                active={viewportMode === "realista"}
                onClick={() => setViewportMode("realista")}
                icon={ImageIcon}
                label="Render Realista"
              />
              <span className="mx-1 h-8 w-px bg-border/60" />
              <ToolBtn active={walkMode} onClick={() => setWalkMode((v) => !v)} icon={Footprints} label="Caminhar" />
              <ToolBtn active={exploded} onClick={() => setExploded((v) => !v)} icon={Box} label="Explodir" />
              <ToolBtn active={false} onClick={() => {}} icon={Scissors} label="Cortar ambiente" />
              <ToolBtn active={doorsOpen} onClick={() => setDoorsOpen((v) => !v)} icon={DoorOpen} label="Abrir portas" />
              <ToolBtn active={drawersOpen} onClick={() => setDrawersOpen((v) => !v)} icon={Archive} label="Abrir gavetas" />
              <ToolBtn active={ledsOn} onClick={() => setLedsOn((v) => !v)} icon={Lightbulb} label="Ligar LEDs" />
              <ToolBtn active={measuring} onClick={() => setMeasuring((v) => !v)} icon={Ruler} label="Medir" />
              <ToolBtn active={showStructure} onClick={() => setShowStructure((v) => !v)} icon={Eye} label="Mostrar estrutura" />
              <span className="mx-1 h-8 w-px bg-border/60" />
              <ToolBtn
                active={detailsOpen}
                onClick={() => setDetailsOpen(true)}
                icon={ClipboardList}
                label="Detalhes do móvel"
              />
            </div>
          </div>

          {/* Canvas */}
          <div className="relative min-h-[520px] flex-1">
            <EditorCanvas
              mode={viewportMode === "2d" ? "2d" : "3d"}
              controls={{
                showGrid: gridOn,
                view: "perspectiva",
                showLights: ledsOn,
                openDoors: doorsOpen,
                openDrawers: drawersOpen,
              }}
            />
          </div>

          {/* Barra inferior */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 bg-background/70 px-5 py-2 text-xs text-muted-foreground backdrop-blur">
            <button
              type="button"
              onClick={() => setSnapOn((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
                snapOn ? "text-foreground" : "hover:text-foreground",
              )}
            >
              <span className={cn("inline-block h-2 w-2 rounded-sm", snapOn ? "bg-primary" : "bg-muted-foreground/40")} />
              Snap
            </button>
            <button
              type="button"
              onClick={() => setGridOn((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
                gridOn ? "text-foreground" : "hover:text-foreground",
              )}
            >
              <span className={cn("inline-block h-2 w-2 rounded-sm", gridOn ? "bg-primary" : "bg-muted-foreground/40")} />
              Grade
            </button>

            <span>
              Camadas: <span className="text-foreground">{totalLayers}</span>
            </span>
            <span>
              Zoom: <span className="text-foreground">{zoom}%</span>
            </span>
            <span>
              FPS: <span className="text-foreground">60</span>
            </span>
            <span>
              Escala: <span className="text-foreground">1:50</span>
            </span>

            <button className="ml-auto flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <History className="h-3.5 w-3.5" /> Histórico
            </button>
            <span className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Auto Save
            </span>
            <span>
              Modo: <span className="text-foreground">{modeLabel}</span>
            </span>
          </div>
        </section>

        {/* Inspector */}
        <aside className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Inspector
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <InspectorPanel
              selection={selectedRoom?.name ?? selectedEnv?.name ?? project.name}
              onRename={(v) => {
                if (selectedRoom && selectedEnv) {
                  updateProject((p) => ({
                    ...p,
                    environments: p.environments.map((en) =>
                      en.id === selectedEnv.id
                        ? {
                            ...en,
                            rooms: en.rooms.map((r) =>
                              r.id === selectedRoom.id ? { ...r, name: v } : r,
                            ),
                          }
                        : en,
                    ),
                  }));
                }
              }}
            />
          </div>
          <div className="border-t border-border/60 bg-background/40 px-4 py-2 text-[11px] text-muted-foreground">
            {state.dirty ? (
              <button onClick={saveNow} className="text-primary hover:underline">Salvar alterações</button>
            ) : (
              <span>Tudo salvo</span>
            )}
          </div>
        </aside>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-md overflow-hidden border-l border-border/60 bg-background/95 p-0 backdrop-blur sm:max-w-lg"
        >
          <SheetHeader className="border-b border-border/60 px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Detalhes do móvel
            </SheetTitle>
            <SheetDescription className="text-xs">
              Engenharia completa da peça selecionada — dimensões, chapa, ferragens,
              acabamento e lista de corte automática.
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-96px)] overflow-hidden px-3 py-3">
            <Inspector />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function IconBtn({
  onClick,
  disabled,
  icon: Icon,
  label,
}: {
  onClick?: () => void;
  disabled?: boolean;
  icon: typeof Undo2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md border border-border/60 bg-background/40 text-muted-foreground transition-colors",
        !disabled && "hover:bg-muted hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ToolBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active?: boolean;
  onClick?: () => void;
  icon: typeof Undo2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium transition-all",
        active
          ? "bg-primary/20 text-primary ring-1 ring-primary/40 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.6)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function InspectorPanel({
  selection,
  onRename,
}: {
  selection: string;
  onRename: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Nome">
        <input
          defaultValue={selection}
          onBlur={(e) => onRename(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
        />
      </Field>
      <Field label="Categoria">
        <Pick options={["Armário", "Balcão", "Torre", "Nicho", "Painel", "Ferragem", "Iluminação"]} />
      </Field>

      <Separator label="Dimensões" />
      <Field label="Largura"><Numeric value="600" suffix="mm" /></Field>
      <Field label="Altura"><Numeric value="800" suffix="mm" /></Field>
      <Field label="Profundidade"><Numeric value="350" suffix="mm" /></Field>

      <Separator label="Acabamento" />
      <Field label="Material"><Pick options={["MDF", "MDP", "Compensado", "Maciço"]} /></Field>
      <Field label="Cor"><Pill value="Freijó Natural" /></Field>
      <Field label="Acabamento"><Pick options={["Fosco", "Semi-brilho", "Alto-brilho"]} /></Field>
      <Field label="Marca MDF"><Pick options={["Duratex", "Arauco", "Eucatex", "Berneck"]} /></Field>
      <Field label="Espessura"><Pick options={["6mm", "9mm", "15mm", "18mm", "25mm"]} /></Field>

      <Separator label="Componentes" />
      <Field label="Ferragens"><Pick options={["Blum", "Hettich", "FGV", "Grass"]} /></Field>
      <Field label="Puxadores"><Pick options={["Embutido", "Perfil", "Cava", "Cotovelo"]} /></Field>
      <Field label="Portas"><Numeric value="2" /></Field>
      <Field label="Gavetas"><Numeric value="0" /></Field>
      <Field label="Iluminação"><Pill value="LED embutido" /></Field>

      <Separator label="Montagem" />
      <Field label="Fundo"><Pick options={["MDF 6mm", "MDF 3mm", "Sem fundo"]} /></Field>
      <Field label="Montagem"><Pick options={["Cavilhado", "Confirmat", "Minifix"]} /></Field>
      <Field label="Sentido do veio"><Pick options={["Vertical", "Horizontal"]} /></Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[110px,1fr] items-center gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{children}</div>
    </label>
  );
}
function Separator({ label }: { label: string }) {
  return (
    <div className="pt-2">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
        {label}
      </p>
      <div className="h-px w-full bg-border/50" />
    </div>
  );
}
function Pick({ options }: { options: string[] }) {
  return (
    <select className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/60">
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
function Numeric({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs">
      <input defaultValue={value} className="w-full border-none bg-transparent text-foreground outline-none" />
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </div>
  );
}
function Pill({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary">
      {value}
    </div>
  );
}