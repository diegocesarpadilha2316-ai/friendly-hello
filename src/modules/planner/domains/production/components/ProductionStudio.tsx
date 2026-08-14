import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  EmptyState,
  MetricCard,
  SearchInput,
  StatusBadge,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useProduction } from "../hooks/use-production";
import { FabricationPanel } from "./FabricationPanel";
import { IndustrialPanel } from "./IndustrialPanel";
import { FactoryPanel } from "./FactoryPanel";
import { PlanningPanel } from "./PlanningPanel";
import { IndustrialFinalPanel } from "../integration/components/IndustrialFinalPanel";
import {
  CNC_MACHINES,
  ERP_PROVIDERS,
  PRODUCTION_AI_COMMANDS,
  PRODUCTION_EXPORTS,
  PRODUCTION_STAGES,
  matchProductionCommand,
  previewCncJobs,
  serializeCutListCsv,
  toDxfStub,
  toGcodeStub,
} from "../services";
import type {
  BudgetLine,
  CncTargetMachine,
  CuttingBoard,
  CutListRow,
  ErpProvider,
  HardwareBomRow,
  PartLabel,
  ProductionExportFormat,
  ProductionOrder,
  ProductionPart,
} from "../types";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "pecas", label: "Peças" },
  { id: "corte", label: "Lista de Corte" },
  { id: "plano", label: "Plano de Corte" },
  { id: "ferragens", label: "Ferragens" },
  { id: "orcamento", label: "Orçamento" },
  { id: "tempo", label: "Tempo" },
  { id: "producao", label: "Produção" },
  { id: "etiquetas", label: "Etiquetas" },
  { id: "cnc", label: "CNC" },
  { id: "fabricacao", label: "Fabricação" },
  { id: "industrial", label: "Industrial" },
  { id: "fabrica", label: "Fábrica 4.0" },
  { id: "pcp", label: "PCP / MRP" },
  { id: "final", label: "Industrial Final" },
  { id: "erp", label: "ERP" },
  { id: "exportar", label: "Exportar" },
  { id: "ia", label: "IA" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtNum(v: number, digits = 2): string {
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function ProductionStudio() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [query, setQuery] = useState("");
  const [machineId, setMachineId] = useState<string>(CNC_MACHINES[0].id);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTrace, setAiTrace] = useState<{ label: string; hint: string } | null>(null);
  const { report, orders, hasProject, isEmpty, projectName, clientName } = useProduction();

  const partsFiltered = useMemo(() => {
    if (!report) return [] as ProductionPart[];
    const q = query.trim().toLowerCase();
    if (!q) return [...report.parts];
    return report.parts.filter((p) =>
      [p.label, p.material, p.finish, p.furnitureLabel, p.roomLabel, p.category].some((f) =>
        f.toLowerCase().includes(q),
      ),
    );
  }, [report, query]);

  const cutListFiltered = useMemo(() => {
    if (!report) return [] as CutListRow[];
    const q = query.trim().toLowerCase();
    if (!q) return [...report.cutList];
    return report.cutList.filter((r) =>
      [r.code, r.name, r.material, r.brand].some((f) => f.toLowerCase().includes(q)),
    );
  }, [report, query]);

  if (!hasProject) {
    return (
      <EmptyState
        title="Abra um projeto do Planner"
        description="A Produção Inteligente lê o projeto ativo. Selecione um projeto em /planner/projetos para gerar peças, corte, ferragens e orçamento."
      />
    );
  }
  if (isEmpty || !report) {
    return (
      <EmptyState
        title="Projeto sem móveis"
        description="Insira ao menos um móvel do catálogo no editor 2D — as peças serão geradas automaticamente pela engenharia paramétrica."
      />
    );
  }

  const runAi = () => {
    const cmd = matchProductionCommand(aiPrompt);
    if (cmd) {
      setAiTrace({ label: cmd.label, hint: cmd.description });
      if (cmd.id === "producao.lista-corte") setTab("corte");
      else if (cmd.id === "producao.plano-corte") setTab("plano");
      else if (cmd.id === "producao.orcamento") setTab("orcamento");
      else if (cmd.id === "producao.etiquetas") setTab("etiquetas");
      else if (cmd.id === "producao.cnc") setTab("cnc");
      else setTab("dashboard");
    } else {
      setAiTrace({
        label: "Comando não reconhecido",
        hint: "Tente: gerar lista de corte, plano, orçamento, etiquetas, CNC.",
      });
    }
  };

  const downloadFile = async (format: ProductionExportFormat) => {
    let content = "";
    let mime = "text/plain";
    let ext: string = format;
    let blob: Blob | null = null;
    if (format === "csv") {
      content = serializeCutListCsv(report.cutList);
      mime = "text/csv";
    } else if (format === "json") {
      content = JSON.stringify(report, null, 2);
      mime = "application/json";
    } else if (format === "xml") {
      content = `<?xml version="1.0"?>\n<dioris-production project="${projectName}">\n${report.cutList
        .map(
          (r) =>
            `  <part code="${r.code}" material="${r.material}" length="${r.lengthMm}" width="${r.widthMm}" qty="${r.qty}"/>`,
        )
        .join("\n")}\n</dioris-production>\n`;
      mime = "application/xml";
    } else if (format === "excel") {
      content = serializeCutListCsv(report.cutList);
      mime = "text/csv";
      ext = "csv";
    } else if (format === "pdf") {
      const { buildProductionPdf } = await import("../services/pdf");
      blob = await buildProductionPdf({ projectName, clientName, report });
      mime = "application/pdf";
      ext = "pdf";
    }
    if (!blob) blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dioris-producao-${projectName.replace(/\s+/g, "-").toLowerCase()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header do Studio */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Production Studio · Dioris
          </div>
          <div className="text-lg font-semibold">{projectName}</div>
          <div className="text-xs text-muted-foreground">
            Cliente: {clientName} · {report.totals.modules} módulos · {report.totals.parts} peças
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="info">Corte: {report.time.cuttingH}h</StatusBadge>
          <StatusBadge tone="info">Montagem: {report.time.assemblyH}h</StatusBadge>
          <StatusBadge tone="success">{fmtBRL(report.budget.summary.final)}</StatusBadge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
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

      {(tab === "pecas" || tab === "corte" || tab === "etiquetas") && (
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "pecas"
              ? "Buscar peça, material, ambiente…"
              : tab === "corte"
                ? "Buscar código, nome, material…"
                : "Buscar etiqueta ou peça…"
          }
        />
      )}

      {tab === "dashboard" && <DashboardPanel report={report} />}
      {tab === "pecas" && <PartsPanel parts={partsFiltered} />}
      {tab === "corte" && <CutListPanel rows={cutListFiltered} />}
      {tab === "plano" && (
        <CuttingPlanPanel boards={report.cuttingPlan.boards} totals={report.cuttingPlan.totals} />
      )}
      {tab === "ferragens" && <HardwarePanel rows={report.hardware} />}
      {tab === "orcamento" && <BudgetPanel budget={report.budget} />}
      {tab === "tempo" && <TimePanel time={report.time} />}
      {tab === "producao" && <ProductionFlowPanel orders={orders} />}
      {tab === "etiquetas" && (
        <LabelsPanel
          labels={report.labels.filter(
            (l) =>
              !query ||
              l.code.toLowerCase().includes(query.toLowerCase()) ||
              l.moduleLabel.toLowerCase().includes(query.toLowerCase()),
          )}
        />
      )}
      {tab === "cnc" && (
        <CncPanel cutList={report.cutList} machineId={machineId} onMachineChange={setMachineId} />
      )}
      {tab === "fabricacao" && <FabricationPanel />}
      {tab === "industrial" && <IndustrialPanel />}
      {tab === "fabrica" && <FactoryPanel />}
      {tab === "pcp" && <PlanningPanel />}
      {tab === "final" && <IndustrialFinalPanel />}
      {tab === "erp" && <ErpPanel />}
      {tab === "exportar" && <ExportPanel onDownload={downloadFile} />}
      {tab === "ia" && (
        <AiPanel prompt={aiPrompt} onPromptChange={setAiPrompt} onRun={runAi} trace={aiTrace} />
      )}
    </div>
  );
}

