import { useState } from "react";
import { Button, EmptyState, MetricCard, StatusBadge } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useIndustrialFinal } from "../hooks/use-industrial-final";
import { FINAL_EXPORTS } from "../exports";
import type { FinalExportFormat, FinalKPI } from "../types";

const GROUP_LABEL: Record<FinalKPI["group"], string> = {
  producao: "Produção",
  fabrica: "Fábrica",
  financeiro: "Financeiro",
  corte: "Plano de Corte",
  cnc: "CNC",
  logistica: "Logística",
};

export function IndustrialFinalPanel() {
  const { hasProject, isEmpty, bundle, ask, download } = useIndustrialFinal();
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  if (!hasProject) {
    return (
      <EmptyState
        title="Abra um projeto"
        description="A Produção Final consolida projeto, corte, CNC, PCP e fábrica em um único bundle."
      />
    );
  }
  if (isEmpty || !bundle) {
    return (
      <EmptyState
        title="Projeto sem peças"
        description="Insira móveis no editor para gerar o bundle industrial completo."
      />
    );
  }

  const groups = new Map<FinalKPI["group"], FinalKPI[]>();
  for (const k of bundle.kpis) {
    const arr = groups.get(k.group) ?? [];
    arr.push(k);
    groups.set(k.group, arr);
  }

  const runAi = () => {
    const res = ask(prompt);
    setAnswer(
      res
        ? res.answer
        : "Não consegui responder. Tente: gargalo, desperdício, melhor algoritmo, lucro, atraso.",
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Produção Industrial Final · Fase 3.32
            </div>
            <div className="mt-1 text-lg font-semibold">{bundle.projectName}</div>
            <div className="text-xs text-muted-foreground">
              {bundle.production.totals.modules} módulos · {bundle.production.totals.parts} peças ·{" "}
              {bundle.cnc.totalPrograms} programas CNC · {bundle.mrp.totalItems} itens MRP
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {bundle.nesting && (
              <StatusBadge tone="info">Algoritmo · {bundle.nesting.winnerAlgorithm}</StatusBadge>
            )}
            {bundle.factoryDelivery && (
              <StatusBadge tone={bundle.factoryDelivery.onTime ? "success" : "warning"}>
                Entrega · {new Date(bundle.factoryDelivery.finishDate).toLocaleDateString("pt-BR")}
              </StatusBadge>
            )}
            {bundle.balance && (
              <StatusBadge tone="warning">Gargalo · {bundle.balance.bottleneckLabel}</StatusBadge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {[...groups.entries()].map(([group, list]) => (
          <section key={group} className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {GROUP_LABEL[group]}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {list.map((k) => (
                <MetricCard key={k.id} label={k.label} value={k.value} hint={k.hint} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {bundle.nesting && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Comparação de algoritmos de nesting</div>
            <StatusBadge tone="success">{bundle.nesting.winnerAlgorithm}</StatusBadge>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {bundle.nesting.runners.map((r) => (
              <div
                key={r.algorithm}
                className={cn(
                  "rounded-md border p-3 text-xs",
                  r.algorithm === bundle.nesting!.winnerAlgorithm
                    ? "border-primary bg-primary/5"
                    : "border-border",
                )}
              >
                <div className="font-mono text-[10px] uppercase text-muted-foreground">
                  {r.algorithm}
                </div>
                <div className="mt-1 tabular-nums">Chapas: {r.plan.statistics.boardsCount}</div>
                <div className="tabular-nums">
                  Aprov.: {(r.plan.statistics.avgUsageRatio * 100).toFixed(1)}%
                </div>
                <div className="tabular-nums">
                  Desp.: {r.plan.statistics.wasteAreaM2.toFixed(2)} m²
                </div>
                {r.savingsAreaM2 > 0 && (
                  <div className="mt-1 text-primary">
                    −{r.savingsAreaM2.toFixed(2)} m² ({r.savingsPercent.toFixed(1)}%)
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">{bundle.nesting.reason}</div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 text-sm font-semibold">
          Manifesto CNC · {bundle.cnc.entries[0]?.machineLabel ?? "—"}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {bundle.cnc.entries.map((e) => (
            <div key={e.format} className="rounded-md border border-border p-3 text-xs">
              <div className="font-mono text-[10px] uppercase text-muted-foreground">
                {e.format}
              </div>
              <div className="mt-1">{e.programs.length} programas</div>
              <div className="tabular-nums">
                {e.totalOps} ops · {e.totalMin} min
              </div>
            </div>
          ))}
        </div>
      </section>

      {bundle.factoryAlerts.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 text-sm font-semibold">Alertas da fábrica</div>
          <ul className="flex flex-col gap-2 text-xs">
            {bundle.factoryAlerts.map((a) => (
              <li key={a.id} className="flex items-start gap-2">
                <StatusBadge tone={a.level === "info" ? "info" : "warning"}>{a.level}</StatusBadge>
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-muted-foreground">{a.message}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-sm font-semibold">Pergunte à IA industrial</div>
        <div className="flex flex-wrap gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Qual máquina está sobrecarregada?"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <Button onClick={runAi}>Perguntar</Button>
        </div>
        {answer && (
          <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
            {answer}
          </div>
        )}
        <div className="mt-2 text-[11px] text-muted-foreground">
          Sugestões: gargalo · operador livre · desperdício · melhor algoritmo · lucro · tempo
          restante · pedido atrasado
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 text-sm font-semibold">Exportações industriais</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {FINAL_EXPORTS.map((spec) => (
            <div
              key={spec.format}
              className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">{spec.label}</div>
                <div className="truncate text-xs text-muted-foreground">{spec.description}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => download(spec.format as FinalExportFormat)}
              >
                .{spec.extension}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
