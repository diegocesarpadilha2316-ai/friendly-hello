import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Home,
  ChevronDown,
  Undo2,
  Redo2,
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
  Save,
  Share2,
  Download,
  Upload,
  BookOpen,
  Scroll,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Loader2,
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
import { toast } from "sonner";

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
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [drawersOpen, setDrawersOpen] = useState(false);
  const [ledsOn, setLedsOn] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [sectionCut, setSectionCut] = useState(false);
  const [wallsHidden, setWallsHidden] = useState(false);
  const [snapOn, setSnapOn] = useState(true);
  const [gridOn, setGridOn] = useState(true);
  const [zoom] = useState(100);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveNow();
      toast.success("Projeto salvo");
    } catch (e) {
      toast.error("Erro ao salvar", { description: (e as Error)?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const payload = { title: project?.name ?? "Projeto Dioris", url };
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(payload);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência");
    } catch {
      toast.error("Não foi possível compartilhar");
    }
  };

  const handleExport = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, "_")}.dioris.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    toast.success("Projeto exportado (.dioris.json)");
  };

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
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-card/60 px-4 py-3 backdrop-blur md:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {project.name}
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {state.dirty ? "Salvando…" : "Auto Save"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Cliente: {clientName}</p>
        </div>

        <div className="ml-4 flex items-center gap-1">
          <IconBtn onClick={undo} disabled={!canUndo} icon={Undo2} label="Undo" />
          <IconBtn onClick={redo} disabled={!canRedo} icon={Redo2} label="Redo" />
          <IconBtn onClick={handleSave} disabled={saving} icon={saving ? Loader2 : Save} label="Salvar (Ctrl+S)" />
          <IconBtn onClick={handleShare} icon={Share2} label="Compartilhar" />
          <IconBtn onClick={handleExport} icon={Download} label="Exportar .dioris.json" />
        </div>

        <nav className="ml-auto flex flex-wrap items-center gap-1">
          <Link
            to="/planner/biblioteca"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95"
          >
            <BookOpen className="h-3.5 w-3.5" /> Biblioteca
          </Link>
          <Link
            to="/planner/engenharia"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95"
          >
            <Scroll className="h-3.5 w-3.5" /> Lista de Corte
          </Link>
          <Link
            to="/planner/orcamentos"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95"
          >
            <Calculator className="h-3.5 w-3.5" /> Orçamento
          </Link>
          <Link
            to="/planner/render"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95",
              "border border-primary/40 bg-gradient-to-r from-primary/25 to-accent/25 text-primary-foreground",
              "hover:from-primary/40 hover:to-accent/40 hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)]",
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" /> Render
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("planner:focus-ai"))}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-gradient-to-r from-accent/20 to-primary/20 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:from-accent/40 hover:to-primary/40 hover:shadow-[0_0_24px_-6px_hsl(var(--accent)/0.7)] active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" /> IA
          </button>
        </nav>
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
              <ToolBtn active={sectionCut} onClick={() => setSectionCut((v) => !v)} icon={Scissors} label="Cortar ambiente" />
              <ToolBtn active={wallsHidden} onClick={() => setWallsHidden((v) => !v)} icon={Eye} label="Ocultar paredes" />
              <ToolBtn active={doorsOpen} onClick={() => setDoorsOpen((v) => !v)} icon={DoorOpen} label="Abrir portas" />
              <ToolBtn active={drawersOpen} onClick={() => setDrawersOpen((v) => !v)} icon={Archive} label="Abrir gavetas" />
              <ToolBtn active={ledsOn} onClick={() => setLedsOn((v) => !v)} icon={Lightbulb} label="Ligar LEDs" />
              <ToolBtn active={wireframe} onClick={() => setWireframe((v) => !v)} icon={Ruler} label="Wireframe" />
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
                camera: walkMode ? "first-person" : "orbit",
                showLights: ledsOn,
                openDoors: doorsOpen,
                openDrawers: drawersOpen,
                render: wireframe ? "wireframe" : viewportMode === "realista" ? "material" : "solid",
                sectionHeight: sectionCut ? 1200 : null,
                wallOpacity: wallsHidden ? 0.12 : 1,
                cinematic: viewportMode === "realista",
              }}
            />
          </div>

          {/* Barra inferior */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 bg-background/80 px-5 py-2 text-xs text-slate-300 backdrop-blur">
            <button
              type="button"
              onClick={() => setSnapOn((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 transition-all active:scale-95",
                snapOn ? "text-foreground" : "text-slate-400 hover:text-foreground",
              )}
              title="Snap magnético"
            >
              <span className={cn("inline-block h-2 w-2 rounded-sm", snapOn ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]" : "bg-slate-500")} />
              Snap
            </button>
            <button
              type="button"
              onClick={() => setGridOn((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 transition-all active:scale-95",
                gridOn ? "text-foreground" : "text-slate-400 hover:text-foreground",
              )}
              title="Grade do viewport"
            >
              <span className={cn("inline-block h-2 w-2 rounded-sm", gridOn ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]" : "bg-slate-500")} />
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

            <span className="ml-auto flex items-center gap-1.5 text-emerald-300">
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
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md border border-border/60 bg-background/60 text-slate-300 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        !disabled && "hover:border-primary/50 hover:bg-primary/10 hover:text-white active:scale-90",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", label.startsWith("Salvando") || (Icon === Loader2 && "animate-spin"))} />
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
      aria-label={label}
      aria-pressed={!!active}
      className={cn(
        "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95",
        active
          ? "bg-gradient-to-b from-primary/30 to-accent/25 text-white ring-1 ring-primary/60 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.7)]"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
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