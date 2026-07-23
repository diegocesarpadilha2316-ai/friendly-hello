/**
 * Biblioteca Inteligente do Planner — Fase 3.4.
 *
 * Painel de catálogo consumido tanto pela rota `/planner/biblioteca` quanto
 * como drawer lateral do `EditorCanvas` no modo 2D. Insere itens no cômodo
 * selecionado através do `PlannerEditorProvider` — nenhum store novo.
 *
 * Suporta busca instantânea, categorias, favoritos, recentes, coleções,
 * clique/duplo clique para inserir e HTML5 Drag & Drop (o handler de drop
 * fica no container do editor; o drag setup vive aqui via `dataTransfer`).
 */
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";
import type { PlannerProject } from "../types/project";
import {
  CATALOG_CATEGORIES,
  CATALOG_COLLECTIONS,
  CATALOG_ITEMS,
  findCatalogItem,
} from "./catalog";
import type { CatalogCategoryId, CatalogItem } from "./types";
import { useLibraryFavorites } from "./use-favorites";
import { insertItemIntoProject } from "./insert";

type ViewFilter = "all" | "favorites" | "recents" | CatalogCategoryId;

interface LibraryPanelProps {
  /** modo compacto (drawer do editor) — reduz colunas e headers */
  variant?: "full" | "compact";
}

function matchesQuery(item: CatalogItem, q: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    item.name,
    item.description,
    item.subtype,
    item.category,
    item.brand ?? "",
    item.line ?? "",
    item.code ?? "",
    ...item.tags,
    ...item.ai.semanticTags,
    ...item.ai.contexts,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function LibraryPanel({ variant = "full" }: LibraryPanelProps) {
  const { state, updateProject } = usePlannerEditor();
  const project = state.project;
  const envId = state.selectedEnvironmentId;
  const roomId = state.selectedRoomId;
  const compact = variant === "compact";

  const { favorites, recents, toggleFavorite, registerRecent, clearRecents } = useLibraryFavorites();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [preview, setPreview] = useState<CatalogItem | null>(CATALOG_ITEMS[0] ?? null);

  const items = useMemo(() => {
    const base =
      filter === "favorites"
        ? CATALOG_ITEMS.filter((i) => favorites.includes(i.id))
        : filter === "recents"
          ? (recents
              .map((id) => findCatalogItem(id))
              .filter((x): x is CatalogItem => x !== null))
          : filter === "all"
            ? CATALOG_ITEMS
            : CATALOG_ITEMS.filter((i) => i.category === filter);
    return base.filter((i) => matchesQuery(i, query));
  }, [filter, favorites, recents, query]);

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
      /* ignora ambientes que bloqueiam dataTransfer */
    }
  }

  const filters: readonly { id: ViewFilter; label: string; icon: typeof Boxes; count?: number }[] = [
    { id: "all", label: "Todos", icon: Boxes, count: CATALOG_ITEMS.length },
    { id: "favorites", label: "Favoritos", icon: Star, count: favorites.length },
    { id: "recents", label: "Recentes", icon: Clock, count: recents.length },
    ...CATALOG_CATEGORIES.map((c) => ({
      id: c.id as ViewFilter,
      label: c.label,
      icon: Layers,
      count: CATALOG_ITEMS.filter((i) => i.category === c.id).length,
    })),
  ];

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/60",
        compact ? "text-xs" : "text-sm",
      )}
    >
      {/* Header + busca */}
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
          Biblioteca Inteligente
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar peças, tags, contextos…"
              className="h-8 w-56 rounded-md border border-input bg-background pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className={cn("grid min-h-0 flex-1", compact ? "grid-cols-[160px_1fr]" : "grid-cols-[200px_1fr_280px]")}>
        {/* Filtros / categorias */}
        <aside className="flex min-h-0 flex-col overflow-auto border-r border-border/60 p-2">
          <div className="mb-1 flex items-center gap-1 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Filter className="h-3 w-3" /> Filtros
          </div>
          <ul className="space-y-0.5">
            {filters.map((f) => {
              const active = filter === f.id;
              const Icon = f.icon;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Icon className="h-3.5 w-3.5" /> {f.label}
                    </span>
                    {f.count !== undefined ? (
                      <span className="rounded bg-background/70 px-1.5 text-[10px] tabular-nums text-muted-foreground">
                        {f.count}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {!compact ? (
            <>
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
                <Button size="sm" variant="ghost" className="mt-3 justify-start" onClick={clearRecents}>
                  <Clock className="mr-1.5 h-3.5 w-3.5" /> Limpar recentes
                </Button>
              ) : null}
            </>
          ) : null}
        </aside>

        {/* Grid de itens (virtualização progressiva via `max-height` + overflow) */}
        <div className="min-h-0 overflow-auto p-2">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center rounded-md border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
              Nenhum item corresponde ao filtro atual.
            </div>
          ) : (
            <ul
              className={cn(
                "grid gap-2",
                compact ? "grid-cols-2" : "grid-cols-3 xl:grid-cols-4",
              )}
            >
              {items.map((item) => {
                const isFav = favorites.includes(item.id);
                const active = preview?.id === item.id;
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
                            isFav ? "text-primary" : "text-muted-foreground hover:text-foreground",
                          )}
                          title={isFav ? "Remover dos favoritos" : "Marcar como favorito"}
                        >
                          {isFav ? <Star className="h-3.5 w-3.5 fill-current" /> : <StarOff className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {item.parametric.defaults.width}×{item.parametric.defaults.depth}×{item.parametric.defaults.height} mm
                      </div>
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
                          title={canInsert ? "Inserir no cômodo (Duplo clique / Enter)" : "Selecione um cômodo para inserir"}
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

        {/* Preview + Inspector */}
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
                    <li>largura: {preview.parametric.width.min}–{preview.parametric.width.max} mm</li>
                    <li>profundidade: {preview.parametric.depth.min}–{preview.parametric.depth.max} mm</li>
                    <li>altura: {preview.parametric.height.min}–{preview.parametric.height.max} mm</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Metadados IA
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {preview.ai.semanticTags.map((t) => (
                      <span key={t} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
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

export default LibraryPanel;