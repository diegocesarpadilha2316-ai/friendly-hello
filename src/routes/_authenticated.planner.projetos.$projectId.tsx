import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  PlusCircle,
  Save,
  Home,
  Boxes,
  Undo2,
  Redo2,
  Sparkles,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  Button,
  StatusBadge,
  EmptyState,
  FormSection,
} from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useTenant } from "@/core/providers/TenantProvider";
import {
  usePlannerEditor,
  createEnvironment,
  createRoom,
  EditorCanvas,
  VersionHistoryPanel,
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
    snapshotVersion,
    saveNow,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePlannerEditor();

  const [envName, setEnvName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [viewportMode, setViewportMode] = useState<"2d" | "3d">("3d");
  const [rightTab, setRightTab] = useState<"ia" | "detalhes">("ia");

  useEffect(() => {
    loadProjectById(projectId);
  }, [tenantId, projectId, loadProjectById]);

  // Ctrl/Cmd+Space → foca IA Copiloto (dispatch pelo editor-context).
  useEffect(() => {
    const onFocus = () => setRightTab("ia");
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
      <PageContainer>
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
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner / Projeto"
        title={project.name}
        description={
          project.briefing?.style
            ? `${project.client ?? "Sem cliente"} · Estilo ${project.briefing.style}${project.briefing?.environmentType ? ` · ${project.briefing.environmentType}` : ""}`
            : project.client ?? "Editor paramétrico com autosave, undo/redo e histórico."
        }
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={hasContext ? "success" : "warning"}>
              {hasContext ? "cômodo ativo" : "selecione um cômodo"}
            </StatusBadge>
            <StatusBadge tone={state.dirty ? "warning" : "success"}>
              {state.dirty ? "alterações pendentes" : "sincronizado"}
            </StatusBadge>
            <Button size="sm" variant="outline" onClick={saveNow}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
            <Link to="/planner/projetos">
              <Button size="sm" variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[280px,1fr,380px]">
        {/* Painel esquerdo — Árvore hierárquica estilo Blender */}
        <aside className="flex min-h-[640px] flex-col rounded-xl border border-border/60 bg-card">
          <div className="min-h-0 flex-1">
            <ProjectTree />
          </div>
          {/* Rodapé — adicionar ambiente / cômodo */}
          <div className="space-y-2 border-t border-border/60 bg-background/40 p-2">
            <div className="flex gap-1.5">
              <input
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                placeholder="+ Ambiente"
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && envName.trim()) {
                    const env = createEnvironment({ name: envName.trim() });
                    updateProject((p) => ({ ...p, environments: [...p.environments, env] }));
                    select({ environmentId: env.id, roomId: null });
                    setEnvName("");
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!envName.trim()) return;
                  const env = createEnvironment({ name: envName.trim() });
                  updateProject((p) => ({ ...p, environments: [...p.environments, env] }));
                  select({ environmentId: env.id, roomId: null });
                  setEnvName("");
                }}
              >
                <PlusCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
            {selectedEnv && (
              <div className="flex gap-1.5">
                <input
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  placeholder={`+ Cômodo em ${selectedEnv.name}`}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && roomName.trim()) {
                      const room = createRoom({ name: roomName.trim() });
                      updateProject((p) => ({
                        ...p,
                        environments: p.environments.map((en) =>
                          en.id === selectedEnv.id
                            ? { ...en, rooms: [...en.rooms, room] }
                            : en,
                        ),
                      }));
                      select({ roomId: room.id });
                      setRoomName("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!roomName.trim()) return;
                    const room = createRoom({ name: roomName.trim() });
                    updateProject((p) => ({
                      ...p,
                      environments: p.environments.map((en) =>
                        en.id === selectedEnv.id
                          ? { ...en, rooms: [...en.rooms, room] }
                          : en,
                      ),
                    }));
                    select({ roomId: room.id });
                    setRoomName("");
                  }}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Viewport central — 2D ↔ 3D toggle */}
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Boxes className="h-3 w-3" /> Viewport {selectedRoom ? `· ${selectedRoom.name}` : ""}
            </div>
            <div className="inline-flex rounded-md border border-border/60 bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewportMode("2d")}
                className={cn(
                  "rounded px-3 py-1 transition-colors",
                  viewportMode === "2d"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                2D
              </button>
              <button
                type="button"
                onClick={() => setViewportMode("3d")}
                className={cn(
                  "rounded px-3 py-1 transition-colors",
                  viewportMode === "3d"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                3D
              </button>
            </div>
          </div>
          <div className="min-h-[560px] flex-1">
            <div className="relative h-full w-full">
              <EditorCanvas mode={viewportMode} />
              {/* Botões flutuantes sobre o viewport */}
              <div className="pointer-events-none absolute inset-x-0 top-2 flex items-start justify-between px-2">
                <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 p-1 shadow-md backdrop-blur">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Desfazer (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Refazer (Ctrl+Shift+Z)"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                  <div className="mx-1 h-4 w-px bg-border/60" />
                  <Button size="sm" variant="ghost" onClick={saveNow} title="Salvar (Ctrl+S)">
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                <div className="pointer-events-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRightTab("ia");
                      window.dispatchEvent(new CustomEvent("planner:focus-ai"));
                    }}
                    title="IA Copiloto (Ctrl+Space)"
                    className="gap-1.5 border-primary/40 bg-background/80 shadow-md backdrop-blur"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs">IA</span>
                    <kbd className="ml-1 rounded border border-border/60 bg-muted px-1 py-px text-[10px] text-muted-foreground">
                      Ctrl+Space
                    </kbd>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {!hasContext && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              Selecione um ambiente e um cômodo à esquerda para habilitar edição, render e orçamento.
            </div>
          )}
        </div>

        {/* Painel direito — IA Copiloto embarcada + Detalhes */}
        <aside className="flex min-h-[640px] flex-col rounded-xl border border-border/60 bg-card">
          <div className="flex items-center gap-1 border-b border-border/60 p-1.5">
            <button
              type="button"
              onClick={() => setRightTab("ia")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                rightTab === "ia"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              IA Copiloto
            </button>
            <button
              type="button"
              onClick={() => setRightTab("detalhes")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                rightTab === "detalhes"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Detalhes & histórico
            </button>
          </div>
          <div className="min-h-0 flex-1 p-2">
            {rightTab === "ia" ? (
              <PlannerAIPanel className="h-full w-full" />
            ) : (
              <div className="space-y-3 p-1">
                <FormSection title="Detalhes" description="Metadados do projeto.">
                  <label className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Nome</span>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={project.name}
                      onChange={(e) => updateProject((p) => ({ ...p, name: e.target.value }))}
                    />
                  </label>
                  <label className="mt-2 text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Cliente</span>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={project.client ?? ""}
                      onChange={(e) => updateProject((p) => ({ ...p, client: e.target.value }))}
                    />
                  </label>
                </FormSection>

                <FormSection title="Snapshot" description="Preserve um marco do projeto.">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Ex.: Aprovação cliente"
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        snapshotVersion(versionLabel.trim() || `Versão ${project.version}`);
                        setVersionLabel("");
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                </FormSection>

                <VersionHistoryPanel />
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}