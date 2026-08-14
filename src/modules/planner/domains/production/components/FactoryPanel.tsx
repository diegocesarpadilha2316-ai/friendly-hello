/**
 * Fase 3.15 — Painel Fábrica 4.0 (Produção Inteligente Enterprise).
 *
 * 100% derivado de useIntelligence (que reutiliza useProduction + useIndustrial).
 * Zero providers, zero stores, zero migrations. Design Dioris dark-first.
 */
import { useState } from "react";
import {
  Button,
  DataTable,
  EmptyState,
  StatusBadge,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useIntelligence } from "../hooks/use-intelligence";
import type {
  FactoryAlert,
  FactoryIntent,
  FactoryKPI,
  MachineLoad,
  OperatorAssignment,
  PrioritizedOrder,
  ProductionQueue,
  QualityCheck,
  RoutingPlan,
} from "../services/intelligence";

const SUBTABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "filas", label: "Filas" },
  { id: "capacidade", label: "Capacidade" },
  { id: "roteiro", label: "Roteiro" },
  { id: "operadores", label: "Operadores" },
  { id: "qualidade", label: "Qualidade" },
  { id: "entrega", label: "Entrega" },
  { id: "alertas", label: "Alertas" },
  { id: "ia", label: "IA" },
] as const;
type SubTab = (typeof SUBTABS)[number]["id"];

function toneClass(tone: FactoryKPI["tone"]): string {
  return tone === "success"
    ? "border-emerald-500/30 bg-emerald-500/5"
    : tone === "warning"
      ? "border-amber-500/30 bg-amber-500/5"
      : tone === "info"
        ? "border-primary/30 bg-primary/5"
        : "border-border bg-card";
}

function priorityTone(p: PrioritizedOrder["priority"]): "success" | "info" | "warning" | "danger" {
  return p === "urgente"
    ? "danger"
    : p === "alta"
      ? "warning"
      : p === "normal"
        ? "info"
        : "success";
}

export function FactoryPanel() {
  const [sub, setSub] = useState<SubTab>("dashboard");
  const intel = useIntelligence();

  if (!intel.hasProject || !intel.capacity || !intel.balance || !intel.delivery || !intel.quality) {
    return (
      <EmptyState
        title="Fábrica aguardando projeto"
        description="Abra um projeto no Planner e insira móveis para ativar o motor Fábrica 4.0."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-4">
        <div className="text-xs uppercase tracking-widest text-primary">
          Fase 3.15 · Fábrica 4.0
        </div>
        <div className="text-lg font-semibold">Produção Inteligente Enterprise</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Scheduler · Prioridades · Capacidade · Roteiro · Operadores · Qualidade · Entrega · IA.
          Camada 100% derivada — zero stores, zero migrations.
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              sub === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "dashboard" && <DashboardSub kpis={intel.kpis} alerts={intel.alerts} />}
      {sub === "filas" && <QueuesSub queues={intel.queues} prioritized={intel.prioritized} />}
      {sub === "capacidade" && (
        <CapacitySub capacity={intel.capacity} balance={intel.balance.loads} />
      )}
      {sub === "roteiro" && <RoutingSub routings={intel.routings} />}
      {sub === "operadores" && <OperatorsSub assignments={intel.assignments} />}
      {sub === "qualidade" && (
        <QualitySub
          checks={intel.quality.checks}
          totalChecks={intel.quality.totalChecks}
          criticalChecks={intel.quality.criticalChecks}
          reworkRatePct={intel.quality.reworkRatePct}
          defectRatePct={intel.quality.defectRatePct}
        />
      )}
      {sub === "entrega" && <DeliverySub delivery={intel.delivery} />}
      {sub === "alertas" && (
        <AlertsSub alerts={intel.alerts} suggestions={intel.balance.suggestions} />
      )}
      {sub === "ia" && <AiSub intents={intel.intents} ask={intel.ask} />}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────

function DashboardSub({
  kpis,
  alerts,
}: {
  kpis: readonly FactoryKPI[];
  alerts: readonly FactoryAlert[];
}) {
  const critical = alerts.filter((a) => a.level === "critical").length;
  const warnings = alerts.filter((a) => a.level === "warning").length;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.id} className={cn("rounded-lg border p-3", toneClass(k.tone))}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{k.value}</div>
            <div className="text-[11px] text-muted-foreground">{k.hint}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        <StatusBadge tone={critical > 0 ? "danger" : "success"}>{critical} críticos</StatusBadge>
        <StatusBadge tone={warnings > 0 ? "warning" : "neutral"}>{warnings} avisos</StatusBadge>
        <span>KPIs em tempo real — derivados do projeto ativo.</span>
      </div>
    </div>
  );
}

