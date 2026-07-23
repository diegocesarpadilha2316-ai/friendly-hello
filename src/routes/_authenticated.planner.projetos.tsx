import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FolderKanban, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PageContainer,
  PageHeader,
  Button,
  EmptyState,
  StatusBadge,
  SearchInput,
  FormSection,
} from "@/core/components/ui-kit";
import { useTenant } from "@/core/providers/TenantProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import {
  loadProjects,
  upsertProject,
  createProject,
} from "@/modules/planner/shared";

export const Route = createFileRoute("/_authenticated/planner/projetos")({
  component: PlannerProjectsPage,
});

function PlannerProjectsPage() {
  const { activeCompany } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const tenantId = activeCompany?.id ?? "anonymous";
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [client, setClient] = useState("");

  const projects = useMemo(() => loadProjects(tenantId), [tenantId, tick]);
  const filtered = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  const create = () => {
    if (!name.trim()) return;
    const project = createProject({
      tenantId,
      ownerId: user?.id ?? "anonymous",
      name: name.trim(),
      client: client.trim() || undefined,
    });
    upsertProject(tenantId, project);
    setName("");
    setClient("");
    setTick((t) => t + 1);
    navigate({ to: "/planner/projetos/$projectId", params: { projectId: project.id } });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Projetos"
        description="Gerencie os projetos paramétricos do tenant ativo."
        actions={<SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar projeto…" />}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,320px]">
        <div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-6 w-6" />}
              title={projects.length === 0 ? "Nenhum projeto ainda" : "Nenhum projeto encontrado"}
              description={
                projects.length === 0
                  ? "Crie o primeiro projeto usando o painel ao lado."
                  : "Ajuste sua busca para localizar projetos existentes."
              }
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {filtered.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/planner/projetos/$projectId"
                    params={{ projectId: p.id }}
                    className="group block rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold group-hover:text-primary">{p.name}</p>
                        {p.client ? <p className="text-xs text-muted-foreground">{p.client}</p> : null}
                      </div>
                      <StatusBadge tone={p.status === "approved" ? "success" : p.status === "draft" ? "neutral" : "info"}>
                        {p.status}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      v{p.version} · {p.environments.length} ambiente(s) · atualizado {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="rounded-xl border border-border/60 bg-card p-4">
          <FormSection title="Novo projeto" description="Cria um projeto vazio no tenant ativo.">
            <div className="grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Nome</span>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Residência Almeida"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Cliente (opcional)</span>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </label>
              <Button onClick={create} disabled={!name.trim()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar projeto
              </Button>
            </div>
          </FormSection>
        </aside>
      </div>
    </PageContainer>
  );
}