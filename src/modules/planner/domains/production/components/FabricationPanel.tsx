import { useMemo, useState } from "react";
import {
  DataTable,
  EmptyState,
  MetricCard,
  StatusBadge,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useFabrication } from "../hooks/use-fabrication";
import {
  FABRICATION_EXPORTS,
  FABRICATION_MACHINES,
  bundlePostProcessors,
  countDrillOpsByKind,
  findIntentByQuery,
  generatePostProcessor,
  type CamFormat,
  type FabricationBoard,
  type FabricationIntent,
  type FabricationKPI,
} from "../services/fabrication";
import { useProduction } from "../hooks/use-production";

const SUBTABS = [
  { id: "kpi", label: "Dashboard" },
  { id: "otimizador", label: "Otimizador" },
  { id: "plano", label: "Plano" },
  { id: "furacao", label: "Furações" },
  { id: "cnc", label: "Pós-CNC" },
  { id: "export", label: "Exportar" },
  { id: "ia", label: "IA" },
] as const;
type SubTab = (typeof SUBTABS)[number]["id"];

function toneClass(tone: FabricationKPI["tone"]): string {
  return tone === "success"
    ? "border-emerald-500/30 bg-emerald-500/5"
    : tone === "warning"
    ? "border-amber-500/30 bg-amber-500/5"
    : tone === "info"
    ? "border-primary/30 bg-primary/5"
    : "border-border bg-card";
}

