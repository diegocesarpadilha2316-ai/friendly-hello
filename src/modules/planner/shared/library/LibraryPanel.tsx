import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Search,
  Star,
  StarOff,
  Clock,
  Layers,
  Plus,
  Sparkles,
  Filter,
  Info,
  Home,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";
import type { PlannerProject } from "../types/project";
import { CATALOG_CATEGORIES, CATALOG_COLLECTIONS, CATALOG_ITEMS, findCatalogItem } from "./catalog";
import type { CatalogItem } from "./types";
import { useLibraryFavorites } from "./use-favorites";
import { insertItemIntoProject } from "./insert";
import { ROOM_BUCKETS, countBuckets } from "./taxonomy";
import { buildIndex, searchIndex } from "./search-index";
import {
  applyFilters,
  deriveOptions,
  hasActiveFilters,
  itemDoors,
  itemDrawers,
  type LibraryFilterState,
} from "./filters";

type TabId = "all" | "favorites" | "recents" | "most";

interface LibraryPanelProps {
  variant?: "full" | "compact";
}

export function LibraryPanel({ variant = "full" }: LibraryPanelProps) {
  const { state, updateProject } = usePlannerEditor();
  const project = state.project;
  const envId = state.selectedEnvironmentId;
  const roomId = state.selectedRoomId;
  const compact = variant === "compact";

  const { favorites, recents, mostUsed, toggleFavorite, registerRecent, clearRecents } =
    useLibraryFavorites();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [bucketId, setBucketId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LibraryFilterState>({});
  const [preview, setPreview] = useState<CatalogItem | null>(CATALOG_ITEMS[0] ?? null);

  const searchIdx = useMemo(() => buildIndex(CATALOG_ITEMS), []);
  const bucketCounts = useMemo(() => countBuckets(CATALOG_ITEMS), []);
  const filterOptions = useMemo(() => deriveOptions(CATALOG_ITEMS), []);

  const items = useMemo(() => {
    let base: readonly CatalogItem[];
    if (tab === "favorites") base = CATALOG_ITEMS.filter((i) => favorites.includes(i.id));
    else if (tab === "recents")
      base = recents.map((id) => findCatalogItem(id)).filter((x): x is CatalogItem => x !== null);
    else if (tab === "most")
      base = mostUsed.map((id) => findCatalogItem(id)).filter((x): x is CatalogItem => x !== null);
    else base = CATALOG_ITEMS;
    const filtered = applyFilters(base, bucketId ? { ...filters, bucketId } : filters);
    if (!query.trim()) return filtered;
    const ranked = searchIndex(searchIdx, query);
    const allow = new Set(filtered.map((i) => i.id));
    return ranked.filter((i) => allow.has(i.id));
  }, [tab, favorites, recents, mostUsed, query, bucketId, filters, searchIdx]);

  useEffect(() => {
    if (!preview && items.length > 0) setPreview(items[0] ?? null);
  }, [items, preview]);

  const canInsert = Boolean(project && envId && roomId);

  function insert(item: CatalogItem) {
    if (!project || !envId || !roomId) return;
    updateProject((p: PlannerProject) =>
      insertItemIntoProject(p, { environmentId: envId, roomId }, item),
    );
    registerRecent(item.id);
  }

  function onDragStart(e: React.DragEvent<HTMLElement>, item: CatalogItem) {
    try {
      e.dataTransfer.setData("application/x-dioris-catalog-item", item.id);
      e.dataTransfer.setData("text/plain", item.name);
      e.dataTransfer.effectAllowed = "copy";
    } catch {
      /* ignore */
    }
  }

  const tabs: readonly { id: TabId; label: string; icon: typeof Boxes; count: number }[] = [
    { id: "all", label: "Todos", icon: Boxes, count: CATALOG_ITEMS.length },
    { id: "favorites", label: "Favoritos", icon: Star, count: favorites.length },
    { id: "recents", label: "Recentes", icon: Clock, count: recents.length },
    { id: "most", label: "Mais usados", icon: TrendingUp, count: mostUsed.length },
  ];
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== "" && v !== null,
  ).length;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/60",
        compact ? "text-xs" : "text-sm",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
          Biblioteca Inteligente
        </span>
        <div className="ml-2 flex items-center gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors",
                  active
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                title={`${t.label} (${t.count})`}
              >
                <Icon className="h-3 w-3" /> {t.label}
                <span className="tabular-nums text-[10px] opacity-70">{t.count}</span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, código, fabricante, tipo…"
              className="h-8 w-64 rounded-md border border-input bg-background pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Button
            size="sm"
            variant={showFilters || activeFilterCount > 0 ? "default" : "ghost"}
            className="h-8 gap-1"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-3.5 w-3.5" /> Filtros
            {activeFilterCount > 0 ? (
              <span className="rounded bg-primary/30 px-1 text-[10px] tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid min-h-0 flex-1",
          compact ? "grid-cols-[160px_1fr]" : "grid-cols-[220px_1fr_280px]",
        )}
      >
        <aside className="flex min-h-0 flex-col overflow-auto border-r border-border/60 p-2">
          <div className="mb-1 flex items-center gap-1 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Home className="h-3 w-3" /> Ambientes / Tipos
          </div>
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => setBucketId(null)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors",
                  bucketId === null
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Boxes className="h-3.5 w-3.5" /> Tudo
                </span>
                <span className="rounded bg-background/70 px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {CATALOG_ITEMS.length}
                </span>
              </button>
            </li>
            {ROOM_BUCKETS.map((b) => {
              const active = bucketId === b.id;
              const count = bucketCounts[b.id] ?? 0;
              if (count === 0) return null;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setBucketId(active ? null : b.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Layers className="h-3.5 w-3.5" /> {b.label}
                    </span>
                    <span className="rounded bg-background/70 px-1.5 text-[10px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {!compact ? (
            <>
              <div className="mt-3 mb-1 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Categorias técnicas
              </div>
              <ul className="space-y-0.5">
                {CATALOG_CATEGORIES.map((c) => {
                  const active = filters.category === c.id;
                  const n = CATALOG_ITEMS.filter((i) => i.category === c.id).length;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, category: active ? undefined : c.id }))
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-[11px] transition-colors",
                          active
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        title={c.description}
                      >
                        <span className="truncate">{c.label}</span>
                        <span className="tabular-nums text-[10px] opacity-60">{n}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 mb-1 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Coleções
              </div>
              <ul className="space-y-0.5">
                {CATALOG_COLLECTIONS.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      title={c.description}
                      onClick={() => setQuery(c.label)}
                      className="w-full truncate rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>

              {recents.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 justify-start"
                  onClick={clearRecents}
                >
                  <Clock className="mr-1.5 h-3.5 w-3.5" /> Limpar recentes
                </Button>
              ) : null}
            </>
          ) : null}
        </aside>

        <div className="flex min-h-0 flex-col overflow-hidden">
          {showFilters ? (
            <FiltersBar
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters({})}
              options={filterOptions}
            />
          ) : null}
          {activeFilterCount > 0 && !showFilters ? (
            <ActiveFilterChips
              filters={filters}
              onRemove={(k) => setFilters((prev) => ({ ...prev, [k]: undefined }))}
              onClear={() => setFilters({})}
            />
          ) : null}
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {items.length === 0 ? (
              <div className="grid h-full place-items-center rounded-md border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                <div>
                  <p className="mb-2">Nenhum item corresponde aos filtros atuais.</p>
                  {activeFilterCount > 0 || query ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFilters({});
                        setQuery("");
                        setBucketId(null);
                      }}
                    >
                      Limpar filtros
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <ul
                className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-3 xl:grid-cols-4")}
              >
                {items.map((item) => {
                  const isFav = favorites.includes(item.id);
                  const active = preview?.id === item.id;
                  const nDoors = itemDoors(item);
                  const nDrawers = itemDrawers(item);
                  return (
                    <li key={item.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        onClick={() => setPreview(item)}
                        onDoubleClick={() => insert(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") insert(item);
                        }}
                        className={cn(
                          "group relative flex h-full flex-col rounded-lg border bg-card p-2 text-left transition-all",
                          "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg",
                          active ? "border-primary/70 ring-2 ring-primary/30" : "border-border/60",
                        )}
                      >
                        <div className="mb-2 flex aspect-[4/3] items-center justify-center rounded-md border border-border/40 bg-gradient-to-br from-primary/10 via-background to-accent/10">
                          <Boxes className="h-8 w-8 text-primary/80" />
                        </div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{item.name}</p>
                            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                              {item.subtype}
                              {item.brand ? ` · ${item.brand}` : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className={cn(
                              "shrink-0 rounded p-1 transition-colors",
                              isFav
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            title={isFav ? "Remover dos favoritos" : "Marcar como favorito"}
                          >
                            {isFav ? (
                              <Star className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <StarOff className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {item.parametric.defaults.width}×{item.parametric.defaults.depth}×
                          {item.parametric.defaults.height} mm
                        </div>
                        {nDoors > 0 || nDrawers > 0 || item.code ? (
                          <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
                            {nDoors > 0 ? (
                              <span className="rounded bg-muted px-1.5 py-0.5">{nDoors}P</span>
                            ) : null}
                            {nDrawers > 0 ? (
                              <span className="rounded bg-muted px-1.5 py-0.5">{nDrawers}G</span>
                            ) : null}
                            {item.code ? (
                              <span className="truncate rounded bg-muted/60 px-1.5 py-0.5 text-muted-foreground">
                                {item.code}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="mt-2 flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!canInsert}
                            onClick={(e) => {
                              e.stopPropagation();
                              insert(item);
                            }}
                            className="h-7 flex-1 justify-center text-[11px]"
                            title={
                              canInsert
                                ? "Inserir no cômodo (Duplo clique / Enter)"
                                : "Selecione um cômodo para inserir"
                            }
                          >
                            <Plus className="mr-1 h-3 w-3" /> Inserir
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {!compact ? (
          <aside className="flex min-h-0 flex-col overflow-auto border-l border-border/60 p-3">
            <div className="mb-2 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <Info className="h-3 w-3" /> Preview
            </div>
            {preview ? (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-border/40 bg-gradient-to-br from-primary/10 via-background to-accent/10">
                  <Boxes className="h-10 w-10 text-primary/80" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{preview.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {preview.brand} · {preview.line} · {preview.code}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">{preview.description}</p>

                <dl className="grid grid-cols-2 gap-1 text-[11px]">
                  <dt className="text-muted-foreground">Categoria</dt>
                  <dd>{preview.category}</dd>
                  <dt className="text-muted-foreground">Subtipo</dt>
                  <dd>{preview.subtype}</dd>
                  <dt className="text-muted-foreground">Material</dt>
                  <dd>{preview.material}</dd>
                  <dt className="text-muted-foreground">Cor</dt>
                  <dd>{preview.color}</dd>
                  <dt className="text-muted-foreground">Versão</dt>
                  <dd className="tabular-nums">{preview.version}</dd>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="uppercase tracking-wide">{preview.status}</dd>
                </dl>

                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Faixa paramétrica
                  </p>
                  <ul className="text-[11px] text-muted-foreground">
                    <li>
                      largura: {preview.parametric.width.min}–{preview.parametric.width.max} mm
                    </li>
                    <li>
                      profundidade: {preview.parametric.depth.min}–{preview.parametric.depth.max} mm
                    </li>
                    <li>
                      altura: {preview.parametric.height.min}–{preview.parametric.height.max} mm
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Metadados IA
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {preview.ai.semanticTags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{preview.ai.narrative}</p>
                </div>

                <Button
                  size="sm"
                  className="mt-1"
                  disabled={!canInsert}
                  onClick={() => insert(preview)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Inserir no cômodo
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Selecione um item para ver o preview.</p>
            )}
          </aside>
        ) : null}
      </div>

      {!canInsert ? (
        <div className="border-t border-border/60 bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
          Selecione um cômodo no Editor para habilitar a inserção.
        </div>
      ) : null}
    </div>
  );
}

interface FiltersBarProps {
  filters: LibraryFilterState;
  onChange: (next: LibraryFilterState) => void;
  onClear: () => void;
  options: ReturnType<typeof deriveOptions>;
}

function FiltersBar({ filters, onChange, onClear, options }: FiltersBarProps) {
  function upd<K extends keyof LibraryFilterState>(k: K, v: LibraryFilterState[K]) {
    onChange({ ...filters, [k]: v });
  }
  const Select = ({
    k,
    label,
    opts,
  }: {
    k: "brand" | "line" | "material" | "color";
    label: string;
    opts: readonly string[];
  }) => (
    <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span>{label}</span>
      <select
        value={filters[k] ?? ""}
        onChange={(e) => upd(k, (e.target.value || undefined) as LibraryFilterState[typeof k])}
        className="h-7 rounded border border-input bg-background px-1 text-[11px] text-foreground"
      >
        <option value="">Todos</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
  const NumSelect = ({ k, label, max }: { k: "doors" | "drawers"; label: string; max: number }) => (
    <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span>{label}</span>
      <select
        value={filters[k] ?? ""}
        onChange={(e) => upd(k, e.target.value === "" ? undefined : Number(e.target.value))}
        className="h-7 rounded border border-input bg-background px-1 text-[11px] text-foreground"
      >
        <option value="">—</option>
        {Array.from({ length: max + 1 }, (_, i) => i).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
  const Range = ({
    minK,
    maxK,
    label,
  }: {
    minK: "minWidth" | "minHeight" | "minDepth";
    maxK: "maxWidth" | "maxHeight" | "maxDepth";
    label: string;
  }) => (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span>{label} (mm)</span>
      <input
        type="number"
        placeholder="min"
        value={filters[minK] ?? ""}
        onChange={(e) => upd(minK, e.target.value === "" ? undefined : Number(e.target.value))}
        className="h-7 w-16 rounded border border-input bg-background px-1 text-[11px]"
      />
      <input
        type="number"
        placeholder="max"
        value={filters[maxK] ?? ""}
        onChange={(e) => upd(maxK, e.target.value === "" ? undefined : Number(e.target.value))}
        className="h-7 w-16 rounded border border-input bg-background px-1 text-[11px]"
      />
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/20 px-3 py-2">
      <Select k="brand" label="Fabricante" opts={options.brands} />
      <Select k="line" label="Linha" opts={options.lines} />
      <Select k="material" label="Material" opts={options.materials} />
      <Select k="color" label="Cor" opts={options.colors} />
      <NumSelect k="doors" label="Portas" max={6} />
      <NumSelect k="drawers" label="Gavetas" max={8} />
      <Range minK="minWidth" maxK="maxWidth" label="Largura" />
      <Range minK="minHeight" maxK="maxHeight" label="Altura" />
      <Range minK="minDepth" maxK="maxDepth" label="Profundidade" />
      {hasActiveFilters(filters) ? (
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-7 gap-1 text-[11px]"
          onClick={onClear}
        >
          <X className="h-3 w-3" /> Limpar
        </Button>
      ) : null}
    </div>
  );
}

function ActiveFilterChips({
  filters,
  onRemove,
  onClear,
}: {
  filters: LibraryFilterState;
  onRemove: (k: keyof LibraryFilterState) => void;
  onClear: () => void;
}) {
  const entries = (Object.entries(filters) as [keyof LibraryFilterState, unknown][]).filter(
    ([, v]) => v !== undefined && v !== "" && v !== null,
  );
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/10 px-3 py-1.5 text-[10px]">
      {entries.map(([k, v]) => (
        <button
          key={String(k)}
          type="button"
          onClick={() => onRemove(k)}
          className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-primary hover:bg-primary/25"
          title="Remover filtro"
        >
          <span className="uppercase tracking-wide opacity-70">{String(k)}</span>:{" "}
          <span>{String(v)}</span>
          <X className="h-2.5 w-2.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-muted-foreground hover:text-foreground"
      >
        limpar todos
      </button>
    </div>
  );
}

export default LibraryPanel;
