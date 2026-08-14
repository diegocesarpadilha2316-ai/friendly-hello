/**
 * Preview da Lista de Corte / Métricas — Fase 3.5.
 * Consome `decomposeFurniture` para cada móvel do cômodo ativo.
 * Puro visual — nenhuma mutação ao projeto.
 */
import { useMemo } from "react";
import { Scissors } from "lucide-react";
import { useTenant } from "@/core/providers/TenantProvider";
import { usePlannerEditor } from "../state/editor-context";
import { listPrimitives } from "../editor-2d/serialization";
import type { Editor2DPrimitive } from "../editor-2d/types";
import { loadRules } from "./company-rules";
import { decomposeFurniture } from "./decompose";

export function CutListPreview() {
  const { state } = usePlannerEditor();
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const rules = useMemo(() => loadRules(tenantId), [tenantId]);

  const rows = useMemo(() => {
    const env = state.project?.environments.find((e) => e.id === state.selectedEnvironmentId);
    const room = env?.rooms.find((r) => r.id === state.selectedRoomId);
    if (!room) return [];
    const items = listPrimitives(room).filter(
      (p): p is Extract<Editor2DPrimitive, { kind: "furniture" }> => p.kind === "furniture",
    );
    return items.map((f) => decomposeFurniture(f, rules));
  }, [state.project, state.selectedEnvironmentId, state.selectedRoomId, rules]);

  const totals = rows.reduce(
    (acc, r) => ({
      parts: acc.parts + r.totals.partCount,
      area: acc.area + r.totals.boardAreaM2,
      edge: acc.edge + r.totals.edgeMeters,
    }),
    { parts: 0, area: 0, edge: 0 },
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        Nenhum móvel neste cômodo. Insira peças da Biblioteca para gerar a lista de corte.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Móveis" value={String(rows.length)} />
        <Metric label="Peças totais" value={String(totals.parts)} />
        <Metric
          label="Área m² · Fita m"
          value={`${totals.area.toFixed(2)} · ${totals.edge.toFixed(2)}`}
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/60 backdrop-blur">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Móvel</th>
              <th className="px-3 py-2 text-left">Peça</th>
              <th className="px-3 py-2 text-right">Qtd</th>
              <th className="px-3 py-2 text-right">L×A (mm)</th>
              <th className="px-3 py-2 text-right">Esp.</th>
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-left">Acabamento</th>
              <th className="px-3 py-2 text-left">Veio</th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((r) =>
              r.parts.map((p) => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {r.furnitureId.slice(0, 10)}…
                  </td>
                  <td className="px-3 py-1.5">{p.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.qty}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {p.widthMm}×{p.heightMm}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.thicknessMm}</td>
                  <td className="px-3 py-1.5">{p.material}</td>
                  <td className="px-3 py-1.5">{p.finish}</td>
                  <td className="px-3 py-1.5 capitalize">{p.grain}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Scissors className="h-3 w-3" /> Fase 3.5 — dados prontos para o Plano de Corte, Orçamento e
        Produção.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
