/**
 * Etapa D — Materiais da Empresa (preços, estoque e disponibilidade).
 *
 * Consome `listCompanyMaterials`, `upsertCompanyMaterialPrice`,
 * `deleteCompanyMaterialPrice` e `companyMaterialsStats` — tudo tenant-scoped
 * via `requireTenant`. Nenhum store novo, nenhum provider novo.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Package, Search, Save, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  StatusBadge,
  Button,
} from "@/core/components/ui-kit";
import {
  listCompanyMaterials,
  upsertCompanyMaterialPrice,
  deleteCompanyMaterialPrice,
  companyMaterialsStats,
  type CompanyMaterialRow,
} from "@/lib/planner-materials.functions";

export const Route = createFileRoute("/_authenticated/planner/materiais")({
  head: () => ({
    meta: [
      { title: "Materiais da Empresa — Dioris Planner" },
      {
        name: "description",
        content:
          "Preços de custo/venda, markup, estoque e disponibilidade dos materiais da sua empresa.",
      },
      { property: "og:title", content: "Materiais da Empresa — Dioris Planner" },
      {
        property: "og:description",
        content: "Gestão de preços, markup e estoque por empresa (tenant-scoped).",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MateriaisEmpresaPage,
});

function fmtCurrency(v: number | null | undefined, currency = "BRL") {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency });
}

function MateriaisEmpresaPage() {
  const qc = useQueryClient();
  const list = useServerFn(listCompanyMaterials);
  const stats = useServerFn(companyMaterialsStats);
  const upsert = useServerFn(upsertCompanyMaterialPrice);
  const remove = useServerFn(deleteCompanyMaterialPrice);

  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [editing, setEditing] = useState<CompanyMaterialRow | null>(null);

  const statsQuery = useQuery({
    queryKey: ["planner", "company-materials", "stats"],
    queryFn: () => stats(),
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: ["planner", "company-materials", query, onlyAvailable],
    queryFn: () =>
      list({ data: { query: query || undefined, onlyAvailable, limit: 300 } }),
    staleTime: 15_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["planner", "company-materials"] });
  };

  type UpsertData = {
    materialId: string;
    costPrice: number | null;
    salePrice: number | null;
    markupPercent: number | null;
    stockQuantity: number | null;
    supplierName: string | null;
    isAvailable: boolean;
  };
  const upsertMutation = useMutation({
    mutationFn: (data: UpsertData) => upsert({ data }),
    onSuccess: () => {
      toast.success("Material atualizado");
      setEditing(null);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Falha ao salvar"),
  });

  const removeMutation = useMutation({
    mutationFn: (materialId: string) => remove({ data: { materialId } }),
    onSuccess: () => {
      toast.success("Preço removido");
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Falha ao remover"),
  });

  const rows = listQuery.data ?? [];
  const grouped = useMemo(() => rows, [rows]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Materiais da Empresa"
        description="Configure preços de custo, venda, markup, estoque e disponibilidade dos materiais da sua empresa."
        actions={
          <StatusBadge tone={onlyAvailable ? "success" : "neutral"}>
            {rows.length} materiais listados
          </StatusBadge>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total configurado"
          value={statsQuery.data?.total ?? 0}
          icon={<Package className="h-4 w-4" />}
        />
        <MetricCard
          label="Disponíveis"
          value={statsQuery.data?.available ?? 0}
          icon={<Package className="h-4 w-4" />}
        />
        <MetricCard
          label="Estoque baixo"
          value={statsQuery.data?.lowStock ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, SKU, fabricante…"
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Apenas disponíveis
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/40">
        {listQuery.isLoading ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando materiais…
            </span>
          </div>
        ) : grouped.length === 0 ? (
          <div className="grid place-items-center p-10 text-sm text-muted-foreground">
            Nenhum material encontrado para os filtros atuais.
          </div>
        ) : (
          <div className="max-h-[calc(100vh-420px)] min-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Material</th>
                  <th className="px-3 py-2 text-left">Fabricante</th>
                  <th className="px-3 py-2 text-right">Custo</th>
                  <th className="px-3 py-2 text-right">Venda</th>
                  <th className="px-3 py-2 text-right">Markup</th>
                  <th className="px-3 py-2 text-right">Estoque</th>
                  <th className="px-3 py-2 text-center">Disp.</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((r) => (
                  <tr
                    key={r.materialId}
                    className="border-t border-border/40 hover:bg-muted/30"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded border border-border/60 bg-cover bg-center"
                          style={{
                            backgroundImage: r.imageUrl
                              ? `url(${r.imageUrl})`
                              : undefined,
                            backgroundColor: r.colorHex ?? "hsl(var(--muted))",
                          }}
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {r.sku ?? "—"} · {r.thicknessMm ?? "?"} mm
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.manufacturer ?? "—"}
                      {r.collection ? ` · ${r.collection}` : ""}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtCurrency(r.costPrice, r.currency)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtCurrency(r.salePrice, r.currency)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {r.markupPercent != null
                        ? `${r.markupPercent.toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {r.stockQuantity ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.companyAvailable ? (
                        <StatusBadge tone="success">Sim</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">Não</StatusBadge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(r)}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing ? (
        <EditDrawer
          row={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => upsertMutation.mutate(data)}
          onRemove={() => removeMutation.mutate(editing.materialId)}
          saving={upsertMutation.isPending}
          removing={removeMutation.isPending}
        />
      ) : null}
    </PageContainer>
  );
}

interface EditDrawerProps {
  row: CompanyMaterialRow;
  onClose: () => void;
  onSave: (data: {
    materialId: string;
    costPrice: number | null;
    salePrice: number | null;
    markupPercent: number | null;
    stockQuantity: number | null;
    supplierName: string | null;
    isAvailable: boolean;
  }) => void;
  onRemove: () => void;
  saving: boolean;
  removing: boolean;
}

function EditDrawer({ row, onClose, onSave, onRemove, saving, removing }: EditDrawerProps) {
  const [cost, setCost] = useState(row.costPrice?.toString() ?? "");
  const [sale, setSale] = useState(row.salePrice?.toString() ?? "");
  const [markup, setMarkup] = useState(row.markupPercent?.toString() ?? "");
  const [stock, setStock] = useState(row.stockQuantity?.toString() ?? "");
  const [supplier, setSupplier] = useState(row.supplierName ?? "");
  const [available, setAvailable] = useState(row.companyAvailable);

  function parseNum(v: string): number | null {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-background/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col border-l border-border/60 bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Editar material
            </div>
            <h2 className="truncate text-lg font-semibold">{row.name}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {row.manufacturer ?? "—"} · {row.sku ?? "—"}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className="grid gap-3 text-sm">
          <Field label="Fornecedor">
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Custo (R$)">
              <input
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm tabular-nums"
              />
            </Field>
            <Field label="Venda (R$)">
              <input
                inputMode="decimal"
                value={sale}
                onChange={(e) => setSale(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm tabular-nums"
              />
            </Field>
            <Field label="Markup (%)">
              <input
                inputMode="decimal"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm tabular-nums"
              />
            </Field>
            <Field label="Estoque">
              <input
                inputMode="numeric"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm tabular-nums"
              />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Disponível para uso no Planner
          </label>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-6">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            disabled={removing || saving}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Remover
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onSave({
                materialId: row.materialId,
                costPrice: parseNum(cost),
                salePrice: parseNum(sale),
                markupPercent: parseNum(markup),
                stockQuantity: parseNum(stock),
                supplierName: supplier.trim() || null,
                isAvailable: available,
              })
            }
            disabled={saving || removing}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}