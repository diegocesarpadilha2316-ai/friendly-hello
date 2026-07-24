import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PlusCircle, Save, Home, Layers, Boxes } from "lucide-react";
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
  } = usePlannerEditor();

  const [envName, setEnvName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [viewportMode, setViewportMode] = useState<"2d" | "3d">("3d");
  const [rightTab, setRightTab] = useState<"ia" | "detalhes">("ia");

  useEffect(() => {
    loadProjectById(projectId);
  }, [tenantId, projectId, loadProjectById]);

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

      <div className="mt-8 grid gap-4 lg:grid-cols-[260px,1fr,380px]">
        {/* Painel esquerdo — estrutura do projeto */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3 w-3" /> Estrutura do projeto
            </div>
          <FormSection title="Ambientes" description="Organize o projeto por ambiente.">
            <div className="space-y-2">
              {project.environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => select({ environmentId: env.id, roomId: env.rooms[0]?.id ?? null })}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    env.id === state.selectedEnvironmentId
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/60 hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{env.name}</div>
                  <div className="text-xs text-muted-foreground">{env.rooms.length} cômodo(s)</div>
                </button>
              ))}
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  placeholder="Novo ambiente"
                  value={envName}
                  onChange={(e) => setEnvName(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!envName.trim()) return;
                    const env = createEnvironment({ name: envName.trim() });
                    updateProject((p) => ({ ...p, environments: [...p.environments, env] }));
                    select({ environmentId: env.id, roomId: null });
                    setEnvName("");
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </FormSection>

          {selectedEnv && (
            <FormSection title="Cômodos" description={`Cômodos de ${selectedEnv.name}.`}>
              <div className="space-y-2">
                {selectedEnv.rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => select({ roomId: room.id })}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      room.id === state.selectedRoomId
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/60 hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{room.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {room.dimensions.width}×{room.dimensions.depth}×{room.dimensions.height} mm
                    </div>
                  </button>
                ))}
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="Novo cômodo"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!roomName.trim()) return;
                      const room = createRoom({ name: roomName.trim() });
                      updateProject((p) => ({
                        ...p,
                        environments: p.environments.map((e) =>
                          e.id === selectedEnv.id ? { ...e, rooms: [...e.rooms, room] } : e,
                        ),
                      }));
                      select({ roomId: room.id });
                      setRoomName("");
                    }}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </FormSection>
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
            <EditorCanvas mode={viewportMode} />
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