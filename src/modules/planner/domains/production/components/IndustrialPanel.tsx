/**
 * Fase 3.14 — Painel Industrial (aditivo).
 *
 * Reúne: Dashboard industrial, Inventário de Sobras, Sequência de Montagem,
 * Reotimização (antes/depois), Custo Industrial, IA de produção, Etiquetas
 * (QR/Barcode) e visualização interativa das chapas.
 *
 * 100% derivado de useProduction + useFabrication + useIndustrial.
 * Zero providers, zero stores, zero migrations.
 */
import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  EmptyState,
  MetricCard,
  StatusBadge,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useProduction } from "../hooks/use-production";
import { useFabrication } from "../hooks/use-fabrication";
import { useIndustrial } from "../hooks/use-industrial";
import {
  barcodeBars,
  pseudoQrMatrix,
  type AssemblyStep,
  type IndustrialCostRow,
  type IndustrialIntent,
  type IndustrialKPI,
  type OffcutInventoryItem,
} from "../services/industrial";
import type { PartLabel } from "../types";

const SUBTABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "chapa", label: "Visualização" },
  { id: "sobras", label: "Sobras" },
  { id: "montagem", label: "Montagem" },
  { id: "reotimizar", label: "Reotimizar" },
  { id: "custo", label: "Custo" },
  { id: "etiquetas", label: "Etiquetas" },
  { id: "ia", label: "IA" },
] as const;
type SubTab = (typeof SUBTABS)[number]["id"];

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toneClass(tone: IndustrialKPI["tone"]): string {
  return tone === "success"
    ? "border-emerald-500/30 bg-emerald-500/5"
    : tone === "warning"
      ? "border-amber-500/30 bg-amber-500/5"
      : tone === "info"
        ? "border-primary/30 bg-primary/5"
        : "border-border bg-card";
}