export function FabricationPanel() {
  const [sub, setSub] = useState<SubTab>("kpi");
  const [machineId, setMachineId] = useState<string>(FABRICATION_MACHINES[0].id);
  const [format, setFormat] = useState<CamFormat>("gcode");
  const [aiQuery, setAiQuery] = useState("");
  const { report } = useProduction();
  const { plan, drilling, kpis, intents, constraints, hasProject } = useFabrication();

  const aiHit = useMemo<FabricationIntent | null>(() => findIntentByQuery(intents, aiQuery), [intents, aiQuery]);
  const drillCounts = useMemo(() => countDrillOpsByKind(drilling), [drilling]);

  if (!hasProject || !plan || !report) {
    return (
      <EmptyState
        title="Fabricação aguardando projeto"
        description="A camada de fabricação lê o projeto ativo. Abra um projeto e insira móveis no editor 2D para ativar o Motor de Fabricação."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-4">
        <div className="text-xs uppercase tracking-widest text-primary">Fase 3.13 · Motor de Fabricação</div>
        <div className="text-lg font-semibold">Plano de Corte Inteligente + CNC</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Algoritmo próprio (Guillotine + Best-Fit + Rotação + Reuso de Sobra) · Kerf {constraints.kerfMm}mm · Margem {constraints.marginMm}mm · Rotação {constraints.allowRotation ? "on" : "off"}
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
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "kpi" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.id} className={cn("rounded-lg border p-3", toneClass(k.tone))}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.hint}</div>
            </div>
          ))}
        </div>
      )}

      {sub === "otimizador" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Chapas" value={plan.totals.boardsCount} hint="STANDARD 2750×1850" />
          <MetricCard label="Aproveitamento" value={`${Math.round(plan.totals.avgUsageRatio * 100)}%`} hint="médio por chapa" />
          <MetricCard label="Efetivo c/ sobra" value={`${Math.round(plan.totals.effectiveRatio * 100)}%`} hint="reuso ativo" />
          <MetricCard label="Cortes" value={plan.totals.totalCuts} hint={`grão respeitado ${plan.totals.grainRespectedPct}%`} />
          <MetricCard label="Desperdício" value={`${plan.totals.wasteAreaM2.toFixed(2)} m²`} hint="perda líquida" />
          <MetricCard label="Sobra útil" value={`${plan.totals.offcutAreaM2.toFixed(2)} m²`} hint="≥ 0,15 m²" />
          <MetricCard label="Não colocadas" value={plan.unplaced.length} hint="revise dimensões" />
          <MetricCard label="Peças" value={report.totals.parts} hint={`${report.totals.modules} módulos`} />
        </div>
      )}

      {sub === "plano" && <PlanBoards boards={plan.boards} />}

      {sub === "furacao" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(drillCounts).map(([kind, qty]) => (
              <div key={kind} className="rounded-lg border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{kind}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{qty}</div>
                <div className="text-xs text-muted-foreground">operações</div>
              </div>
            ))}
          </div>
          <DataTable
            columns={[
              { id: "code", header: "Código", cell: (s) => <span className="font-mono text-xs">{s.partCode}</span> },
              { id: "name", header: "Peça", cell: (s) => s.partName },
              { id: "holes", header: "Furos", cell: (s) => <span className="tabular-nums">{s.totalHoles}</span>, align: "right" },
              { id: "eta", header: "Tempo (s)", cell: (s) => <span className="tabular-nums">{s.estimatedSeconds}</span>, align: "right" },
            ]}
            data={[...drilling]}
            getRowKey={(s) => s.partCode}
          />
        </div>
      )}

      {sub === "cnc" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <select value={machineId} onChange={(e) => setMachineId(e.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs">
              {FABRICATION_MACHINES.map((m) => (
                <option key={m.id} value={m.id}>{m.vendor} · {m.model}</option>
              ))}
            </select>
            <select value={format} onChange={(e) => setFormat(e.target.value as CamFormat)} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs">
              {(FABRICATION_MACHINES.find((m) => m.id === machineId)?.formats ?? []).map((f) => (
                <option key={f} value={f}>{f.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {report.cutList.slice(0, 4).map((row) => {
              const pp = generatePostProcessor(row, machineId, format);
              if (!pp) return null;
              return (
                <div key={row.code} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono">{row.code}</span>
                    <StatusBadge tone="info">{pp.format.toUpperCase()} · ~{pp.estimatedMinutes}min</StatusBadge>
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted/40 p-2 font-mono text-[10px] leading-tight text-muted-foreground">
{pp.header}
{pp.body}
{pp.footer}
                  </pre>
                </div>
              );
            })}
          </div>
          <details className="rounded-lg border border-border bg-card p-3">
            <summary className="cursor-pointer text-xs text-muted-foreground">Ver bundle completo ({report.cutList.length} peças)</summary>
            <pre className="mt-2 max-h-72 overflow-auto rounded bg-muted/40 p-2 font-mono text-[10px] leading-tight text-muted-foreground">
{bundlePostProcessors(report.cutList, machineId, format)}
            </pre>
          </details>
        </div>
      )}

      {sub === "export" && (
        <div className="grid gap-3 md:grid-cols-2">
          {FABRICATION_EXPORTS.map((ex) => (
            <div key={ex.format} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div>
                <div className="text-sm font-medium">{ex.label}</div>
                <div className="text-xs text-muted-foreground">{ex.description}</div>
              </div>
              <StatusBadge tone={ex.target === "cnc" ? "warning" : ex.target === "producao" ? "success" : "info"}>
                {ex.target}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}

      {sub === "ia" && (
        <div className="flex flex-col gap-3">
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Pergunte: quanto custa, quantas chapas, desperdício, aproveitamento, tempo, material, melhorar corte…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {aiHit ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="text-[10px] uppercase tracking-widest text-primary">{aiHit.id}</div>
              <div className="mt-1 text-sm">{aiHit.answer}</div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Sugestões:</div>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {intents.map((i) => (
              <button
                key={i.id}
                onClick={() => setAiQuery(i.patterns[0] ?? i.question)}
                className="rounded-md border border-border bg-card px-3 py-2 text-left text-xs hover:border-primary/50"
              >
                <div className="font-medium">{i.question}</div>
                <div className="mt-0.5 text-muted-foreground">{i.answer}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanBoards({ boards }: { boards: readonly FabricationBoard[] }) {
  const cols: DataTableColumn<FabricationBoard>[] = [
    { id: "idx", header: "#", cell: (b) => b.index, align: "right" },
    { id: "spec", header: "Chapa", cell: (b) => <span className="text-xs">{b.spec.brand} · {b.spec.material}</span> },
    { id: "used", header: "Usado (m²)", cell: (b) => <span className="tabular-nums">{b.usedM2.toFixed(2)}</span>, align: "right" },
    { id: "waste", header: "Desperdício (m²)", cell: (b) => <span className="tabular-nums">{b.wasteM2.toFixed(2)}</span>, align: "right" },
    { id: "offcut", header: "Sobra útil", cell: (b) => <span className="tabular-nums">{b.offcuts.length}</span>, align: "right" },
    { id: "ratio", header: "Aproveit.", cell: (b) => <StatusBadge tone={b.usageRatio >= 0.75 ? "success" : "warning"}>{Math.round(b.usageRatio * 100)}%</StatusBadge> },
    { id: "cuts", header: "Cortes", cell: (b) => <span className="tabular-nums">{b.cutOrder.length}</span>, align: "right" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <DataTable columns={cols} data={[...boards]} getRowKey={(b) => `board-${b.index}`} />
      <div className="grid gap-4 md:grid-cols-2">
        {boards.map((board) => (
          <div key={board.index} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Chapa #{board.index}</span>
              <StatusBadge tone={board.usageRatio >= 0.75 ? "success" : "warning"}>
                {Math.round(board.usageRatio * 100)}%
              </StatusBadge>
            </div>
            <svg viewBox={`0 0 ${board.spec.lengthMm} ${board.spec.widthMm}`} className="h-44 w-full rounded bg-muted/40">
              <rect x={0} y={0} width={board.spec.lengthMm} height={board.spec.widthMm} fill="hsl(var(--muted))" />
              {board.offcuts.map((o, i) => (
                <rect key={`o-${i}`} x={o.x} y={o.y} width={o.w} height={o.h} fill="hsl(var(--accent) / 0.2)" stroke="hsl(var(--accent))" strokeDasharray="8 6" strokeWidth={2} />
              ))}
              {board.placements.map((pl, i) => (
                <g key={i}>
                  <rect x={pl.x} y={pl.y} width={pl.w} height={pl.h} fill="hsl(var(--primary) / 0.35)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <text x={pl.x + 14} y={pl.y + 44} fontSize={38} fill="hsl(var(--primary-foreground))">{pl.code}</text>
                  {pl.rotated && (
                    <text x={pl.x + 14} y={pl.y + 90} fontSize={28} fill="hsl(var(--accent))">↻</text>
                  )}
                </g>
              ))}
            </svg>
            <div className="mt-2 text-xs text-muted-foreground">
              Ordem de corte: {board.cutOrder.join(" → ")} · sobra útil: {board.offcuts.length} peça(s)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}