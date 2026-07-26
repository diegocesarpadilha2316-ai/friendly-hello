import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FolderKanban,
  Sparkles,
  PlusCircle,
  Activity,
  Camera,
  Wrench,
  Factory,
  Boxes,
  Upload,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button, StatusBadge } from "@/core/components/ui-kit";
import { useTenant } from "@/core/providers/TenantProvider";
import { useBillingSummary } from "@/core/billing/use-billing";
import { loadProjects } from "@/modules/planner/shared/persistence/local-store";
import type { PlannerProjectStatus } from "@/modules/planner/shared";
import {
  listProjects,
  type PlannerProjectRowDTO,
} from "@/lib/planner-projects.functions";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/planner/")({
  component: PlannerDashboard,
});

const STATUS_TONE: Record<PlannerProjectStatus, "neutral" | "info" | "warning" | "success"> = {
  draft: "neutral",
  in_progress: "info",
  review: "warning",
  approved: "success",
  archived: "neutral",
};
const STATUS_LABEL: Record<PlannerProjectStatus, string> = {
  draft: "Rascunho",
  in_progress: "Em andamento",
  review: "Em revisão",
  approved: "Aprovado",
  archived: "Arquivado",
};

const QUICK_ACTIONS = [
  { to: "/planner/biblioteca", label: "Catálogo", icon: Boxes },
  { to: "/planner/engenharia", label: "Engenharia", icon: Wrench },
  { to: "/planner/producao", label: "Produção", icon: Factory },
  { to: "/planner/render", label: "Render", icon: Camera },
] as const;

interface DashboardProject {
  id: string;
  name: string;
  client: string | null;
  status: PlannerProjectStatus;
  updatedAt: string;
  environments: number;
  rooms: number;
}

const projectsDashboardOptions = (
  tenantId: string,
  fetcher: () => Promise<PlannerProjectRowDTO[]>,
) =>
  queryOptions({
    queryKey: ["planner", "projects", tenantId],
    queryFn: fetcher,
    staleTime: 30_000,
  });

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}

function ProjectCard({ project }: { project: DashboardProject }) {
  const roomCount = project.rooms;
  return (
    <Link
      to="/planner/projetos/$projectId"
      params={{ projectId: project.id }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/40 transition-all hover:border-primary/40 hover:bg-card/60 hover:shadow-[0_18px_50px_-20px_hsl(var(--primary)/0.35)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.35),transparent_45%),radial-gradient(circle_at_80%_60%,hsl(var(--accent)/0.35),transparent_45%)]" />
        <div className="absolute inset-0 grid place-items-center">
          <FolderKanban className="h-10 w-10 text-primary-foreground/40" />
        </div>
        <div className="absolute left-3 top-3">
          <StatusBadge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</StatusBadge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{project.name}</h3>
            {project.client && (
              <p className="truncate text-xs text-muted-foreground">{project.client}</p>
            )}
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{project.environments} ambientes</span>
          <span>•</span>
          <span>{roomCount} cômodos</span>
          <span className="ml-auto">{formatRelative(project.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function PlannerDashboard() {
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const billing = useBillingSummary();

  const fetchList = useServerFn(listProjects);
  const { data: rows } = useSuspenseQuery(
    projectsDashboardOptions(tenantId, () => fetchList()),
  );

  // Merge remote metadata with local bootstrap (environments/rooms live in the
  // browser bridge until Etapa B moves them into snapshots).
  const projects = useMemo<DashboardProject[]>(() => {
    const local = loadProjects(tenantId);
    const localById = new Map(local.map((p) => [String(p.id), p]));
    return rows.map((r) => {
      const l = localById.get(r.id);
      const envs = l?.environments ?? [];
      return {
        id: r.id,
        name: r.name,
        client: r.client,
        status: r.status as PlannerProjectStatus,
        updatedAt: r.updatedAt,
        environments: envs.length,
        rooms: envs.reduce((s, e) => s + e.rooms.length, 0),
      };
    });
  }, [rows, tenantId]);

  const active = projects.filter((p) => p.status === "in_progress" || p.status === "review").length;
  const recent = projects.slice(0, 6);
  const timeline = projects.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/15 via-background to-accent/10 p-6 sm:p-8">
        <div className="absolute inset-0 -z-0 opacity-60 [background-image:radial-gradient(circle_at_10%_20%,hsl(var(--primary)/0.25),transparent_45%),radial-gradient(circle_at_90%_80%,hsl(var(--accent)/0.25),transparent_45%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Dioris Planner
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Bem-vindo{activeCompany?.name ? `, ${activeCompany.name}` : ""}.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Projete, renderize e produza — tudo em um único ecossistema paramétrico com IA integrada.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-2" asChild>
              <Link to="/planner/projetos/novo">
                <PlusCircle className="h-4 w-4" /> Novo projeto
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <Link to="/planner/projetos">
                <Upload className="h-4 w-4" /> Importar
              </Link>
            </Button>
            <Button size="sm" variant="ghost" className="gap-2" asChild>
              <Link to="/planner/ia">
                <Sparkles className="h-4 w-4" /> IA Copiloto
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main grid: projects + side rail */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Metrics */}
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricTile icon={<FolderKanban className="h-4 w-4" />} label="Projetos" value={projects.length} />
            <MetricTile icon={<Activity className="h-4 w-4" />} label="Em execução" value={active} />
            <MetricTile
              icon={<Sparkles className="h-4 w-4" />}
              label="Créditos IA"
              value={billing.summary?.balance ?? 0}
              hint={billing.isLoading ? "carregando…" : "saldo do tenant"}
            />
          </div>

          {/* Projects */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Projetos recentes</h2>
                <p className="text-xs text-muted-foreground">
                  Últimos ambientes que você editou.
                </p>
              </div>
              <Link
                to="/planner/projetos"
                className="text-xs font-medium text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-10 text-center">
                <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Nenhum projeto ainda</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Comece um projeto para explorar ambientes, cômodos e o motor paramétrico.
                </p>
                <Link to="/planner/projetos" className="mt-4 inline-block">
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar primeiro projeto
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside className="flex flex-col gap-4">
          {/* IA Copilot card */}
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/40 to-accent/10 p-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">IA Copiloto</p>
                <p className="text-[11px] text-muted-foreground">
                  Assistente do Planner
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Peça em linguagem natural: “Criar cozinha em L com ilha” ou “Trocar MDF para carvalho”.
            </p>
            <Link to="/planner/ia" className="mt-3 block">
              <Button size="sm" variant="outline" className="w-full">
                Abrir chat da IA
              </Button>
            </Link>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Atalhos
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {a.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Atividade recente
              </p>
            </div>
            {timeline.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Sem atividades — crie um projeto para começar.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {timeline.map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {STATUS_LABEL[p.status]} • {formatRelative(p.updatedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}