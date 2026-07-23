import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PlusCircle, Save, Home } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  Button,
  StatusBadge,
  EmptyState,
  FormSection,
} from "@/core/components/ui-kit";
import { useTenant } from "@/core/providers/TenantProvider";
import {
  usePlannerEditor,
  createEnvironment,
  createRoom,
  EditorCanvas,
  VersionHistoryPanel,
} from "@/modules/planner/shared";

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

  useEffect(() => {
    loadProjectById(projectId);
  }, [tenantId, projectId, loadProjectById]);

  const project = state.project;
  const selectedEnv = useMemo(
    () => project?.environments.find((e) => e.id === state.selectedEnvironmentId),
    [project, state.selectedEnvironmentId],
  );

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
        description={project.client ?? "Editor paramétrico com autosave, undo/redo e histórico."}
        actions={
          <div className="flex items-center gap-2">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px,1fr,320px]">
        <aside className="space-y-4">
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
        </aside>

        <div className="space-y-4">
          <EditorCanvas mode="2d" />
          <EditorCanvas mode="3d" />
        </div>

        <aside className="space-y-4">
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
        </aside>
      </div>
    </PageContainer>
  );
}