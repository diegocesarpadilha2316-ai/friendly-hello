import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, PlusCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PageContainer,
  PageHeader,
  Button,
  EmptyState,
  StatusBadge,
  SearchInput,
} from "@/core/components/ui-kit";
import { useTenant } from "@/core/providers/TenantProvider";
import { loadProjects } from "@/modules/planner/shared";

export const Route = createFileRoute("/_authenticated/planner/projetos")({
  component: PlannerProjectsPage,
});

function PlannerProjectsPage() {
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const [query, setQuery] = useState("");

  const projects = useMemo(() => loadProjects(tenantId), [tenantId]);
  const filtered = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Projetos"
        description="Gerencie os projetos paramétricos do tenant ativo."
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar projeto…"
            />
            <Link to="/planner/projetos/novo">
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo projeto
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mt-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title={projects.length === 0 ? "Nenhum projeto ainda" : "Nenhum projeto encontrado"}
            description={
              projects.length === 0
                ? "Crie o primeiro projeto com o wizard guiado pela IA."
                : "Ajuste sua busca para localizar projetos existentes."
            }
            action={
              projects.length === 0 ? (
                <Link to="/planner/projetos/novo">
                  <Button size="sm">
                    <Sparkles className="mr-2 h-4 w-4" /> Criar com IA
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      {p.client ? (
                        <p className="text-xs text-muted-foreground">{p.client}</p>
                      ) : null}
                    </div>
                    <StatusBadge
                      tone={
                        p.status === "approved"
                          ? "success"
                          : p.status === "draft"
                            ? "neutral"
                            : "info"
                      }
                    >
                      {p.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    v{p.version} · {p.environments.length} ambiente(s) · atualizado{" "}
                    {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}