function DashboardPanel({
  report,
}: {
  report: NonNullable<ReturnType<typeof useProduction>["report"]>;
}) {
  const usagePct = Math.round(report.cuttingPlan.totals.avgUsageRatio * 100);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <MetricCard label="Módulos" value={report.totals.modules} hint="itens do projeto" />
      <MetricCard label="Peças" value={report.totals.parts} hint="unidades a produzir" />
      <MetricCard
        label="Chapas"
        value={report.cuttingPlan.totals.boardsCount}
        hint={`≈ ${fmtNum(report.totals.boardsM2)} m²`}
      />
      <MetricCard
        label="Aproveitamento"
        value={`${usagePct}%`}
        hint={`sobra ${fmtNum(report.cuttingPlan.totals.wasteAreaM2)} m²`}
        trend={{
          value: usagePct >= 75 ? "ok" : "revisar",
          direction: usagePct >= 75 ? "up" : "down",
        }}
      />
      <MetricCard
        label="Fita de borda"
        value={`${fmtNum(report.totals.edgeMeters)} m`}
        hint="total linear"
      />
      <MetricCard
        label="Peso estimado"
        value={`${fmtNum(report.totals.weightKg)} kg`}
        hint="chapas + partes"
      />
      <MetricCard
        label="Tempo total"
        value={`${report.time.totalH} h`}
        hint={`corte ${report.time.cuttingH}h · mont. ${report.time.assemblyH}h`}
      />
      <MetricCard
        label="Preço final"
        value={fmtBRL(report.budget.summary.final)}
        hint={`${fmtBRL(report.budget.summary.perM2)}/m² · margem ${report.budget.parameters.marginPct}%`}
        trend={{ value: "orçado", direction: "up" }}
      />
    </div>
  );
}

