import { useState } from "react";
import {
  Button,
  DataTable,
  MetricCard,
  StatusBadge,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { usePlanning } from "../hooks/use-planning";
import type {
  PlanningOrder,
  MrpItem,
  ScheduleEntry,
  DeliveryEstimate,
  SequencingStrategy,
  PlanningReportRow,
  CalendarDay,
  PlanningResource,
} from "../services/planning";
import { reportToCsv, reportToExcelXml, reportToPdfText } from "../services/planning";

const SUB_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "pedidos", label: "Pedidos" },
  { id: "pcp", label: "PCP" },
  { id: "mrp", label: "MRP" },
  { id: "capacidade", label: "Capacidade" },
  { id: "calendario", label: "Calendário" },
  { id: "recursos", label: "Recursos" },
  { id: "cronograma", label: "Cronograma" },
  { id: "relatorios", label: "Relatórios" },
  { id: "ia", label: "IA" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["id"];

const STRATEGIES: readonly { id: SequencingStrategy; label: string }[] = [
  { id: "ia", label: "IA (recomendado)" },
  { id: "fifo", label: "FIFO" },
  { id: "lifo", label: "LIFO" },
  { id: "urgencia", label: "Urgência" },
  { id: "prazo", label: "Prazo" },
  { id: "menor-tempo", label: "Menor tempo" },
  { id: "maior-tempo", label: "Maior tempo" },
  { id: "menor-desperdicio", label: "Menor desperdício" },
];

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PlanningPanel() {
  const p = usePlanning();
  const [tab, setTab] = useState<SubTab>("dashboard");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab p={p} />}
      {tab === "pedidos" && <OrdersTab orders={p.orders} />}
      {tab === "pcp" && <PcpTab p={p} />}
      {tab === "mrp" && <MrpTab items={p.mrp.items} total={p.mrp.totalCost} />}
      {tab === "capacidade" && <CapacityTab p={p} />}
      {tab === "calendario" && <CalendarTab days={p.calendar} />}
      {tab === "recursos" && <ResourcesTab resources={p.resources} />}
      {tab === "cronograma" && <ScheduleTab entries={p.schedule} deliveries={p.deliveries} />}
      {tab === "relatorios" && (
        <ReportsTab rows={p.reportRows} scope={p.reportScope} onScope={p.setReportScope} />
      )}
      {tab === "ia" && <AiTab p={p} />}
    </div>
  );
}

function DashboardTab({ p }: { p: ReturnType<typeof usePlanning> }) {
  const k = p.kpis;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <MetricCard label="Pedidos" value={k.totalOrders} hint="fila total" />
      <MetricCard label="Em produção" value={k.inProgress} hint="ordens ativas" />
      <MetricCard label="Concluídos" value={k.completed} hint="prontos + entregues" />
      <MetricCard
        label="Atrasados"
        value={k.delayed}
        hint="fora do prazo"
        trend={{
          value: k.delayed > 0 ? "atenção" : "ok",
          direction: k.delayed > 0 ? "down" : "up",
        }}
      />
      <MetricCard
        label="Capacidade"
        value={`${k.capacityHours.toFixed(0)} h`}
        hint="janela semanal"
      />
      <MetricCard
        label="Utilização"
        value={`${k.utilizationPct.toFixed(0)}%`}
        hint={`${k.usedHours.toFixed(0)}h usadas`}
      />
      <MetricCard
        label="Materiais"
        value={fmtBRL(k.materialCost)}
        hint={`${p.mrp.totalItems} itens`}
      />
      <MetricCard
        label="Receita"
        value={fmtBRL(k.totalRevenue)}
        hint={`${k.atRiskOrders} em risco`}
      />
    </div>
  );
}