export function IndustrialPanel() {
  const [sub, setSub] = useState<SubTab>("dashboard");
  const { report, hasProject } = useProduction();
  const { plan } = useFabrication();
  const industrial = useIndustrial();

  if (!hasProject || !report) {
    return (
      <EmptyState
        title="Industrial aguardando projeto"
        description="Abra um projeto no Planner e insira móveis para ativar o painel Industrial."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 p-4">
        <div className="text-xs uppercase tracking-widest text-accent">
          Fase 3.14 · Produção Industrial
        </div>
        <div className="text-lg font-semibold">Nesting + CNC + Fábrica 4.0</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Camada aditiva 100% derivada — sobras, montagem, custo, IA industrial e etiquetas
          QR/Barcode.
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
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "dashboard" && <DashboardSub kpis={industrial.kpis} />}
      {sub === "chapa" && <BoardsSub plan={plan} />}
      {sub === "sobras" && (
        <OffcutsSub
          offcuts={industrial.offcuts}
          onRegister={industrial.registerOffcuts}
          onClear={industrial.clearAllOffcuts}
          onStatus={industrial.setOffcutStatus}
          onDelete={industrial.deleteOffcut}
          hasPlan={!!plan}
        />
      )}
      {sub === "montagem" && (
        <AssemblySub
          steps={industrial.assembly.steps}
          totalMinutes={industrial.assembly.totalMinutes}
        />
      )}
      {sub === "reotimizar" && (
        <ReoptimizeSub compare={industrial.compare} onRun={industrial.reoptimize} />
      )}
      {sub === "custo" && industrial.cost && (
        <CostSub
          rows={industrial.cost.rows}
          total={industrial.cost.final}
          marginPct={industrial.cost.marginPct}
          costPerM2={industrial.cost.costPerM2}
          pricePerM2={industrial.cost.pricePerM2}
        />
      )}
      {sub === "etiquetas" && <LabelsSub labels={report.labels.slice(0, 12)} />}
      {sub === "ia" && <AiSub intents={industrial.intents} ask={industrial.ask} />}
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────

function DashboardSub({ kpis }: { kpis: readonly IndustrialKPI[] }) {
  return (
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
  );
}

// ─── Visualização de chapas ─────────────────────────────────────

function BoardsSub({ plan }: { plan: ReturnType<typeof useFabrication>["plan"] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  if (!plan) {
    return (
      <EmptyState title="Sem plano de fabricação" description="Aguardando otimização das chapas." />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
          −
        </Button>
        <span className="tabular-nums text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="outline" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
          +
        </Button>
        {selected && <StatusBadge tone="info">Peça selecionada: {selected}</StatusBadge>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {plan.boards.map((board) => (
          <div
            key={board.index}
            className="overflow-hidden rounded-lg border border-border bg-card p-3"
          >
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">
                Chapa #{board.index} · {board.spec.material}
              </span>
              <StatusBadge tone={board.usageRatio >= 0.75 ? "success" : "warning"}>
                {Math.round(board.usageRatio * 100)}%
              </StatusBadge>
            </div>
            <div className="overflow-auto">
              <svg
                viewBox={`0 0 ${board.spec.lengthMm} ${board.spec.widthMm}`}
                style={{ width: `${100 * zoom}%` }}
                className="h-56 rounded bg-muted/40"
              >
                <rect
                  x={0}
                  y={0}
                  width={board.spec.lengthMm}
                  height={board.spec.widthMm}
                  fill="hsl(var(--muted))"
                />
                {board.offcuts.map((rect, i) => (
                  <rect
                    key={`o${i}`}
                    x={rect.x}
                    y={rect.y}
                    width={rect.w}
                    height={rect.h}
                    fill="hsl(var(--accent) / 0.18)"
                    stroke="hsl(var(--accent))"
                    strokeWidth={1}
                    strokeDasharray="8 6"
                  />
                ))}
                {board.placements.map((pl, i) => (
                  <g key={i} onClick={() => setSelected(pl.code)} style={{ cursor: "pointer" }}>
                    <rect
                      x={pl.x}
                      y={pl.y}
                      width={pl.w}
                      height={pl.h}
                      fill={
                        selected === pl.code
                          ? "hsl(var(--primary) / 0.55)"
                          : "hsl(var(--primary) / 0.3)"
                      }
                      stroke="hsl(var(--primary))"
                      strokeWidth={selected === pl.code ? 6 : 2}
                    />
                    <text
                      x={pl.x + 16}
                      y={pl.y + 46}
                      fontSize={36}
                      fill="hsl(var(--primary-foreground))"
                    >
                      {pl.code} {pl.rotated ? "↻" : ""}
                    </text>
                    <text
                      x={pl.x + 16}
                      y={pl.y + 92}
                      fontSize={26}
                      fill="hsl(var(--primary-foreground))"
                    >
                      {Math.round(pl.w)}×{Math.round(pl.h)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Usado {board.usedM2.toFixed(2)} m²</span>
              <span>· Sobra {board.wasteM2.toFixed(2)} m²</span>
              <span>· {board.offcuts.length} retalho(s) útil</span>
              <span>· {board.placements.length} peça(s)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sobras ─────────────────────────────────────────────────────

function OffcutsSub({
  offcuts,
  onRegister,
  onClear,
  onStatus,
  onDelete,
  hasPlan,
}: {
  offcuts: readonly OffcutInventoryItem[];
  onRegister: () => void;
  onClear: () => void;
  onStatus: (id: string, s: OffcutInventoryItem["status"]) => void;
  onDelete: (id: string) => void;
  hasPlan: boolean;
}) {
  const columns: DataTableColumn<OffcutInventoryItem>[] = [
    {
      id: "dim",
      header: "Tamanho",
      cell: (o) => (
        <span className="tabular-nums">
          {o.lengthMm}×{o.widthMm} mm
        </span>
      ),
    },
    {
      id: "esp",
      header: "Esp.",
      cell: (o) => <span className="tabular-nums">{o.thicknessMm} mm</span>,
      align: "right",
    },
    {
      id: "mat",
      header: "Material",
      cell: (o) => (
        <div>
          <div className="text-xs font-medium">{o.material}</div>
          <div className="text-[11px] text-muted-foreground">
            {o.brand} · {o.color}
          </div>
        </div>
      ),
    },
    {
      id: "area",
      header: "Área",
      cell: (o) => <span className="tabular-nums">{o.areaM2.toFixed(3)} m²</span>,
      align: "right",
    },
    {
      id: "origem",
      header: "Origem",
      cell: (o) => (
        <div className="text-xs">
          <div>{o.projectName}</div>
          <div className="text-muted-foreground">
            {new Date(o.createdAt).toLocaleDateString("pt-BR")}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (o) => (
        <select
          value={o.status}
          onChange={(e) => onStatus(o.id, e.target.value as OffcutInventoryItem["status"])}
          className="rounded border border-border bg-background px-1 py-0.5 text-xs"
        >
          <option value="disponivel">Disponível</option>
          <option value="reservado">Reservado</option>
          <option value="consumido">Consumido</option>
        </select>
      ),
    },
    {
      id: "acoes",
      header: "",
      cell: (o) => (
        <Button variant="ghost" onClick={() => onDelete(o.id)}>
          Excluir
        </Button>
      ),
      align: "right",
    },
  ];
  const totalArea = offcuts.reduce((a, o) => a + o.areaM2, 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onRegister} disabled={!hasPlan}>
          Registrar sobras do plano atual
        </Button>
        <Button variant="outline" onClick={onClear} disabled={offcuts.length === 0}>
          Limpar inventário
        </Button>
        <StatusBadge tone="info">
          {offcuts.length} sobras · {totalArea.toFixed(2)} m²
        </StatusBadge>
      </div>
      {offcuts.length === 0 ? (
        <EmptyState
          title="Nenhuma sobra cadastrada"
          description="Rode o Otimizador (Fabricação) e clique em 'Registrar sobras do plano atual' para popular o inventário."
        />
      ) : (
        <DataTable columns={columns} data={[...offcuts]} getRowKey={(o) => o.id} />
      )}
    </div>
  );
}

// ─── Montagem ───────────────────────────────────────────────────

function AssemblySub({
  steps,
  totalMinutes,
}: {
  steps: readonly AssemblyStep[];
  totalMinutes: number;
}) {
  if (steps.length === 0) {
    return (
      <EmptyState
        title="Sem passos"
        description="Insira móveis para gerar a sequência de montagem."
      />
    );
  }
  const groups = new Map<string, AssemblyStep[]>();
  for (const s of steps) {
    const list = groups.get(s.furnitureLabel) ?? [];
    list.push(s);
    groups.set(s.furnitureLabel, list);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="info">{steps.length} passos</StatusBadge>
        <StatusBadge tone="success">
          ≈ {Math.round(totalMinutes / 60)}h {totalMinutes % 60}min
        </StatusBadge>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[...groups.entries()].map(([label, list]) => (
          <div key={label} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 text-sm font-medium">{label}</div>
            <ol className="flex flex-col gap-2">
              {list.map((s) => (
                <li
                  key={s.order}
                  className="rounded-md border border-border/60 bg-muted/30 p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      #{s.order} · {s.title}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.estimatedMinutes} min
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{s.description}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.toolset.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-background px-1 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reotimização ───────────────────────────────────────────────

function ReoptimizeSub({
  compare,
  onRun,
}: {
  compare: ReturnType<typeof useIndustrial>["compare"];
  onRun: ReturnType<typeof useIndustrial>["reoptimize"];
}) {
  const [margin, setMargin] = useState(10);
  const [kerf, setKerf] = useState(4);
  const [rotate, setRotate] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Margem (mm)</span>
          <input
            type="number"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value) || 0)}
            className="rounded border border-border bg-background px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Kerf (mm)</span>
          <input
            type="number"
            value={kerf}
            onChange={(e) => setKerf(Number(e.target.value) || 0)}
            className="rounded border border-border bg-background px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={rotate} onChange={(e) => setRotate(e.target.checked)} />
          <span>Permitir rotação</span>
        </label>
        <Button onClick={() => onRun({ marginMm: margin, kerfMm: kerf, allowRotation: rotate })}>
          Otimizar novamente
        </Button>
      </div>
      {compare ? (
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Chapas"
            value={`${compare.before.boards} → ${compare.after.boards}`}
            hint={`Δ ${compare.diff.boards >= 0 ? "-" : "+"}${Math.abs(compare.diff.boards)}`}
          />
          <MetricCard
            label="Aproveitamento"
            value={`${compare.before.usagePct}% → ${compare.after.usagePct}%`}
            hint={`Δ ${compare.diff.usagePct >= 0 ? "+" : ""}${compare.diff.usagePct}%`}
          />
          <MetricCard
            label="Economia estimada"
            value={fmtBRL(compare.economyBRL)}
            hint={`sobra: ${compare.before.wasteM2.toFixed(2)} m² → ${compare.after.wasteM2.toFixed(2)} m²`}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Ajuste os parâmetros e clique em <span className="font-medium">Otimizar novamente</span>{" "}
          para comparar antes × depois.
        </div>
      )}
    </div>
  );
}

// ─── Custo ──────────────────────────────────────────────────────

function CostSub({
  rows,
  total,
  marginPct,
  costPerM2,
  pricePerM2,
}: {
  rows: readonly IndustrialCostRow[];
  total: number;
  marginPct: number;
  costPerM2: number;
  pricePerM2: number;
}) {
  const columns: DataTableColumn<IndustrialCostRow>[] = [
    {
      id: "group",
      header: "Grupo",
      cell: (r) => <StatusBadge tone="neutral">{r.group}</StatusBadge>,
    },
    {
      id: "label",
      header: "Descrição",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.label}</div>
          <div className="text-xs text-muted-foreground">{r.hint}</div>
        </div>
      ),
    },
    {
      id: "val",
      header: "Valor",
      cell: (r) => <span className="tabular-nums font-medium">{fmtBRL(r.value)}</span>,
      align: "right",
    },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <DataTable columns={columns} data={[...rows]} getRowKey={(r) => r.id} />
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">R$/m² custo</span>
          <span className="tabular-nums">{fmtBRL(costPerM2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">R$/m² venda</span>
          <span className="tabular-nums">{fmtBRL(pricePerM2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Margem real</span>
          <span className="tabular-nums">{marginPct.toFixed(1)}%</span>
        </div>
        <div className="my-2 h-px bg-border" />
        <div className="flex justify-between text-base">
          <span className="font-semibold">Preço final</span>
          <span className="tabular-nums font-semibold">{fmtBRL(total)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Etiquetas com QR + Barcode ─────────────────────────────────

function LabelsSub({ labels }: { labels: readonly PartLabel[] }) {
  if (labels.length === 0) {
    return (
      <EmptyState
        title="Sem etiquetas"
        description="Insira móveis para gerar etiquetas com QR e código de barras."
      />
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {labels.map((l) => (
        <LabelCard key={l.code} label={l} />
      ))}
    </div>
  );
}

function LabelCard({ label }: { label: PartLabel }) {
  const matrix = useMemo(() => pseudoQrMatrix(label.qrPayload, 21), [label.qrPayload]);
  const bars = useMemo(() => barcodeBars(label.barcodePayload, 42), [label.barcodePayload]);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-medium">{label.code}</span>
        <StatusBadge tone="info">{label.position}</StatusBadge>
      </div>
      <div className="flex gap-3">
        <svg
          viewBox={`0 0 ${matrix.length} ${matrix.length}`}
          className="h-24 w-24 rounded bg-background p-1"
        >
          {matrix.map((row, y) =>
            row.map((on, x) =>
              on ? (
                <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
              ) : null,
            ),
          )}
        </svg>
        <div className="flex-1 text-xs">
          <div className="font-medium">{label.moduleLabel}</div>
          <div className="text-muted-foreground">{label.partLabel}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{label.dimensions}</div>
          <div className="text-[11px] text-muted-foreground">{label.material}</div>
          <div className="text-[11px] text-muted-foreground">Fita: {label.edgeTape}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${bars.length * 3} 40`} className="h-8 w-full">
        {bars.map((w, i) => (
          <rect key={i} x={i * 3} y={0} width={w} height={40} fill="currentColor" />
        ))}
      </svg>
      <div className="text-[10px] text-muted-foreground">
        {label.projectName} · {label.clientName} · {label.environmentLabel} · {label.roomLabel}
      </div>
    </div>
  );
}

// ─── IA industrial ──────────────────────────────────────────────

function AiSub({
  intents,
  ask,
}: {
  intents: readonly IndustrialIntent[];
  ask: (q: string) => IndustrialIntent | null;
}) {
  const [q, setQ] = useState("");
  const [hit, setHit] = useState<IndustrialIntent | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex.: como economizar chapa? qual peça gera maior desperdício?"
          className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
        />
        <Button onClick={() => setHit(ask(q))}>Perguntar</Button>
      </div>
      {hit && (
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm">
          <div className="text-xs uppercase tracking-wider text-accent">Resposta local</div>
          <div className="mt-1 font-medium">{hit.question}</div>
          <div className="mt-1 text-muted-foreground">{hit.answer}</div>
        </div>
      )}
      <div className="grid gap-2 md:grid-cols-2">
        {intents.map((i) => (
          <button
            key={i.id}
            onClick={() => {
              setQ(i.question);
              setHit(i);
            }}
            className="rounded-lg border border-border bg-card p-3 text-left text-xs hover:border-accent hover:bg-accent/5"
          >
            <div className="font-medium">{i.question}</div>
            <div className="mt-1 text-muted-foreground line-clamp-2">{i.answer}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