function PartsPanel({ parts }: { parts: readonly ProductionPart[] }) {
  const columns: DataTableColumn<ProductionPart>[] = [
    {
      id: "cat",
      header: "Categoria",
      cell: (p) => <StatusBadge tone="neutral">{p.category}</StatusBadge>,
    },
    {
      id: "label",
      header: "Peça",
      cell: (p) => (
        <div>
          <div className="font-medium">{p.label}</div>
          <div className="text-xs text-muted-foreground">
            {p.furnitureLabel} · {p.roomLabel}
          </div>
        </div>
      ),
    },
    {
      id: "dim",
      header: "Dimensão",
      cell: (p) => (
        <span className="tabular-nums">
          {p.widthMm} × {p.heightMm} × {p.thicknessMm}
        </span>
      ),
      align: "right",
    },
    {
      id: "qty",
      header: "Qtd",
      cell: (p) => <span className="tabular-nums">{p.qty}</span>,
      align: "right",
    },
    { id: "mat", header: "Material", cell: (p) => <span className="text-xs">{p.material}</span> },
    {
      id: "peso",
      header: "Peso (kg)",
      cell: (p) => <span className="tabular-nums">{fmtNum(p.weightKg * p.qty)}</span>,
      align: "right",
    },
  ];
  return <DataTable columns={columns} data={[...parts]} getRowKey={(p) => p.id} />;
}

function CutListPanel({ rows }: { rows: readonly CutListRow[] }) {
  const columns: DataTableColumn<CutListRow>[] = [
    {
      id: "code",
      header: "Código",
      cell: (r) => <span className="font-mono text-xs">{r.code}</span>,
    },
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "mat", header: "Material", cell: (r) => <span className="text-xs">{r.material}</span> },
    {
      id: "esp",
      header: "Esp.",
      cell: (r) => <span className="tabular-nums">{r.thicknessMm} mm</span>,
      align: "right",
    },
    {
      id: "dim",
      header: "Compr × Larg",
      cell: (r) => (
        <span className="tabular-nums">
          {r.lengthMm} × {r.widthMm}
        </span>
      ),
      align: "right",
    },
    {
      id: "qty",
      header: "Qtd",
      cell: (r) => <span className="tabular-nums">{r.qty}</span>,
      align: "right",
    },
    { id: "veio", header: "Veio", cell: (r) => r.grain },
    { id: "fita", header: "Fita", cell: (r) => <span className="text-xs">{r.edgeTape}</span> },
    {
      id: "area",
      header: "Área (m²)",
      cell: (r) => <span className="tabular-nums">{fmtNum(r.areaM2, 3)}</span>,
      align: "right",
    },
  ];
  return <DataTable columns={columns} data={[...rows]} getRowKey={(r) => r.code} />;
}