function OrdersTab({ orders }: { orders: readonly PlanningOrder[] }) {
  const columns: DataTableColumn<PlanningOrder>[] = [
    { id: "code", header: "OP", cell: (o) => <span className="font-mono text-xs">{o.code}</span> },
    { id: "cli", header: "Cliente", cell: (o) => o.clientName },
    {
      id: "urg",
      header: "Urgência",
      cell: (o) => (
        <StatusBadge
          tone={o.urgency === "critica" ? "danger" : o.urgency === "alta" ? "warning" : "info"}
        >
          {o.urgency}
        </StatusBadge>
      ),
    },
    {
      id: "st",
      header: "Status",
      cell: (o) => (
        <StatusBadge
          tone={
            o.status === "atrasado"
              ? "danger"
              : o.status === "concluido" || o.status === "entregue"
                ? "success"
                : "info"
          }
        >
          {o.status}
        </StatusBadge>
      ),
    },
    {
      id: "prio",
      header: "Prioridade",
      cell: (o) => <span className="tabular-nums">{o.priority}</span>,
      align: "right",
    },
    { id: "prazo", header: "Prazo", cell: (o) => new Date(o.dueDate).toLocaleDateString("pt-BR") },
    {
      id: "prog",
      header: "Progresso",
      cell: (o) => (
        <div className="w-32">
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${o.progress}%` }} />
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{o.progress}%</div>
        </div>
      ),
    },
    {
      id: "val",
      header: "Valor",
      cell: (o) => <span className="tabular-nums">{fmtBRL(o.totalValue)}</span>,
      align: "right",
    },
  ];
  return <DataTable columns={columns} data={[...orders]} getRowKey={(o) => o.id} />;
}

function PcpTab({ p }: { p: ReturnType<typeof usePlanning> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Sequenciamento
        </span>
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            onClick={() => p.setStrategy(s.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              p.strategy === s.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Fila" value={p.pcp.orders.length} hint={`estratégia: ${p.strategy}`} />
        <MetricCard label="Gargalos" value={p.pcp.bottlenecks.length} hint="máquinas > 100%" />
        <MetricCard
          label="Operadores livres"
          value={p.pcp.freeOperators.length}
          hint="ocupação < 60%"
        />
      </div>
      <OrdersTab orders={p.pcp.orders} />
    </div>
  );
}

function MrpTab({ items, total }: { items: readonly MrpItem[]; total: number }) {
  const columns: DataTableColumn<MrpItem>[] = [
    {
      id: "cat",
      header: "Categoria",
      cell: (i) => <StatusBadge tone="neutral">{i.category}</StatusBadge>,
    },
    {
      id: "label",
      header: "Item",
      cell: (i) => (
        <div>
          <div className="font-medium">{i.label}</div>
          {i.supplierHint && <div className="text-xs text-muted-foreground">{i.supplierHint}</div>}
        </div>
      ),
    },
    {
      id: "qty",
      header: "Qtd",
      cell: (i) => (
        <span className="tabular-nums">
          {i.qty.toFixed(2)} {i.unit}
        </span>
      ),
      align: "right",
    },
    {
      id: "unit",
      header: "Unit.",
      cell: (i) => <span className="tabular-nums">{fmtBRL(i.unitPrice)}</span>,
      align: "right",
    },
    {
      id: "total",
      header: "Total",
      cell: (i) => <span className="tabular-nums font-medium">{fmtBRL(i.total)}</span>,
      align: "right",
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <DataTable columns={columns} data={[...items]} getRowKey={(i) => i.code} />
      <div className="flex justify-end text-sm">
        <span className="text-muted-foreground">Total MRP:&nbsp;</span>
        <span className="font-semibold">{fmtBRL(total)}</span>
      </div>
    </div>
  );
}

function CapacityTab({ p }: { p: ReturnType<typeof usePlanning> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Janela"
          value={`${p.capacity.availableHours.toFixed(0)}h`}
          hint={`${p.capacity.from} → ${p.capacity.to}`}
        />
        <MetricCard
          label="Utilizadas"
          value={`${p.capacity.usedHours.toFixed(0)}h`}
          hint={`${p.capacity.utilizationPct}%`}
        />
        <MetricCard
          label="Ociosidade"
          value={`${p.capacity.idleHours.toFixed(0)}h`}
          hint="folga disponível"
        />
        <MetricCard
          label="Gargalos"
          value={p.bottlenecks.length}
          hint="recursos sobrecarregados"
          trend={{
            value: p.bottlenecks.length > 0 ? "revisar" : "ok",
            direction: p.bottlenecks.length > 0 ? "down" : "up",
          }}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 text-sm font-semibold">Máquinas</div>
          {p.machineLoad.map((m) => (
            <div key={m.resourceId} className="mb-2">
              <div className="flex justify-between text-xs">
                <span>{m.label}</span>
                <span className="tabular-nums">{m.loadPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={cn("h-2 rounded-full", m.overloaded ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${Math.min(100, m.loadPct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 text-sm font-semibold">Operadores</div>
          {p.operatorLoad.map((o) => (
            <div key={o.resourceId} className="mb-2">
              <div className="flex justify-between text-xs">
                <span>{o.label}</span>
                <span className="tabular-nums">{o.loadPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={cn("h-2 rounded-full", o.free ? "bg-emerald-500" : "bg-primary")}
                  style={{ width: `${Math.min(100, o.loadPct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarTab({ days }: { days: readonly CalendarDay[] }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((d) => (
        <div
          key={d.date}
          className={cn(
            "flex flex-col rounded-md border px-2 py-1.5 text-xs",
            d.isHoliday
              ? "border-destructive/40 bg-destructive/10"
              : d.isMaintenance
                ? "border-amber-500/40 bg-amber-500/10"
                : d.isWorkday
                  ? "border-border bg-card"
                  : "border-border/40 bg-muted/40",
          )}
        >
          <span className="font-mono text-[11px]">{d.date.slice(5)}</span>
          <span className="tabular-nums text-muted-foreground">
            {d.shiftHours + d.overtimeHours}h
          </span>
          {d.label && (
            <span className="mt-0.5 truncate text-[10px] text-muted-foreground">{d.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ResourcesTab({ resources }: { resources: readonly PlanningResource[] }) {
  const columns: DataTableColumn<PlanningResource>[] = [
    { id: "kind", header: "Tipo", cell: (r) => <StatusBadge tone="info">{r.kind}</StatusBadge> },
    {
      id: "label",
      header: "Recurso",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.label}</div>
          <div className="text-xs text-muted-foreground">{r.sector}</div>
        </div>
      ),
    },
    {
      id: "hpd",
      header: "h/dia",
      cell: (r) => <span className="tabular-nums">{r.hoursPerDay}</span>,
      align: "right",
    },
    {
      id: "skills",
      header: "Habilidades",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {(r.skills ?? []).map((s) => (
            <StatusBadge key={s} tone="neutral">
              {s}
            </StatusBadge>
          ))}
        </div>
      ),
    },
    {
      id: "st",
      header: "Status",
      cell: (r) => (
        <StatusBadge
          tone={
            r.status === "ativo" ? "success" : r.status === "manutencao" ? "warning" : "neutral"
          }
        >
          {r.status}
        </StatusBadge>
      ),
    },
  ];
  return <DataTable columns={columns} data={[...resources]} getRowKey={(r) => r.id} />;
}

function ScheduleTab({
  entries,
  deliveries,
}: {
  entries: readonly ScheduleEntry[];
  deliveries: readonly DeliveryEstimate[];
}) {
  const schedCols: DataTableColumn<ScheduleEntry>[] = [
    {
      id: "seq",
      header: "#",
      cell: (e) => <span className="tabular-nums">{e.sequence + 1}</span>,
      align: "right",
    },
    {
      id: "op",
      header: "OP",
      cell: (e) => <span className="font-mono text-xs">{e.orderCode}</span>,
    },
    { id: "stage", header: "Etapa", cell: (e) => <StatusBadge tone="info">{e.stage}</StatusBadge> },
    { id: "start", header: "Início", cell: (e) => new Date(e.startAt).toLocaleString("pt-BR") },
    { id: "end", header: "Fim", cell: (e) => new Date(e.endAt).toLocaleString("pt-BR") },
    {
      id: "dur",
      header: "Duração",
      cell: (e) => <span className="tabular-nums">{e.durationH}h</span>,
      align: "right",
    },
  ];
  const delCols: DataTableColumn<DeliveryEstimate>[] = [
    {
      id: "op",
      header: "OP",
      cell: (d) => <span className="font-mono text-xs">{d.orderCode}</span>,
    },
    { id: "cli", header: "Cliente", cell: (d) => d.clientName },
    { id: "due", header: "Prazo", cell: (d) => new Date(d.dueDate).toLocaleDateString("pt-BR") },
    {
      id: "est",
      header: "Entrega",
      cell: (d) => new Date(d.estimatedDelivery).toLocaleDateString("pt-BR"),
    },
    {
      id: "delay",
      header: "Atraso",
      cell: (d) => (
        <StatusBadge tone={d.delayDays > 0 ? "danger" : "success"}>
          {d.delayDays > 0 ? `+${d.delayDays}d` : "no prazo"}
        </StatusBadge>
      ),
    },
    {
      id: "prog",
      header: "%",
      cell: (d) => <span className="tabular-nums">{d.progressPct}%</span>,
      align: "right",
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 text-sm font-semibold">Cronograma</div>
        <DataTable
          columns={schedCols}
          data={[...entries]}
          getRowKey={(e) => `${e.orderId}-${e.sequence}`}
        />
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Entregas previstas</div>
        <DataTable columns={delCols} data={[...deliveries]} getRowKey={(d) => d.orderId} />
      </div>
    </div>
  );
}

function ReportsTab({
  rows,
  scope,
  onScope,
}: {
  rows: readonly PlanningReportRow[];
  scope: "diario" | "semanal" | "mensal";
  onScope: (s: "diario" | "semanal" | "mensal") => void;
}) {
  const cols: DataTableColumn<PlanningReportRow>[] = [
    {
      id: "per",
      header: "Período",
      cell: (r) => <span className="font-mono text-xs">{r.period}</span>,
    },
    {
      id: "ord",
      header: "Pedidos",
      cell: (r) => <span className="tabular-nums">{r.orders}</span>,
      align: "right",
    },
    {
      id: "prod",
      header: "Produzidos",
      cell: (r) => <span className="tabular-nums">{r.produced}</span>,
      align: "right",
    },
    {
      id: "del",
      header: "Entregues",
      cell: (r) => <span className="tabular-nums">{r.delivered}</span>,
      align: "right",
    },
    {
      id: "atr",
      header: "Atrasados",
      cell: (r) => <span className="tabular-nums">{r.delayed}</span>,
      align: "right",
    },
    {
      id: "h",
      header: "Horas",
      cell: (r) => <span className="tabular-nums">{r.hours.toFixed(1)}h</span>,
      align: "right",
    },
    {
      id: "rev",
      header: "Receita",
      cell: (r) => <span className="tabular-nums">{fmtBRL(r.revenue)}</span>,
      align: "right",
    },
  ];

  const download = (format: "csv" | "excel" | "pdf") => {
    const content =
      format === "csv"
        ? reportToCsv(rows)
        : format === "excel"
          ? reportToExcelXml(rows)
          : reportToPdfText(rows);
    const mime =
      format === "csv" ? "text/csv" : format === "excel" ? "application/xml" : "text/plain";
    const ext = format === "excel" ? "xml" : format === "pdf" ? "txt" : "csv";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dioris-pcp-${scope}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        {(["diario", "semanal", "mensal"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onScope(s)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              scope === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => download("csv")}>
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => download("excel")}>
            Excel
          </Button>
          <Button size="sm" onClick={() => download("pdf")}>
            PDF
          </Button>
        </div>
      </div>
      <DataTable columns={cols} data={[...rows]} getRowKey={(r) => r.period} />
    </div>
  );
}

function AiTab({ p }: { p: ReturnType<typeof usePlanning> }) {
  const answers = [
    p.ai.askOverloadedMachine(p.machineLoad),
    p.ai.askFreeOperator(p.operatorLoad),
    p.ai.askDelayedOrder(p.deliveries),
    p.ai.askMdfRequirement(p.mrp),
    p.ai.askTotalCost(p.mrp),
    p.ai.askBottleneck(p.machineLoad),
    p.ai.askBestSequence(p.pcp.orders),
    p.ai.askReduceTime(p.machineLoad),
    p.ai.askReduceWaste(p.mrp),
    p.ai.askIncreaseProduction(p.machineLoad),
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {answers.map((a, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {a.question}
          </div>
          <div className="mt-1 text-sm">{a.answer}</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <StatusBadge
              tone={
                a.confidence === "alta"
                  ? "success"
                  : a.confidence === "media"
                    ? "warning"
                    : "neutral"
              }
            >
              {a.confidence}
            </StatusBadge>
            {a.refs.length > 0 && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {a.refs.join(" · ")}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
