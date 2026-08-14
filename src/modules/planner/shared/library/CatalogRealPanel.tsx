/**
 * Etapa C — Painel de Catálogo Real (Materiais & Ferragens do servidor).
 *
 * Consome `listCatalogMaterials` e `listCatalogHardware` (server functions
 * tenant-scoped) e apresenta busca + filtros. Camada aditiva ao lado do
 * `LibraryPanel` paramétrico — sem alterar o catálogo curado de móveis.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Package, Wrench, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listCatalogMaterials,
  listCatalogHardware,
  catalogStats,
  type PlannerMaterialDTO,
  type PlannerHardwareDTO,
} from "@/lib/planner-catalog.functions";

type Tab = "materials" | "hardware";

export function CatalogRealPanel() {
  const [tab, setTab] = useState<Tab>("materials");
  const [query, setQuery] = useState("");
  const [manufacturer, setManufacturer] = useState<string>("");
  const [thickness, setThickness] = useState<number | "">("");
  const [onlyCurrent, setOnlyCurrent] = useState(false);

  const listMaterials = useServerFn(listCatalogMaterials);
  const listHardware = useServerFn(listCatalogHardware);
  const getStats = useServerFn(catalogStats);

  const stats = useQuery({
    queryKey: ["planner", "catalog", "stats"],
    queryFn: () => getStats(),
    staleTime: 60_000,
  });

  const materials = useQuery({
    queryKey: ["planner", "catalog", "materials", query, manufacturer, thickness, onlyCurrent],
    queryFn: () =>
      listMaterials({
        data: {
          query: query || undefined,
          manufacturer: manufacturer || undefined,
          thicknessMm: typeof thickness === "number" ? thickness : undefined,
          onlyCurrent: onlyCurrent || undefined,
          limit: 240,
        },
      }),
    enabled: tab === "materials",
    staleTime: 30_000,
  });

  const hardware = useQuery({
    queryKey: ["planner", "catalog", "hardware", query],
    queryFn: () => listHardware({ data: { query: query || undefined, limit: 200 } }),
    enabled: tab === "hardware",
    staleTime: 30_000,
  });

  const loading = tab === "materials" ? materials.isLoading : hardware.isLoading;
  const rows = tab === "materials" ? (materials.data ?? []) : (hardware.data ?? []);

  const tabs = useMemo(
    () => [
      { id: "materials" as const, label: "Materiais", icon: Package, count: stats.data?.materials },
      { id: "hardware" as const, label: "Ferragens", icon: Wrench, count: stats.data?.hardware },
    ],
    [stats.data],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/60 text-sm">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {t.count != null ? (
                  <span className="rounded bg-background/70 px-1.5 text-[10px] tabular-nums">
                    {t.count.toLocaleString("pt-BR")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "materials"
                ? "Buscar chapa, cor, fabricante…"
                : "Buscar dobradiça, corrediça, puxador…"
            }
            className="h-8 w-72 rounded-md border border-input bg-background pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {tab === "materials" ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2 text-xs">
          <select
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">Todos os fabricantes</option>
            <option value="Duratex">Duratex</option>
            <option value="Arauco">Arauco</option>
            <option value="Guararapes">Guararapes</option>
            <option value="Berneck">Berneck</option>
            <option value="Eucatex">Eucatex</option>
            <option value="Sudati">Sudati</option>
          </select>
          <select
            value={thickness}
            onChange={(e) => setThickness(e.target.value ? Number(e.target.value) : "")}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">Todas as espessuras</option>
            <option value="3">3 mm</option>
            <option value="6">6 mm</option>
            <option value="15">15 mm</option>
            <option value="18">18 mm</option>
            <option value="25">25 mm</option>
          </select>
          <label className="inline-flex items-center gap-1.5 text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyCurrent}
              onChange={(e) => setOnlyCurrent(e.target.checked)}
              className="h-3 w-3"
            />
            Somente atuais
          </label>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {(materials.data?.length ?? 0).toLocaleString("pt-BR")} de{" "}
            {(stats.data?.materials ?? 0).toLocaleString("pt-BR")} chapas
          </span>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {loading ? (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando catálogo…
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="grid h-full place-items-center rounded-md border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
            Nenhum item encontrado.
          </div>
        ) : tab === "materials" ? (
          <MaterialsGrid items={rows as PlannerMaterialDTO[]} />
        ) : (
          <HardwareGrid items={rows as PlannerHardwareDTO[]} />
        )}
      </div>
    </div>
  );
}

function MaterialsGrid({ items }: { items: readonly PlannerMaterialDTO[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
      {items.map((m) => (
        <li
          key={m.id}
          className="group flex flex-col rounded-lg border border-border/60 bg-card p-2 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
        >
          <div
            className="mb-2 aspect-[4/3] rounded-md border border-border/40 bg-cover bg-center"
            style={{
              backgroundImage: m.textureUrl ? `url(${m.textureUrl})` : undefined,
              backgroundColor: m.colorHex ?? "hsl(var(--muted))",
            }}
          />
          <p className="truncate text-xs font-semibold">{m.pattern ?? m.name}</p>
          <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            {m.manufacturer}
            {m.line ? ` · ${m.line}` : ""}
          </p>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{m.thicknessMm} mm</span>
            {m.pricePerM2 != null ? (
              <span className="tabular-nums text-foreground">
                {m.pricePerM2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/m²
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function HardwareGrid({ items }: { items: readonly PlannerHardwareDTO[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
      {items.map((h) => (
        <li
          key={h.id}
          className="group flex flex-col rounded-lg border border-border/60 bg-card p-2 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
        >
          <div className="mb-2 grid aspect-[4/3] place-items-center rounded-md border border-border/40 bg-gradient-to-br from-primary/10 via-background to-accent/10">
            <Wrench className="h-8 w-8 text-primary/80" />
          </div>
          <p className="truncate text-xs font-semibold">{h.model}</p>
          <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            {h.category}
          </p>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="truncate">{h.description ?? ""}</span>
            {h.unitPrice != null ? (
              <span className="tabular-nums text-foreground">
                {h.unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default CatalogRealPanel;
