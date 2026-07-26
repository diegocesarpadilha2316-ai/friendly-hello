import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, PlusCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  PageContainer,
  PageHeader,
  Button,
  EmptyState,
  StatusBadge,
  SearchInput,
} from "@/core/components/ui-kit";
import { useTenant } from "@/core/providers/TenantProvider";
import { listProjects, type PlannerProjectRowDTO } from "@/lib/planner-projects.functions";

const projectsQueryOptions = (
  tenantId: string,
  fetcher: () => Promise<PlannerProjectRowDTO[]>,
) =>
  queryOptions({
    queryKey: ["planner", "projects", tenantId],
    queryFn: fetcher,
    staleTime: 30_000,
  });

export const Route = createFileRoute("/_authenticated/planner/projetos/")({
  component: PlannerProjectsIndexPage,
  head: () => ({
    meta: [
      { title: "Projetos — Dioris Planner" },
      {
        name: "description",
        content:
          "Lista de projetos paramétricos do Dioris Planner, escopados por empresa.",
      },
      { property: "og:title", content: "Projetos — Dioris Planner" },
      {
        property: "og:description",
        content:
          "Gerencie projetos paramétricos conectados ao editor, orçamento, render e produção.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function PlannerProjectsIndexPage() {
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const [query, setQuery] = useState("");

  const fetchList = useServerFn(listProjects);
  const { data: projects } = useSuspenseQuery(
    projectsQueryOptions(tenantId, async () => {
      if (!activeCompany?.id) return [];
      try {
        const res = await fetchList();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    }),
  );
  const safeProjects = Array.isArray(projects) ? projects : [];
  const filtered = useMemo(
    () => safeProjects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [safeProjects, query],
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
            <Button size="sm" asChild>
              <Link to="/planner/projetos/novo">
                <Sparkles className="mr-2 h-4 w-4" /> Abrir Dioris IA
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mt-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title={safeProjects.length === 0 ? "Nenhum projeto ainda" : "Nenhum projeto encontrado"}
            description={
              safeProjects.length === 0
                ? "Crie o primeiro projeto com o wizard guiado pela IA."
                : "Ajuste sua busca para localizar projetos existentes."
            }
            action={
              safeProjects.length === 0 ? (
                <Button size="sm" asChild>
                  <Link to="/planner/projetos/novo">
                    <Sparkles className="mr-2 h-4 w-4" /> Criar com IA
                  </Link>
                </Button>
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
                    v{p.version} · atualizado{" "}
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