// ─── Filas ─────────────────────────────────────────────────────

function QueuesSub({
  queues,
  prioritized,
}: {
  queues: readonly ProductionQueue[];
  prioritized: readonly PrioritizedOrder[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {queues.map((q) => (
          <div key={q.kind} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{q.label}</div>
              <StatusBadge tone={q.loadPct >= 90 ? "warning" : "info"}>{q.loadPct}%</StatusBadge>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {q.tickets.length} tickets · {Math.round(q.totalMinutes / 60)}h /{" "}
              {Math.round(q.capacityMinutes / 60)}h
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted/40">
              <div
                className={cn("h-full", q.loadPct >= 90 ? "bg-amber-500" : "bg-primary")}
                style={{ width: `${q.loadPct}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1 text-xs">
              {q.tickets.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between text-muted-foreground">
                  <span className="truncate">{t.label}</span>
                  <span className="tabular-nums">{t.minutes}min</span>
                </li>
              ))}
              {q.tickets.length > 5 && (
                <li className="text-[11px] text-muted-foreground">
                  +{q.tickets.length - 5} tickets…
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {prioritized.length > 0 && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Priorização automática
          </div>
          <DataTable
            columns={
              [
                { id: "code", header: "Pedido", cell: (r) => r.code },
                { id: "cli", header: "Cliente", cell: (r) => r.clientName },
                {
                  id: "pri",
                  header: "Prioridade",
                  cell: (r) => (
                    <StatusBadge tone={priorityTone(r.priority)}>{r.priority}</StatusBadge>
                  ),
                },
                {
                  id: "score",
                  header: "Score",
                  cell: (r) => <span className="tabular-nums">{r.score}</span>,
                  align: "right",
                },
                {
                  id: "atraso",
                  header: "Atraso",
                  cell: (r) => <span className="tabular-nums">{r.delayedDays}d</span>,
                  align: "right",
                },
                {
                  id: "prog",
                  header: "Progresso",
                  cell: (r) => <span className="tabular-nums">{r.progress}%</span>,
                  align: "right",
                },
                {
                  id: "reason",
                  header: "Motivo",
                  cell: (r) => <span className="text-xs text-muted-foreground">{r.reason}</span>,
                },
              ] satisfies DataTableColumn<PrioritizedOrder>[]
            }
            data={[...prioritized]}
            getRowKey={(r) => r.orderId}
          />
        </div>
      )}
    </div>
  );
}

// ─── Capacidade & Balanceamento ────────────────────────────────

function CapacitySub({
  capacity,
  balance,
}: {
  capacity: NonNullable<ReturnType<typeof useIntelligence>["capacity"]>;
  balance: readonly MachineLoad[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricSmall
          label="Turnos"
          value={`${capacity.shifts}× ${capacity.shiftHours}h`}
          hint="por dia"
        />
        <MetricSmall
          label="Capacidade diária"
          value={`${capacity.dailyCapacityH}h`}
          hint={`${capacity.machines.length} máquinas`}
        />
        <MetricSmall
          label="Capacidade semanal"
          value={`${capacity.weeklyCapacityH}h`}
          hint="5 dias úteis"
        />
        <MetricSmall
          label="Capacidade mensal"
          value={`${capacity.monthlyCapacityH}h`}
          hint="22 dias úteis"
        />
        <MetricSmall
          label="Demanda atual"
          value={`${capacity.demandH}h`}
          hint={`utilização ${capacity.utilizationPct}%`}
        />
        <MetricSmall label="Operadores" value={`${capacity.operators.length}`} hint="ativos" />
        <MetricSmall
          label="Dias p/ concluir"
          value={`${capacity.daysToComplete}`}
          hint="ao ritmo atual"
        />
        <MetricSmall label="Máquinas" value={`${capacity.machines.length}`} hint="catálogo" />
      </div>

      <div>
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Balanceamento de máquinas
        </div>
        <DataTable
          columns={
            [
              { id: "m", header: "Máquina", cell: (r) => r.label },
              {
                id: "k",
                header: "Tipo",
                cell: (r) => <span className="text-muted-foreground text-xs">{r.kind}</span>,
              },
              {
                id: "l",
                header: "Carga (min)",
                cell: (r) => <span className="tabular-nums">{r.loadMinutes}</span>,
                align: "right",
              },
              {
                id: "c",
                header: "Capacidade (min)",
                cell: (r) => <span className="tabular-nums">{r.capacityMinutes}</span>,
                align: "right",
              },
              {
                id: "u",
                header: "Utilização",
                cell: (r) => (
                  <StatusBadge
                    tone={
                      r.status === "sobrecarregada"
                        ? "danger"
                        : r.status === "atenção"
                          ? "warning"
                          : r.status === "ociosa"
                            ? "neutral"
                            : "success"
                    }
                  >
                    {r.utilizationPct}%
                  </StatusBadge>
                ),
              },
            ] satisfies DataTableColumn<MachineLoad>[]
          }
          data={[...balance]}
          getRowKey={(r) => r.machineId}
        />
      </div>
    </div>
  );
}

function MetricSmall({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

// ─── Roteiro por módulo ────────────────────────────────────────

function RoutingSub({ routings }: { routings: readonly RoutingPlan[] }) {
  if (routings.length === 0)
    return <EmptyState title="Sem roteiro" description="Nenhum módulo com peças no projeto." />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {routings.map((r) => (
        <div key={r.moduleId} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{r.moduleLabel}</div>
            <StatusBadge tone="info">{Math.round(r.totalMinutes / 60)}h</StatusBadge>
          </div>
          <ol className="mt-2 space-y-1 text-xs">
            {r.steps.map((s) => (
              <li key={s.stage} className="flex items-center justify-between text-muted-foreground">
                <span>
                  {s.order}. {s.label}
                </span>
                <span className="tabular-nums">{s.minutes}min</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

// ─── Operadores ────────────────────────────────────────────────

function OperatorsSub({ assignments }: { assignments: readonly OperatorAssignment[] }) {
  if (assignments.length === 0)
    return <EmptyState title="Sem alocação" description="Nenhum operador com skill compatível." />;
  return (
    <DataTable
      columns={
        [
          { id: "stage", header: "Etapa", cell: (r) => r.stage },
          { id: "op", header: "Operador ideal", cell: (r) => r.operatorName },
          {
            id: "load",
            header: "Carga",
            cell: (r) => <span className="tabular-nums">{r.loadH}h</span>,
            align: "right",
          },
          {
            id: "why",
            header: "Motivo",
            cell: (r) => <span className="text-xs text-muted-foreground">{r.reason}</span>,
          },
        ] satisfies DataTableColumn<OperatorAssignment>[]
      }
      data={[...assignments]}
      getRowKey={(r) => `${r.stage}-${r.operatorId}`}
    />
  );
}

// ─── Qualidade ─────────────────────────────────────────────────

function QualitySub({
  checks,
  totalChecks,
  criticalChecks,
  reworkRatePct,
  defectRatePct,
}: {
  checks: readonly QualityCheck[];
  totalChecks: number;
  criticalChecks: number;
  reworkRatePct: number;
  defectRatePct: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricSmall
          label="Total de checks"
          value={`${totalChecks}`}
          hint={`${criticalChecks} críticos`}
        />
        <MetricSmall label="Retrabalho" value={`${reworkRatePct}%`} hint="média histórica" />
        <MetricSmall label="Defeitos" value={`${defectRatePct}%`} hint="rejeição estimada" />
        <MetricSmall label="Cobertura" value="100%" hint="checklist automático" />
      </div>
      <DataTable
        columns={
          [
            { id: "kind", header: "Tipo", cell: (r) => r.kind },
            { id: "title", header: "Checagem", cell: (r) => r.title },
            {
              id: "sev",
              header: "Severidade",
              cell: (r) => (
                <StatusBadge
                  tone={
                    r.severity === "critical"
                      ? "danger"
                      : r.severity === "warn"
                        ? "warning"
                        : "info"
                  }
                >
                  {r.severity}
                </StatusBadge>
              ),
            },
            {
              id: "req",
              header: "Obrigatório",
              cell: (r) => (
                <span className="text-xs text-muted-foreground">{r.required ? "sim" : "não"}</span>
              ),
            },
            {
              id: "desc",
              header: "Descrição",
              cell: (r) => <span className="text-xs text-muted-foreground">{r.description}</span>,
            },
          ] satisfies DataTableColumn<QualityCheck>[]
        }
        data={[...checks]}
        getRowKey={(r) => r.id}
      />
    </div>
  );
}

// ─── Entrega ───────────────────────────────────────────────────

function DeliverySub({
  delivery,
}: {
  delivery: NonNullable<ReturnType<typeof useIntelligence>["delivery"]>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <MetricSmall
        label="Horas totais"
        value={`${delivery.totalHours}h`}
        hint={`${delivery.totalMinutes} min`}
      />
      <MetricSmall
        label="Dias úteis"
        value={`${delivery.effectiveDays}d`}
        hint={`buffer +${delivery.bufferDays}d`}
      />
      <MetricSmall
        label="Previsão"
        value={new Date(delivery.finishDate).toLocaleDateString("pt-BR")}
        hint={`confiança ${delivery.confidence}`}
      />
      <MetricSmall
        label="No prazo"
        value={delivery.onTime ? "sim" : "revisar"}
        hint="vs. ETA cadastrado"
      />
    </div>
  );
}

// ─── Alertas ───────────────────────────────────────────────────

function AlertsSub({
  alerts,
  suggestions,
}: {
  alerts: readonly FactoryAlert[];
  suggestions: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 md:grid-cols-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={cn(
              "rounded-lg border p-3",
              a.level === "critical"
                ? "border-red-500/40 bg-red-500/5"
                : a.level === "warning"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-border bg-card",
            )}
          >
            <div className="flex items-center gap-2">
              <StatusBadge
                tone={
                  a.level === "critical" ? "danger" : a.level === "warning" ? "warning" : "info"
                }
              >
                {a.level}
              </StatusBadge>
              <div className="text-sm font-semibold">{a.title}</div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{a.message}</div>
          </div>
        ))}
      </div>
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="text-xs uppercase tracking-widest text-primary">Sugestões da IA</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── IA ────────────────────────────────────────────────────────

function AiSub({
  intents,
  ask,
}: {
  intents: readonly FactoryIntent[];
  ask: (p: string) => FactoryIntent | null;
}) {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {intents.map((i) => (
          <button
            key={i.id}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            onClick={() => {
              setPrompt(i.question);
              setAnswer(i.answer);
            }}
          >
            {i.question}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex.: qual é o gargalo? quando termina? quanto falta?"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <Button
          onClick={() => {
            const hit = ask(prompt);
            setAnswer(hit ? hit.answer : "Não entendi. Tente uma das perguntas sugeridas acima.");
          }}
        >
          Perguntar
        </Button>
      </div>
      {answer && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{answer}</div>
      )}
    </div>
  );
}
