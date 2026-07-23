import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Boxes, CheckCircle2, Clock, Sparkles, Search, Star, StarOff, Activity,
  Zap, History as HistoryIcon, ExternalLink, ChevronRight, Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageContainer, PageHeader, MetricCard, ModuleCard, SearchInput, EmptyState,
  StatusBadge, FormSection,
} from "@/core/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { modules, type ModuleDefinition } from "@/core/config/modules";
import { useBillingSummary, usePlansCatalog, useCreditLedger } from "@/core/billing/use-billing";
import { useCompanySettings, useUpdateCompanySettings } from "@/core/configuration/use-configuration";
import { useEvents } from "@/core/events/use-events";
import { useAudit, useHealth } from "@/core/observability/use-observability";
import { useNotifications } from "@/core/notifications/use-notifications";

export const Route = createFileRoute("/_authenticated/workspace/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos Contratados — Workspace | Dioris Hub" },
      { name: "description", content: "Central de módulos: contratação, consumo, favoritos, saúde e histórico com reuso total do Core." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModulosPage,
});

// -----------------------------------------------------------------------------
// Enriquecimento: categoria, plano, versão (metadados do catálogo)
// -----------------------------------------------------------------------------
type CategoryKey =
  | "planejamento" | "criacao" | "comercial" | "financeiro"
  | "automacao" | "ia" | "plataforma";
const CATEGORY_LABEL: Record<CategoryKey, string> = {
  planejamento: "Planejamento", criacao: "Criação", comercial: "Comercial",
  financeiro: "Financeiro", automacao: "Automação", ia: "Inteligência Artificial",
  plataforma: "Plataforma",
};
const CATEGORY_BY_MODULE: Record<string, CategoryKey> = {
  planner: "planejamento", sites: "criacao", systems: "plataforma",
  crm: "comercial", finance: "financeiro", marketplace: "comercial",
  automation: "automacao", ai: "ia",
};
const REQUIRED_PLAN: Record<string, string> = {
  planner: "starter", sites: "pro", systems: "pro",
  crm: "pro", finance: "business", marketplace: "business",
  automation: "business", ai: "starter",
};

type ExtStatus = "ativo" | "disponivel" | "trial" | "bloqueado" | "em-breve";
const STATUS_TONE: Record<ExtStatus, "success" | "info" | "warning" | "danger" | "neutral"> = {
  ativo: "success", disponivel: "info", trial: "warning", bloqueado: "danger", "em-breve": "neutral",
};
const STATUS_LABEL: Record<ExtStatus, string> = {
  ativo: "Ativo", disponivel: "Disponível", trial: "Trial", bloqueado: "Bloqueado", "em-breve": "Em breve",
};

interface EnrichedModule extends ModuleDefinition {
  category: CategoryKey;
  requiredPlan: string;
  version: string;
  extStatus: ExtStatus;
  contracted: boolean;
  favorite: boolean;
  lastAccess: string | null;
  creditsUsed: number;
}

