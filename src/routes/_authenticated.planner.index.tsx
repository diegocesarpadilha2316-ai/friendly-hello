import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, Boxes, Sparkles, PlusCircle, LayoutTemplate, Activity } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  ModuleCard,
  StatusBadge,
  Button,
} from "@/core/components/ui-kit";
import { useTenant } from "@/core/providers/TenantProvider";
import { useBillingSummary } from "@/core/billing/use-billing";
import { loadProjects } from "@/modules/planner/shared/persistence/local-store";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/planner/")({
  component: PlannerDashboard,
});

function PlannerDashboard() {
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const billing = useBillingSummary();

  const projects = useMemo(() => loadProjects(tenantId), [tenantId]);
  const drafts = projects.filter((p) => p.status === "draft").length;
  const active = projects.filter((p) => p.status === "in_progress" || p.status === "review").length;
  const approved = projects.filter((p) => p.status === "approved").length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Módulo Planner"
        title="Dashboard do Planner"
        description="Projetos, ambientes e créditos de IA — todos os dados vindos do Core."
        actions={
          <Link to="/planner/projetos">
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo projeto
            </Button>
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Projetos" value={projects.length} icon={<FolderKanban className="h-4 w-4" />} />
        <MetricCard label="Rascunhos" value={drafts} icon={<LayoutTemplate className="h-4 w-4" />} />
        <MetricCard label="Em execução" value={active} icon={<Activity className="h-4 w-4" />} />
        <MetricCard
          label="Créditos IA"
          value={billing.summary?.balance ?? 0}
          icon={<Sparkles className="h-4 w-4" />}
          hint={billing.isLoading ? "carregando…" : "saldo do tenant"}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Link to="/planner/projetos" className="block">
          <ModuleCard
            icon={<FolderKanban className="h-5 w-5" />}
            name="Projetos"
            description="Crie, versione e produza projetos paramétricos completos."
            href="/planner/projetos"
            status={{ label: `${projects.length} ativos`, tone: "info" }}
          />
        </Link>
        <Link to="/planner/biblioteca" className="block">
          <ModuleCard
            icon={<Boxes className="h-5 w-5" />}
            name="Biblioteca"
            description="Catálogo compartilhado de módulos, materiais e ferragens."
            href="/planner/biblioteca"
            status={{ label: "preparado", tone: "neutral" }}
          />
        </Link>
        <Link to="/planner/ia" className="block">
          <ModuleCard
            icon={<Sparkles className="h-5 w-5" />}
            name="IA de Projeto"
            description="Copiloto que interpreta briefings e propõe soluções paramétricas."
            href="/planner/ia"
            status={{ label: "preparado", tone: "neutral" }}
          />
        </Link>
      </div>

      {projects.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title="Nenhum projeto ainda"
            description="Aprovado: sem projetos criados no tenant atual. Comece um projeto para explorar ambientes, cômodos e o motor paramétrico."
            action={
              <Link to="/planner/projetos">
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar primeiro projeto
                </Button>
              </Link>
            }
          />
        </div>
      )}
    </PageContainer>
  );
}