function CuttingPlanPanel({
  boards,
  totals,
}: {
  boards: readonly CuttingBoard[];
  totals: { boardsCount: number; usedAreaM2: number; wasteAreaM2: number; avgUsageRatio: number };
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Chapas" value={totals.boardsCount} hint="2750 × 1850 mm" />
        <MetricCard
          label="Área usada"
          value={`${fmtNum(totals.usedAreaM2)} m²`}
          hint="soma das peças"
        />
        <MetricCard
          label="Sobra"
          value={`${fmtNum(totals.wasteAreaM2)} m²`}
          hint="desperdício previsto"
        />
        <MetricCard
          label="Aproveitamento médio"
          value={`${Math.round(totals.avgUsageRatio * 100)}%`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {boards.map((board) => (
          <div key={board.index} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Chapa #{board.index}</span>
              <StatusBadge tone={board.usageRatio >= 0.75 ? "success" : "warning"}>
                {Math.round(board.usageRatio * 100)}%
              </StatusBadge>
            </div>
            <svg
              viewBox={`0 0 ${board.spec.lengthMm} ${board.spec.widthMm}`}
              className="h-40 w-full rounded bg-muted/50"
            >
              <rect
                x={0}
                y={0}
                width={board.spec.lengthMm}
                height={board.spec.widthMm}
                fill="hsl(var(--muted))"
              />
              {board.placements.map((pl, i) => (
                <g key={i}>
                  <rect
                    x={pl.x}
                    y={pl.y}
                    width={pl.w}
                    height={pl.h}
                    fill="hsl(var(--primary) / 0.35)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <text
                    x={pl.x + 12}
                    y={pl.y + 40}
                    fontSize={36}
                    fill="hsl(var(--primary-foreground))"
                  >
                    {pl.code}
                  </text>
                </g>
              ))}
            </svg>
            <div className="mt-2 text-xs text-muted-foreground">
              {board.spec.brand} · {board.spec.material} · usado {fmtNum(board.usedM2)} m² · sobra{" "}
              {fmtNum(board.wasteM2)} m²
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HardwarePanel({ rows }: { rows: readonly HardwareBomRow[] }) {
  const total = rows.reduce((acc, r) => acc + r.total, 0);
  const columns: DataTableColumn<HardwareBomRow>[] = [
    { id: "kind", header: "Tipo", cell: (r) => <StatusBadge tone="info">{r.kind}</StatusBadge> },
    { id: "brand", header: "Marca", cell: (r) => r.brand },
    {
      id: "label",
      header: "Descrição",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.label}</div>
          <div className="text-xs text-muted-foreground">{r.code}</div>
        </div>
      ),
    },
    {
      id: "qty",
      header: "Qtd",
      cell: (r) => (
        <span className="tabular-nums">
          {r.qty} {r.unit}
        </span>
      ),
      align: "right",
    },
    {
      id: "unit",
      header: "Unit.",
      cell: (r) => <span className="tabular-nums">{fmtBRL(r.unitPrice)}</span>,
      align: "right",
    },
    {
      id: "total",
      header: "Total",
      cell: (r) => <span className="tabular-nums font-medium">{fmtBRL(r.total)}</span>,
      align: "right",
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <DataTable columns={columns} data={[...rows]} getRowKey={(r) => `${r.kind}-${r.code}`} />
      <div className="flex justify-end text-sm">
        <span className="text-muted-foreground">Total ferragens:&nbsp;</span>
        <span className="font-semibold">{fmtBRL(total)}</span>
      </div>
    </div>
  );
}

function BudgetPanel({
  budget,
}: {
  budget: NonNullable<ReturnType<typeof useProduction>["report"]>["budget"];
}) {
  const columns: DataTableColumn<BudgetLine>[] = [
    {
      id: "group",
      header: "Grupo",
      cell: (l) => <StatusBadge tone="neutral">{l.group}</StatusBadge>,
    },
    { id: "label", header: "Descrição", cell: (l) => l.label },
    {
      id: "qty",
      header: "Qtd",
      cell: (l) => (
        <span className="tabular-nums">
          {l.qty} {l.unit}
        </span>
      ),
      align: "right",
    },
    {
      id: "unit",
      header: "Unit.",
      cell: (l) => <span className="tabular-nums">{fmtBRL(l.unitPrice)}</span>,
      align: "right",
    },
    {
      id: "total",
      header: "Total",
      cell: (l) => <span className="tabular-nums font-medium">{fmtBRL(l.total)}</span>,
      align: "right",
    },
  ];
  const s = budget.summary;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <DataTable columns={columns} data={[...budget.lines]} getRowKey={(l) => l.id} />
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
        <SummaryRow label="Subtotal" value={fmtBRL(s.subtotal)} />
        <SummaryRow
          label={`Overhead ${budget.parameters.overheadPct}%`}
          value={fmtBRL(s.overhead)}
        />
        <SummaryRow label={`Margem ${budget.parameters.marginPct}%`} value={fmtBRL(s.margin)} />
        <SummaryRow label={`Impostos ${budget.parameters.taxPct}%`} value={fmtBRL(s.taxes)} />
        <div className="my-2 h-px bg-border" />
        <SummaryRow label="Total final" value={fmtBRL(s.final)} strong />
        <SummaryRow label="R$ / m² faturado" value={fmtBRL(s.perM2)} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={cn("text-muted-foreground", strong && "font-semibold text-foreground")}>
        {label}
      </span>
      <span className={cn("tabular-nums", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

function TimePanel({
  time,
}: {
  time: NonNullable<ReturnType<typeof useProduction>["report"]>["time"];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <MetricCard label="Corte" value={`${time.cuttingH} h`} hint="seccionadora" />
      <MetricCard label="Usinagem" value={`${time.machiningH} h`} hint="furadeira + coladeira" />
      <MetricCard label="Montagem" value={`${time.assemblyH} h`} hint="pré-montagem" />
      <MetricCard label="Acabamento" value={`${time.finishingH} h`} hint="lacca + polish" />
      <MetricCard
        label="Total"
        value={`${time.totalH} h`}
        hint="linha de produção"
        trend={{ value: "estimado", direction: "up" }}
      />
    </div>
  );
}

function ProductionFlowPanel({ orders }: { orders: readonly ProductionOrder[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 md:grid-cols-7">
        {PRODUCTION_STAGES.map((stage) => (
          <div key={stage.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
              <span className="text-sm font-medium">{stage.label}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{stage.description}</div>
          </div>
        ))}
      </div>
      <DataTable
        columns={
          [
            {
              id: "code",
              header: "OP",
              cell: (o) => <span className="font-mono text-xs">{o.code}</span>,
            },
            { id: "cli", header: "Cliente", cell: (o) => o.clientName },
            {
              id: "stage",
              header: "Etapa",
              cell: (o) => <StatusBadge tone="info">{o.stage}</StatusBadge>,
            },
            {
              id: "parts",
              header: "Peças",
              cell: (o) => <span className="tabular-nums">{o.parts}</span>,
              align: "right",
            },
            {
              id: "prog",
              header: "Progresso",
              cell: (o) => (
                <div className="w-32">
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${o.progress}%` }}
                    />
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{o.progress}%</div>
                </div>
              ),
            },
            { id: "eta", header: "ETA", cell: (o) => new Date(o.eta).toLocaleDateString("pt-BR") },
          ] satisfies DataTableColumn<ProductionOrder>[]
        }
        data={[...orders]}
        getRowKey={(o) => o.id}
      />
    </div>
  );
}

function LabelsPanel({ labels }: { labels: readonly PartLabel[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {labels.slice(0, 60).map((l) => (
        <div key={l.code} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
            <span>Dioris · Etiqueta</span>
            <StatusBadge tone="neutral">{l.position}</StatusBadge>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="grid grid-cols-8 gap-[1px] rounded border border-border p-1"
              aria-hidden
            >
              {Array.from({ length: 64 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 w-2",
                    (l.code.charCodeAt(i % l.code.length) + i) % 3 === 0
                      ? "bg-foreground"
                      : "bg-transparent",
                  )}
                />
              ))}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {l.moduleLabel} · {l.partLabel}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {l.projectName} · {l.roomLabel}
              </div>
              <div className="mt-1 truncate text-xs">{l.dimensions}</div>
              <div className="mt-1 flex gap-2">
                <span className="font-mono text-[11px]">{l.code}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  |||{l.barcodePayload}|||
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CncPanel({
  cutList,
  machineId,
  onMachineChange,
}: {
  cutList: readonly CutListRow[];
  machineId: string;
  onMachineChange: (id: string) => void;
}) {
  const jobs = previewCncJobs(cutList, machineId);
  const first = cutList[0];
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Máquinas alvo</div>
        {CNC_MACHINES.map((m) => (
          <button
            key={m.id}
            onClick={() => onMachineChange(m.id)}
            className={cn(
              "flex flex-col items-start rounded-md border px-3 py-2 text-left text-sm transition-colors",
              machineId === m.id ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
            )}
          >
            <span className="font-medium">
              {m.brand} {m.model}
            </span>
            <span className="text-xs text-muted-foreground">
              {m.kind} · {m.formats.join(" / ")}
            </span>
            <StatusBadge tone={m.status === "beta" ? "warning" : "neutral"} className="mt-1">
              {m.status}
            </StatusBadge>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <DataTable
          columns={
            [
              {
                id: "code",
                header: "Peça",
                cell: (j) => <span className="font-mono text-xs">{j.code}</span>,
              },
              {
                id: "fmt",
                header: "Formato",
                cell: (j) => <StatusBadge tone="info">{j.format}</StatusBadge>,
              },
              {
                id: "ops",
                header: "Operações",
                cell: (j) => (
                  <span className="text-xs text-muted-foreground">{j.operations.join(" › ")}</span>
                ),
              },
              {
                id: "t",
                header: "Tempo (min)",
                cell: (j) => <span className="tabular-nums">{j.estimatedMinutes}</span>,
                align: "right",
              },
            ] satisfies DataTableColumn<(typeof jobs)[number]>[]
          }
          data={[...jobs]}
          getRowKey={(j) => j.code}
        />
        {first && (
          <div className="grid gap-3 md:grid-cols-2">
            <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px]">
              <code>{toGcodeStub(first)}</code>
            </pre>
            <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px]">
              <code>{toDxfStub(first)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function ErpPanel() {
  const columns: DataTableColumn<ErpProvider>[] = [
    {
      id: "label",
      header: "ERP",
      cell: (p) => (
        <div>
          <div className="font-medium">{p.label}</div>
          <div className="text-xs text-muted-foreground">{p.category}</div>
        </div>
      ),
    },
    {
      id: "scopes",
      header: "Escopos",
      cell: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.scopes.map((s) => (
            <StatusBadge key={s} tone="neutral">
              {s}
            </StatusBadge>
          ))}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (p) => (
        <StatusBadge tone={p.status === "beta" ? "warning" : "info"}>{p.status}</StatusBadge>
      ),
    },
    {
      id: "action",
      header: "Ação",
      cell: () => (
        <Button size="sm" variant="outline" disabled>
          Preparar integração
        </Button>
      ),
      align: "right",
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Interfaces preparadas para ERP nacional (Tiny, Bling, Omie, Conta Azul) e enterprise (SAP,
        TOTVS). Integração real será liberada em fase futura.
      </div>
      <DataTable
        columns={columns}
        data={[...(ERP_PROVIDERS as CncTargetMachine[] & ErpProvider[])]}
        getRowKey={(p) => (p as ErpProvider).id}
      />
    </div>
  );
}

function ExportPanel({ onDownload }: { onDownload: (format: ProductionExportFormat) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {PRODUCTION_EXPORTS.map((exp) => (
        <div
          key={exp.format}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{exp.label}</div>
            <StatusBadge tone="info">.{exp.extension}</StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground">{exp.description}</p>
          <Button size="sm" onClick={() => onDownload(exp.format)}>
            Baixar
          </Button>
        </div>
      ))}
    </div>
  );
}

function AiPanel({
  prompt,
  onPromptChange,
  onRun,
  trace,
}: {
  prompt: string;
  onPromptChange: (v: string) => void;
  onRun: () => void;
  trace: { label: string; hint: string } | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold">Assistente de Produção</div>
        <p className="text-xs text-muted-foreground">
          Descreva o que deseja em linguagem natural — a IA identifica o comando e abre o painel
          correspondente. Nenhuma nova store: o próprio Studio executa a ação.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={4}
          placeholder="Ex.: gere o plano de corte deste projeto"
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex justify-end">
          <Button onClick={onRun}>Interpretar</Button>
        </div>
        {trace && (
          <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
            <div className="font-medium">→ {trace.label}</div>
            <div className="text-muted-foreground">{trace.hint}</div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Comandos preparados
        </div>
        {PRODUCTION_AI_COMMANDS.map((c) => (
          <div key={c.id} className="rounded-md border border-border p-2 text-xs">
            <div className="font-medium">{c.label}</div>
            <div className="text-muted-foreground">{c.description}</div>
            <div className="mt-1 font-mono text-[11px] text-primary">“{c.hint}”</div>
          </div>
        ))}
      </div>
    </div>
  );
}