// -----------------------------------------------------------------------------
function ModulosPage() {
  const billing = useBillingSummary();
  const plans = usePlansCatalog();
  const ledger = useCreditLedger();
  const settings = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"grade" | "categorias" | "favoritos" | "historico" | "eventos" | "saude">("grade");
  const [statusFilter, setStatusFilter] = useState<"all" | ExtStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | CategoryKey>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selected, setSelected] = useState<EnrichedModule | null>(null);

  // Metadata persistida via Configuration (company.settings.metadata.workspaceModules)
  const meta = (settings.data?.metadata ?? {}) as Record<string, unknown>;
  const wsMeta = (meta.workspaceModules ?? {}) as {
    favorites?: string[];
    lastAccess?: Record<string, string>;
  };
  const favorites = new Set(wsMeta.favorites ?? []);
  const lastAccess = wsMeta.lastAccess ?? {};

  const persist = (next: { favorites?: string[]; lastAccess?: Record<string, string> }) => {
    const merged = {
      ...meta,
      workspaceModules: { ...wsMeta, ...next },
    };
    updateSettings.mutate(
      { metadata: merged },
      { onError: (e) => toast.error((e as Error).message) },
    );
  };

  const toggleFavorite = (id: string) => {
    const set = new Set(wsMeta.favorites ?? []);
    if (set.has(id)) set.delete(id); else set.add(id);
    persist({ favorites: Array.from(set) });
  };

  const planFeatures = useMemo(
    () => new Set((billing.summary.plan?.features ?? []).map((f) => f.toLowerCase())),
    [billing.summary],
  );

  // Consumo por módulo via credit_ledger (reason contém o id do módulo).
  const creditsByModule = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of ledger.entries) {
      if (e.kind !== "consume") continue;
      const src = `${e.reason ?? ""} ${e.reference ?? ""}`.toLowerCase();
      for (const m of modules) {
        if (src.includes(m.id) || src.includes(m.slug)) {
          map[m.id] = (map[m.id] ?? 0) + Math.abs(e.amount);
        }
      }
    }
    return map;
  }, [ledger.entries]);

  const enriched: EnrichedModule[] = useMemo(() => modules.map((m) => {
    const contracted = planFeatures.has(m.id) || planFeatures.has(m.slug) || planFeatures.has(m.label.toLowerCase());
    let extStatus: ExtStatus;
    if (m.status === "em-desenvolvimento") extStatus = "em-breve";
    else if (m.status === "planejado" && !contracted) extStatus = "em-breve";
    else if (contracted && m.status === "disponivel") extStatus = "ativo";
    else if (m.status === "disponivel") extStatus = "disponivel";
    else extStatus = "bloqueado";
    return {
      ...m,
      category: CATEGORY_BY_MODULE[m.id] ?? "plataforma",
      requiredPlan: REQUIRED_PLAN[m.id] ?? "starter",
      version: "1.0.0",
      extStatus,
      contracted,
      favorite: favorites.has(m.id),
      lastAccess: lastAccess[m.id] ?? null,
      creditsUsed: creditsByModule[m.id] ?? 0,
    };
  }), [planFeatures, favorites, lastAccess, creditsByModule]);

  const kpis = useMemo(() => ({
    total: enriched.length,
    active: enriched.filter((m) => m.extStatus === "ativo").length,
    available: enriched.filter((m) => m.extStatus === "disponivel").length,
    trial: enriched.filter((m) => m.extStatus === "trial").length,
    consumo: Object.values(creditsByModule).reduce((s, n) => s + n, 0),
  }), [enriched, creditsByModule]);

  const recent = useMemo(
    () => enriched
      .filter((m) => m.lastAccess)
      .sort((a, b) => (b.lastAccess ?? "").localeCompare(a.lastAccess ?? ""))
      .slice(0, 5),
    [enriched],
  );

  const filtered = enriched.filter((m) => {
    if (query && !`${m.label} ${m.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter !== "all" && m.extStatus !== statusFilter) return false;
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (planFilter !== "all" && m.requiredPlan !== planFilter) return false;
    return true;
  });

  const grouped = useMemo(() => {
    const g: Record<CategoryKey, EnrichedModule[]> = {
      planejamento: [], criacao: [], comercial: [], financeiro: [],
      automacao: [], ia: [], plataforma: [],
    };
    for (const m of filtered) g[m.category].push(m);
    return g;
  }, [filtered]);

  const openModule = (m: EnrichedModule) => {
    setSelected(m);
    if (m.extStatus === "ativo" || m.extStatus === "trial") {
      persist({ lastAccess: { ...lastAccess, [m.id]: new Date().toISOString() } });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Módulos Contratados"
        description="Catálogo completo com contratação, consumo, favoritos, saúde e histórico — reuso total do Core."
      />

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <MetricCard icon={<Boxes className="h-4 w-4" />} label="Total" value={kpis.total} />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Ativos" value={kpis.active} hint={billing.summary.plan?.label ?? "Sem plano"} />
        <MetricCard icon={<Sparkles className="h-4 w-4" />} label="Disponíveis" value={kpis.available} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="Em trial" value={kpis.trial} />
        <MetricCard icon={<Activity className="h-4 w-4" />} label="Créditos consumidos" value={kpis.consumo.toLocaleString("pt-BR")} />
      </div>

      {recent.length > 0 ? (
        <FormSection className="mt-6" title="Acessados recentemente">
          <div className="flex flex-wrap gap-2">
            {recent.map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => openModule(m)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs transition hover:border-primary hover:bg-primary/5">
                  <Icon className="h-3.5 w-3.5" />{m.label}
                  <span className="text-[10px] text-muted-foreground">{new Date(m.lastAccess!).toLocaleDateString("pt-BR")}</span>
                </button>
              );
            })}
          </div>
        </FormSection>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1"><SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisa global (nome, descrição)…" /></div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {(Object.keys(CATEGORY_LABEL) as CategoryKey[]).map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {(Object.keys(STATUS_LABEL) as ExtStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos planos</SelectItem>
            {plans.plans.map((p) => (<SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="grade"><Boxes className="mr-1 h-3.5 w-3.5" />Grade</TabsTrigger>
          <TabsTrigger value="categorias"><Package className="mr-1 h-3.5 w-3.5" />Categorias</TabsTrigger>
          <TabsTrigger value="favoritos"><Star className="mr-1 h-3.5 w-3.5" />Favoritos</TabsTrigger>
          <TabsTrigger value="historico"><HistoryIcon className="mr-1 h-3.5 w-3.5" />Histórico</TabsTrigger>
          <TabsTrigger value="eventos"><Zap className="mr-1 h-3.5 w-3.5" />Eventos</TabsTrigger>
          <TabsTrigger value="saude"><Activity className="mr-1 h-3.5 w-3.5" />Saúde</TabsTrigger>
        </TabsList>

        <TabsContent value="grade" className="mt-6">
          {billing.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Search className="h-6 w-6" />} title="Nenhum módulo encontrado" description="Ajuste os filtros ou a busca." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => <ModuleGridCard key={m.id} m={m} onOpen={openModule} onFavorite={toggleFavorite} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categorias" className="mt-6 space-y-8">
          {(Object.keys(CATEGORY_LABEL) as CategoryKey[]).map((cat) => grouped[cat].length > 0 ? (
            <section key={cat}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">{CATEGORY_LABEL[cat]}</h2>
                <StatusBadge tone="neutral">{grouped[cat].length}</StatusBadge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {grouped[cat].map((m) => <ModuleGridCard key={m.id} m={m} onOpen={openModule} onFavorite={toggleFavorite} />)}
              </div>
            </section>
          ) : null)}
        </TabsContent>

        <TabsContent value="favoritos" className="mt-6">
          {enriched.filter((m) => m.favorite).length === 0 ? (
            <EmptyState icon={<StarOff className="h-6 w-6" />} title="Sem favoritos" description="Clique no ícone de estrela nos cards para favoritar módulos." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {enriched.filter((m) => m.favorite).map((m) => <ModuleGridCard key={m.id} m={m} onOpen={openModule} onFavorite={toggleFavorite} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-6"><HistoryTab enriched={enriched} /></TabsContent>
        <TabsContent value="eventos" className="mt-6"><EventsPanel /></TabsContent>
        <TabsContent value="saude" className="mt-6"><HealthPanel enriched={enriched} /></TabsContent>
      </Tabs>

      <FormSection className="mt-8" title="Comparativo de planos" description="Recursos incluídos em cada plano.">
        {plans.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : plans.plans.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-6 w-6" />} title="Nenhum plano cadastrado" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plans.plans.map((p) => (
              <div key={p.key} className={`rounded-lg border p-4 ${billing.summary.plan?.key === p.key ? "border-primary bg-primary/5" : "border-border"}`}>
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

      <ModuleDetailSheet
        m={selected}
        onClose={() => setSelected(null)}
        onFavorite={toggleFavorite}
      />
    </PageContainer>
  );
}

// -----------------------------------------------------------------------------
function ModuleGridCard({
  m, onOpen, onFavorite,
}: {
  m: EnrichedModule;
  onOpen: (m: EnrichedModule) => void;
  onFavorite: (id: string) => void;
}) {
  const Icon = m.icon;
  return (
    <div className="group relative">
      <ModuleCard
        name={
          <span className="flex flex-wrap items-center gap-2">
            {m.label}
            {m.contracted ? <StatusBadge tone="success">Contratado</StatusBadge> : null}
          </span>
        }
        description={
          <span className="block">
            <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[m.category]} · v{m.version} · Plano {m.requiredPlan}</span>
            <span className="mt-1 block">{m.description}</span>
            <span className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
              <span>{m.creditsUsed.toLocaleString("pt-BR")} créd usados</span>
              {m.lastAccess ? <span>· Último: {new Date(m.lastAccess).toLocaleDateString("pt-BR")}</span> : null}
            </span>
          </span>
        }
        icon={<Icon className="h-5 w-5" />}
        status={{ label: STATUS_LABEL[m.extStatus], tone: STATUS_TONE[m.extStatus] }}
        onOpen={() => onOpen(m)}
        disabled={m.extStatus === "bloqueado" || m.extStatus === "em-breve"}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onFavorite(m.id); }}
        className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-primary group-hover:opacity-100 aria-[current=true]:opacity-100"
        aria-current={m.favorite}
        aria-label={m.favorite ? "Desfavoritar" : "Favoritar"}
      >
        {m.favorite ? <Star className="h-4 w-4 fill-primary text-primary" /> : <Star className="h-4 w-4" />}
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
function ModuleDetailSheet({
  m, onClose, onFavorite,
}: { m: EnrichedModule | null; onClose: () => void; onFavorite: (id: string) => void }) {
  return (
    <Sheet open={!!m} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {m ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <m.icon className="h-5 w-5" />{m.label}
                <StatusBadge tone={STATUS_TONE[m.extStatus]}>{STATUS_LABEL[m.extStatus]}</StatusBadge>
              </SheetTitle>
              <SheetDescription>{m.description}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6 text-sm">
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Recursos</h4>
                <ul className="space-y-1 text-xs">
                  {[
                    "Dashboard integrado", "Automações via EventBus", "Notificações in-app",
                    "Auditoria completa", "Integração com IA Gateway", "Créditos rastreados",
                  ].map((f) => (<li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success" />{f}</li>))}
                </ul>
              </section>
              <section className="grid grid-cols-2 gap-3">
                <MetricCard label="Créditos" value={m.creditsUsed.toLocaleString("pt-BR")} />
                <MetricCard label="Versão" value={`v${m.version}`} />
                <MetricCard label="Plano" value={m.requiredPlan} />
                <MetricCard label="Categoria" value={CATEGORY_LABEL[m.category]} />
              </section>
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Dependências</h4>
                <p className="text-xs text-muted-foreground">Core (Auth, Tenant, Billing, EventBus, NotificationManager, Observability, IA Gateway).</p>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Permissões necessárias</h4>
                <div className="flex flex-wrap gap-1">
                  {[`${m.id}.view`, `${m.id}.manage`].map((p) => (
                    <code key={p} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{p}</code>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Changelog</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>v1.0.0 — Lançamento inicial</li>
                </ul>
              </section>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onFavorite(m.id)}>
                  {m.favorite ? <Star className="mr-1 h-3.5 w-3.5 fill-primary text-primary" /> : <Star className="mr-1 h-3.5 w-3.5" />}
                  {m.favorite ? "Favorito" : "Favoritar"}
                </Button>
                <Button size="sm" disabled={m.extStatus !== "ativo" && m.extStatus !== "trial"} asChild={m.extStatus === "ativo" || m.extStatus === "trial"}>
                  {m.extStatus === "ativo" || m.extStatus === "trial" ? (
                    <a href={m.path}>Abrir módulo <ExternalLink className="ml-1 h-3.5 w-3.5" /></a>
                  ) : (<span>Indisponível</span>)}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// -----------------------------------------------------------------------------
function HistoryTab({ enriched }: { enriched: EnrichedModule[] }) {
  const audit = useAudit();
  const notif = useNotifications();
  const entries = audit.data ?? [];
  const notifs = notif.data ?? [];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FormSection title="Últimos acessos por módulo">
        {enriched.filter((m) => m.lastAccess).length === 0 ? (
          <EmptyState icon={<HistoryIcon className="h-6 w-6" />} title="Sem histórico" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {enriched.filter((m) => m.lastAccess).sort((a, b) => (b.lastAccess ?? "").localeCompare(a.lastAccess ?? "")).map((m) => (
              <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><m.icon className="h-4 w-4" />{m.label}</span>
                <span className="text-xs text-muted-foreground">{new Date(m.lastAccess!).toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
      <FormSection title="Auditoria relacionada">
        {audit.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : entries.length === 0 ? (
          <EmptyState icon={<HistoryIcon className="h-6 w-6" />} title="Sem registros" />
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {entries.slice(0, 30).map((a) => (
              <li key={a.id} className="px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <code className="font-mono">{a.action}</code>
                  <span className="text-muted-foreground">{new Date(a.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <div className="text-muted-foreground">{a.entity}</div>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
      <FormSection className="lg:col-span-2" title="Notificações relacionadas a módulos">
        {notifs.length === 0 ? (
          <EmptyState icon={<Zap className="h-6 w-6" />} title="Sem notificações" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {notifs.slice(0, 20).map((n) => (
              <li key={n.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="truncate">{n.title}</span>
                <StatusBadge tone="neutral">{n.category}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}

// -----------------------------------------------------------------------------
function EventsPanel() {
  const q = useEvents();
  const rows = q.data ?? [];
  if (q.isLoading) return <Skeleton className="h-40 w-full" />;
  if (rows.length === 0) return <EmptyState icon={<Zap className="h-6 w-6" />} title="Sem eventos" description="Eventos do EventBus aparecerão aqui conforme os módulos publicarem." />;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Quando</th>
            <th className="px-3 py-2 text-left">Tipo</th>
            <th className="px-3 py-2 text-left">Origem</th>
            <th className="px-3 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 80).map((e) => (
            <tr key={e.id}>
              <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(e.scheduledAt).toLocaleString("pt-BR")}</td>
              <td className="px-3 py-2"><code className="font-mono text-xs">{e.type}</code></td>
              <td className="px-3 py-2 text-xs">{e.source}</td>
              <td className="px-3 py-2 text-xs">{e.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -----------------------------------------------------------------------------
function HealthPanel({ enriched }: { enriched: EnrichedModule[] }) {
  const health = useHealth();
  const rows = health.data ?? [];
  const healthyN = rows.filter((h) => h.status === "healthy").length;
  const overall = rows.some((h) => h.status === "down")
    ? "DOWN"
    : rows.some((h) => h.status === "degraded")
      ? "DEGRADED"
      : "HEALTHY";
  const uptime = rows.length ? (healthyN / rows.length) * 100 : 100;
  const activeCount = enriched.filter((m) => m.extStatus === "ativo").length;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Módulos monitorados" value={activeCount} />
        <MetricCard label="Uptime" value={`${uptime.toFixed(2)}%`} />
        <MetricCard label="Componentes" value={rows.length} />
        <MetricCard label="Status geral" value={overall} />
      </div>
      <FormSection title="Saúde por módulo">
        <ul className="divide-y divide-border rounded-lg border border-border">
          {enriched.map((m) => {
            const healthy = m.extStatus === "ativo" || m.extStatus === "trial";
            return (
              <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><m.icon className="h-4 w-4" />{m.label}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={healthy ? "success" : "neutral"}>{healthy ? "Operacional" : "Não ativo"}</StatusBadge>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </li>
            );
          })}
        </ul>
      </FormSection>
    </div>
  );
}
