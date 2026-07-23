import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Boxes, CheckCircle2, Clock, Sparkles, Search } from "lucide-react";
import {
  PageContainer, PageHeader, MetricCard, ModuleCard, SearchInput, EmptyState, StatusBadge, FormSection,
} from "@/core/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { modules } from "@/core/config/modules";
import { useBillingSummary, usePlansCatalog } from "@/core/billing/use-billing";

export const Route = createFileRoute("/_authenticated/workspace/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos Contratados — Workspace | Dioris Hub" },
      { name: "description", content: "Gerencie os módulos disponíveis, contratados e planejados da sua assinatura Dioris." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModulosPage,
});

const STATUS_TONE = {
  disponivel: "success",
  "em-desenvolvimento": "warning",
  planejado: "neutral",
} as const;
const STATUS_LABEL = {
  disponivel: "Disponível",
  "em-desenvolvimento": "Em desenvolvimento",
  planejado: "Planejado",
} as const;

function ModulosPage() {
  const billing = useBillingSummary();
  const plans = usePlansCatalog();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "contracted" | "available" | "roadmap">("all");

  const planFeatures = useMemo(
    () => new Set((billing.data?.plan?.features ?? []).map((f) => f.toLowerCase())),
    [billing.data],
  );

  const enriched = useMemo(() => modules.map((m) => {
    const contracted = planFeatures.has(m.id) || planFeatures.has(m.slug) || planFeatures.has(m.label.toLowerCase());
    return { ...m, contracted };
  }), [planFeatures]);

  const kpis = useMemo(() => ({
    total: enriched.length,
    contracted: enriched.filter((m) => m.contracted).length,
    available: enriched.filter((m) => m.status === "disponivel").length,
    dev: enriched.filter((m) => m.status === "em-desenvolvimento").length,
  }), [enriched]);

  const filtered = enriched.filter((m) => {
    if (query && !`${m.label} ${m.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (tab === "contracted") return m.contracted;
    if (tab === "available") return m.status === "disponivel";
    if (tab === "roadmap") return m.status !== "disponivel";
    return true;
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Módulos Contratados"
        description="Catálogo completo da plataforma, com destaque para os módulos incluídos no seu plano atual."
      />

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <MetricCard icon={<Boxes className="h-4 w-4" />} label="Módulos totais" value={kpis.total} />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Contratados" value={kpis.contracted} hint={billing.data?.plan?.label ?? "Sem plano"} />
        <MetricCard icon={<Sparkles className="h-4 w-4" />} label="Disponíveis" value={kpis.available} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="No roadmap" value={kpis.dev} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1"><SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar módulos…" /></div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="contracted">Contratados</TabsTrigger>
            <TabsTrigger value="available">Disponíveis</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {billing.isLoading ? (
        <Skeleton className="mt-6 h-40 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState className="mt-6" icon={<Search className="h-6 w-6" />} title="Nenhum módulo encontrado" description="Ajuste os filtros ou a busca." />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const Icon = m.icon;
            return (
              <ModuleCard
                key={m.id}
                name={
                  <span className="flex items-center gap-2">
                    {m.label}
                    {m.contracted ? <StatusBadge tone="success">Contratado</StatusBadge> : null}
                  </span>
                }
                description={m.description}
                icon={<Icon className="h-5 w-5" />}
                status={{ label: STATUS_LABEL[m.status], tone: STATUS_TONE[m.status] }}
                href={m.status === "disponivel" ? m.path : undefined}
                disabled={m.status !== "disponivel"}
              />
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <FormSection title="Comparativo de planos" description="Veja como cada plano libera diferentes módulos e recursos.">
          {plans.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (plans.data ?? []).length === 0 ? (
            <EmptyState icon={<Sparkles className="h-6 w-6" />} title="Nenhum plano cadastrado" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {(plans.data ?? []).map((p) => (
                <div key={p.key} className={`rounded-lg border p-4 ${billing.data?.plan?.key === p.key ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold">{p.label}</h3>
                    <span className="text-xs text-muted-foreground">{p.monthlyCredits.toLocaleString("pt-BR")} créd/mês</span>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {p.features.map((f) => (<li key={f} className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-success" />{f}</li>))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </FormSection>
      </div>
    </PageContainer>
  );
}
