/**
 * Etapa 12 — Orçamento Profissional (UI).
 *
 * Três visões separadas por natureza da informação:
 *  - Quantidades e custos (auditoria linha a linha)
 *  - Fechamento financeiro (mão de obra, indiretos, margem, impostos)
 *  - Proposta comercial (o que o cliente vê)
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  FileText,
  Percent,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useProjectBudget } from "../hooks/use-project-budget";
import {
  CATEGORY_LABEL,
  downloadCsv,
  formatBRL,
  printCommercialProposal,
} from "../services";
import type { BudgetCategory, BudgetItem } from "../types";

function StatusPill({ item }: { item: BudgetItem }) {
  if (item.pricingStatus === "ausente") {
    return (
      <Badge variant="destructive" className="gap-1 text-[10px]">
        <AlertTriangle className="h-3 w-3" /> sem preço
      </Badge>
    );
  }
  if (item.pricingStatus === "estimado") {
    return (
      <Badge variant="secondary" className="text-[10px]">
        estimado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px]">
      <Check className="h-3 w-3" /> {item.manualPrice ? "manual" : "catálogo"}
    </Badge>
  );
}

function NumberField({
  value,
  onCommit,
  suffix,
  className,
}: {
  value: number | null;
  onCommit: (v: number | null) => void;
  suffix?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string>(value == null ? "" : String(value));
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Input
        value={draft}
        inputMode="decimal"
        placeholder="—"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = Number(draft.replace(",", "."));
          onCommit(draft.trim() === "" || !Number.isFinite(n) ? null : n);
        }}
        className="h-8 w-24 text-right text-xs"
      />
      {suffix ? <span className="text-[10px] text-muted-foreground">{suffix}</span> : null}
    </div>
  );
}

export function BudgetStudio() {
  const b = useProjectBudget();
  const [revisionLabel, setRevisionLabel] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<BudgetCategory, BudgetItem[]>();
    for (const item of b.budget?.items ?? []) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return [...map.entries()];
  }, [b.budget]);

  if (!b.hasProject || !b.budget) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
        Abra um projeto para gerar o orçamento profissional.
      </div>
    );
  }

  const { budget } = b;
  const t = budget.totals;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Orçamento profissional</h2>
          <p className="text-xs text-muted-foreground">
            {budget.projectName} · revisão {budget.revision} ·{" "}
            {budget.complete ? (
              <span className="text-emerald-500">completo</span>
            ) : (
              <span className="text-destructive">
                incompleto — {t.missingPriceCount} item(ns) sem preço
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {b.outdated ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> projeto alterado
            </Badge>
          ) : null}
          <Button size="sm" variant="outline" onClick={b.recalculate}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Recalcular
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadCsv(budget)}>
            <Download className="mr-1 h-3.5 w-3.5" /> CSV interno
          </Button>
          <Button size="sm" onClick={() => printCommercialProposal(budget)}>
            <FileText className="mr-1 h-3.5 w-3.5" /> Proposta
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Custo direto", value: t.directCost },
          { label: "Mão de obra", value: t.laborCost },
          { label: "Custo cheio", value: t.fullCost },
          { label: "Impostos", value: t.taxes },
          { label: "Preço final", value: t.final, strong: true },
        ].map((k) => (
          <div
            key={k.label}
            className={cn(
              "rounded-xl border bg-card/60 p-3",
              k.strong && "border-primary/40 bg-primary/10",
            )}
          >
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {k.label}
            </div>
            <div className={cn("mt-1 text-lg font-semibold", k.strong && "text-primary")}>
              {formatBRL(k.value)}
            </div>
          </div>
        ))}
      </div>

      {budget.warnings.length > 0 ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs">
          {budget.warnings.map((w) => (
            <div key={w} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      ) : null}

      <Tabs defaultValue="itens" className="flex min-h-0 flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="itens">Quantidades e custos</TabsTrigger>
          <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
          <TabsTrigger value="revisoes">Revisões</TabsTrigger>
          <TabsTrigger value="premissas">Premissas</TabsTrigger>
        </TabsList>

        <TabsContent value="itens" className="min-h-0 flex-1">
          <ScrollArea className="h-full rounded-xl border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/70 backdrop-blur">
                <tr className="text-left">
                  <th className="p-2">Item</th>
                  <th className="p-2">Qtd líq.</th>
                  <th className="p-2">Perda</th>
                  <th className="p-2">Qtd bruta</th>
                  <th className="p-2">Custo unit.</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              {grouped.map(([category, items]) => (
                <tbody key={category}>
                  <tr className="bg-muted/40">
                    <td colSpan={7} className="p-2 font-medium">
                      {CATEGORY_LABEL[category]}
                    </td>
                  </tr>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground">{item.origin}</div>
                      </td>
                      <td className="p-2">
                        <NumberField
                          value={item.quantityNet}
                          onCommit={(v) => b.setItemQuantity(item.id, v)}
                          suffix={item.unit}
                        />
                      </td>
                      <td className="p-2">
                        <NumberField
                          value={item.wastePct}
                          onCommit={(v) => b.setItemWaste(item.id, v)}
                          suffix="%"
                        />
                      </td>
                      <td className="p-2 tabular-nums">
                        {item.quantityGross} {item.unit}
                      </td>
                      <td className="p-2">
                        <NumberField
                          value={item.unitCost}
                          onCommit={(v) => b.setItemPrice(item.id, v)}
                          suffix="R$"
                        />
                      </td>
                      <td className="p-2">
                        <StatusPill item={item} />
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {item.priceSource}
                        </div>
                      </td>
                      <td className="p-2 text-right font-medium tabular-nums">
                        {item.totalCost == null ? "—" : formatBRL(item.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="fechamento" className="min-h-0 flex-1 overflow-auto">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border p-4">
              <h3 className="text-sm font-semibold">Parâmetros</h3>
              {(
                [
                  ["laborRatePerHour", "Mão de obra (R$/h)"],
                  ["overheadPct", "Custos indiretos (%)"],
                  ["marginPct", "Remuneração (%)"],
                  ["taxPct", "Impostos (%)"],
                  ["discountValue", "Desconto"],
                  ["freightValue", "Frete (R$)"],
                  ["installationValue", "Montagem (R$)"],
                  ["boardPrice", "Chapa cheia (R$)"],
                  ["edgeTapePricePerM", "Fita de borda (R$/m)"],
                  ["paintPricePerM2", "Pintura (R$/m²)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <NumberField
                    value={b.settings[key] as number}
                    onCommit={(v) => b.updateSettings({ [key]: v ?? 0 })}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-muted-foreground">Modo de remuneração</span>
                <div className="flex gap-1">
                  {(["margem", "markup"] as const).map((mode) => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={b.settings.marginMode === mode ? "default" : "outline"}
                      onClick={() => b.updateSettings({ marginMode: mode })}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Desconto em</span>
                <div className="flex gap-1">
                  {(["percent", "valor"] as const).map((mode) => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={b.settings.discountMode === mode ? "default" : "outline"}
                      onClick={() => b.updateSettings({ discountMode: mode })}
                    >
                      {mode === "percent" ? <Percent className="h-3.5 w-3.5" /> : "R$"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border p-4 text-sm">
              <h3 className="text-sm font-semibold">Composição do preço</h3>
              {[
                ["Custo direto (materiais + ferragens)", t.directCost],
                [`Mão de obra (${budget.labor.totalHours} h)`, t.laborCost],
                ["Logística e montagem", t.logisticsCost],
                ["Custos indiretos", t.overhead],
                ["Remuneração", t.margin],
                ["Desconto", -t.discount],
                ["Impostos", t.taxes],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between border-b py-1 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="tabular-nums">{formatBRL(Number(value))}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-base font-semibold">
                <span>Preço final</span>
                <span className="text-primary">{formatBRL(t.final)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-muted-foreground">
                <div>
                  R$/m²<div className="text-foreground">{formatBRL(t.perM2)}</div>
                </div>
                <div>
                  Resultado<div className="text-foreground">{t.profitPct}%</div>
                </div>
                <div>
                  Cobertura de preços<div className="text-foreground">{t.priceCoveragePct}%</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revisoes" className="min-h-0 flex-1 overflow-auto">
          <div className="flex items-center gap-2 pb-3">
            <Input
              value={revisionLabel}
              onChange={(e) => setRevisionLabel(e.target.value)}
              placeholder="Nome da revisão (ex.: aprovado pelo cliente)"
              className="h-9 max-w-sm text-xs"
            />
            <Button
              size="sm"
              onClick={() => {
                b.saveRevision(revisionLabel);
                setRevisionLabel("");
              }}
            >
              <Save className="mr-1 h-3.5 w-3.5" /> Congelar revisão
            </Button>
            <Button size="sm" variant="ghost" onClick={b.resetOverrides}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Limpar ajustes manuais
            </Button>
          </div>
          {b.revisions.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma revisão congelada ainda.</p>
          ) : (
            <div className="space-y-2">
              {b.revisions.map((r) => (
                <div
                  key={`${r.revision}-${r.createdAt}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-xs"
                >
                  <div>
                    <div className="font-medium">
                      R{r.revision} · {r.label}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">{formatBRL(r.final)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="premissas" className="min-h-0 flex-1 overflow-auto">
          <ul className="space-y-2 text-xs text-muted-foreground">
            {budget.assumptions.map((a) => (
              <li key={a} className="rounded-lg border p-3">
                {a}
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}