/**
 * Fase 3.25 — MarketplaceStudio: console Dark First do Marketplace Dioris.
 * Zero providers/stores/managers/banco. 100% aditivo.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMarketplace } from "../hooks/use-marketplace";
import type { MarketplaceExportFormat } from "../services/export";
import type { MarketplaceImportFormat } from "../services/import";
import type { MarketplaceItem } from "../types";

type Tab =
  | "destaques"
  | "biblioteca"
  | "fabricantes"
  | "categorias"
  | "colecoes"
  | "atualizacoes"
  | "favoritos"
  | "analytics"
  | "ia";

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: "destaques",     label: "Destaques" },
  { id: "biblioteca",    label: "Biblioteca" },
  { id: "fabricantes",   label: "Fabricantes" },
  { id: "categorias",    label: "Categorias" },
  { id: "colecoes",      label: "Coleções" },
  { id: "atualizacoes",  label: "Atualizações" },
  { id: "favoritos",     label: "Favoritos" },
  { id: "analytics",     label: "Analytics" },
  { id: "ia",            label: "IA" },
];

function StatusBadge({ status }: { status: ReturnType<ReturnType<typeof useMarketplace>["statusOf"]> }): ReactNode {
  if (status === "installed") return <Badge variant="secondary">Instalado</Badge>;
  if (status === "update_available") return <Badge>Atualizar</Badge>;
  if (status === "removed") return <Badge variant="outline">Removido</Badge>;
  return <Badge variant="outline">Disponível</Badge>;
}

function ItemCard({
  item,
  mk,
}: {
  item: MarketplaceItem;
  mk: ReturnType<typeof useMarketplace>;
}): ReactNode {
  const status = mk.statusOf(item.id);
  const isFav = mk.favorites.itemIds.includes(item.id);
  return (
    <Card
      className={cn(
        "flex flex-col justify-between border-border/60 bg-card/60 transition hover:border-primary/60",
        mk.selectedId === item.id && "border-primary",
      )}
    >
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight">{item.name}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription className="line-clamp-2 text-xs">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs">
        <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>{item.brand}</span>
          <span>•</span>
          <span>{item.category}</span>
          <span>•</span>
          <span>v{item.version}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{mk.priceLabel(item)}</span>
          <span>{item.rating.average.toFixed(1)} ★ · {item.downloads.toLocaleString("pt-BR")} ↓</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => mk.select(item.id)}>
            Detalhes
          </Button>
          {status === "not_installed" && (
            <Button size="sm" onClick={() => mk.install(item.id)}>Instalar</Button>
          )}
          {status === "update_available" && (
            <Button size="sm" onClick={() => mk.updateOne(item.id)}>Atualizar</Button>
          )}
          {status === "installed" && (
            <Button size="sm" variant="outline" onClick={() => mk.reinstall(item.id)}>Reinstalar</Button>
          )}
          {(status === "installed" || status === "update_available") && (
            <Button size="sm" variant="ghost" onClick={() => mk.uninstall(item.id)}>Remover</Button>
          )}
          <Button
            size="sm"
            variant={isFav ? "default" : "outline"}
            onClick={() => mk.toggleFavorite(item.id)}
          >
            {isFav ? "★" : "☆"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Grid({
  items,
  mk,
  empty,
}: {
  items: readonly MarketplaceItem[];
  mk: ReturnType<typeof useMarketplace>;
  empty: string;
}): ReactNode {
  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} mk={mk} />
      ))}
    </div>
  );
}

export function MarketplaceStudio(): ReactNode {
  const mk = useMarketplace();
  const [tab, setTab] = useState<Tab>("destaques");
  const [query, setQuery] = useState("");
  const [exportFmt, setExportFmt] = useState<MarketplaceExportFormat>("json");
  const [exportText, setExportText] = useState("");
  const [importFmt, setImportFmt] = useState<MarketplaceImportFormat>("json");
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState("");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const favoriteItems = useMemo(
    () => mk.items.filter((i) => mk.favorites.itemIds.includes(i.id)),
    [mk.items, mk.favorites.itemIds],
  );

  const installedItems = useMemo(
    () => mk.items.filter((i) => mk.installed.records.some((r) => r.itemId === i.id)),
    [mk.items, mk.installed.records],
  );

  const filteredForLibrary = useMemo(() => {
    return query
      ? mk.suggest(query, 60)
      : mk.filtered.length
        ? mk.filtered
        : mk.items;
  }, [mk, query]);

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/40 p-2 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-2 text-left text-sm transition",
              tab === t.id ? "bg-primary/15 text-primary" : "hover:bg-muted/50 text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
        <div className="mt-3 space-y-1 rounded-md border border-border/50 bg-background/40 p-2 text-[11px] text-muted-foreground">
          <div>{mk.analytics.totalItems} itens</div>
          <div>{mk.analytics.totalInstalled} instalados</div>
          <div>{mk.analytics.totalUpdates} atualizações</div>
          <div>{mk.analytics.totalFavorites} favoritos</div>
        </div>
      </aside>

      <section className="space-y-4">
        {tab === "destaques" && (
          <>
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Destaques do Marketplace</h2>
                <p className="text-sm text-muted-foreground">Curadoria oficial Dioris — bibliotecas verificadas e mais baixadas.</p>
              </div>
              <Badge variant="secondary">{mk.featured.length} destaques</Badge>
            </header>
            <Grid items={mk.featured} mk={mk} empty="Nenhum destaque no momento." />
            <h3 className="pt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Mais baixados</h3>
            <Grid items={mk.mostDownloaded.slice(0, 6)} mk={mk} empty="—" />
            <h3 className="pt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Novidades</h3>
            <Grid items={mk.newest.slice(0, 6)} mk={mk} empty="—" />
          </>
        )}

        {tab === "biblioteca" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, marca, tag..."
                className="max-w-xs"
              />
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={mk.filters.free ? "default" : "outline"}
                  onClick={() => mk.setFilters({ free: !mk.filters.free, paid: false })}
                >
                  Gratuito
                </Button>
                <Button
                  size="sm"
                  variant={mk.filters.paid ? "default" : "outline"}
                  onClick={() => mk.setFilters({ paid: !mk.filters.paid, free: false })}
                >
                  Pago
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    mk.setFilters({ free: false, paid: false, categories: [], brands: [] });
                    setQuery("");
                  }}
                >
                  Limpar
                </Button>
              </div>
              {mk.selected && mk.canInsert && (
                <Button size="sm" className="ml-auto" onClick={() => mk.insertSelected()}>
                  Inserir “{mk.selected.name}” no cômodo ativo
                </Button>
              )}
            </div>
            <Grid items={filteredForLibrary} mk={mk} empty="Nenhum item encontrado com os filtros atuais." />
          </>
        )}

        {tab === "fabricantes" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mk.authors.map((author) => {
              const items = mk.items.filter((i) => i.company === author.company);
              return (
                <Card key={author.id} className="border-border/60 bg-card/60">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm">
                      {author.company}
                      {author.verified && <Badge variant="secondary">Verificado</Badge>}
                    </CardTitle>
                    <CardDescription className="text-xs">{author.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {items.length} itens publicados
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "categorias" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mk.categories.map((cat) => {
              const items = mk.items.filter((i) => i.category === cat.id);
              return (
                <Card key={cat.id} className="border-border/60 bg-card/60">
                  <CardHeader>
                    <CardTitle className="text-sm">{cat.label}</CardTitle>
                    <CardDescription className="text-xs">{cat.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-xs">
                    <span>{items.length} itens</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        mk.setFilters({ categories: [cat.id] });
                        setTab("biblioteca");
                      }}
                    >
                      Ver
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "colecoes" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {mk.collections.map((col) => (
              <Card key={col.id} className="border-border/60 bg-card/60">
                <CardHeader>
                  <CardTitle className="text-sm">{col.name}</CardTitle>
                  <CardDescription className="text-xs">{col.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-xs">
                  <span>{col.itemIds.length} itens · {col.ownerKind}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      mk.setFilters({ collections: [col.id] });
                      setTab("biblioteca");
                    }}
                  >
                    Explorar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "atualizacoes" && (
          <>
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Atualizações disponíveis</h2>
                <p className="text-sm text-muted-foreground">Sincronização determinística — sem chamadas externas.</p>
              </div>
              <Button size="sm" onClick={() => mk.updateAll()} disabled={mk.pendingUpdates.length === 0}>
                Atualizar tudo ({mk.pendingUpdates.length})
              </Button>
            </header>
            {mk.pendingUpdates.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Todas as bibliotecas instaladas estão na versão mais recente.
              </p>
            ) : (
              <div className="space-y-2">
                {mk.pendingUpdates.map((upd) => (
                  <Card key={upd.item.id} className="border-border/60 bg-card/60">
                    <CardContent className="flex items-center justify-between gap-2 py-3 text-sm">
                      <div>
                        <p className="font-medium">{upd.item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {upd.installedVersion} → {upd.latestVersion}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => mk.updateOne(upd.item.id)}>Atualizar</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <h3 className="pt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Instalados ({installedItems.length})
            </h3>
            <Grid items={installedItems} mk={mk} empty="Nenhuma biblioteca instalada ainda." />
          </>
        )}

        {tab === "favoritos" && (
          <>
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Favoritos</h2>
              {favoriteItems.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => mk.clearFavorites()}>
                  Limpar
                </Button>
              )}
            </header>
            <Grid items={favoriteItems} mk={mk} empty="Marque itens como favoritos para acessá-los aqui." />
          </>
        )}

        {tab === "analytics" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Card className="border-border/60 bg-card/60">
              <CardHeader><CardTitle className="text-sm">Total de itens</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{mk.analytics.totalItems}</CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60">
              <CardHeader><CardTitle className="text-sm">Downloads totais</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{mk.analytics.totalDownloads.toLocaleString("pt-BR")}</CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60">
              <CardHeader><CardTitle className="text-sm">Instalados</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{mk.analytics.totalInstalled}</CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60">
              <CardHeader><CardTitle className="text-sm">Atualizações</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{mk.analytics.totalUpdates}</CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60">
              <CardHeader><CardTitle className="text-sm">Favoritos</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{mk.analytics.totalFavorites}</CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60">
              <CardHeader><CardTitle className="text-sm">Coleções</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{mk.analytics.totalCollections}</CardContent>
            </Card>
            <Card className="border-border/60 bg-card/60 sm:col-span-2 xl:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm">Importar / Exportar</CardTitle>
                <CardDescription className="text-xs">Formatos: CSV · JSON · XML · Excel · PDF</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {(["csv", "json", "xml", "excel", "pdf"] as const).map((fmt) => (
                      <Button
                        key={fmt}
                        size="sm"
                        variant={exportFmt === fmt ? "default" : "outline"}
                        onClick={() => setExportFmt(fmt)}
                      >
                        {fmt.toUpperCase()}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      onClick={() => setExportText(mk.exportItems(mk.items, exportFmt))}
                    >
                      Gerar export
                    </Button>
                  </div>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-border/60 bg-background/40 p-2 text-xs"
                    value={exportText}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {(["csv", "json", "xml", "excel"] as const).map((fmt) => (
                      <Button
                        key={fmt}
                        size="sm"
                        variant={importFmt === fmt ? "default" : "outline"}
                        onClick={() => setImportFmt(fmt)}
                      >
                        {fmt.toUpperCase()}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      onClick={() => {
                        const res = mk.importMarketplace(importText, importFmt);
                        setImportResult(
                          `${res.items.length} itens interpretados${res.errors.length ? ` · ${res.errors.length} erros` : ""}`,
                        );
                      }}
                    >
                      Interpretar
                    </Button>
                  </div>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-border/60 bg-background/40 p-2 text-xs"
                    placeholder="Cole aqui o conteúdo importado"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  {importResult && <p className="text-xs text-muted-foreground">{importResult}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "ia" && (
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-sm">IA do Marketplace</CardTitle>
              <CardDescription className="text-xs">
                Respostas determinísticas, sem uso de API. Ex.: “qual biblioteca mais baixada?”
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Pergunte à IA do Marketplace"
                />
                <Button onClick={() => setAiAnswer(mk.askAI(question).answer)} disabled={!question.trim()}>
                  Perguntar
                </Button>
              </div>
              {aiAnswer && (
                <p className="rounded-md border border-border/60 bg-background/40 p-3 text-sm">{aiAnswer}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "Qual biblioteca mais baixada?",
                  "Qual fabricante possui mais módulos?",
                  "Qual item mais usado?",
                  "Qual coleção instalar?",
                ].map((sample) => (
                  <Button key={sample} size="sm" variant="outline" onClick={() => { setQuestion(sample); setAiAnswer(mk.askAI(sample).answer); }}>
                    {sample}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {mk.selected && (
          <Card className="border-primary/40 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                {mk.selected.name}
                <Badge variant="secondary">v{mk.selected.version}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {mk.selected.company} · {mk.selected.brand} · Licença {mk.selected.license}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>{mk.selected.description}</p>
              <p>
                Compatibilidade: Planner ≥ {mk.selected.compatibility.plannerMin} · recomendado{" "}
                {mk.selected.compatibility.plannerRecommended}
              </p>
              <p>
                Preço: <span className="font-medium text-foreground">{mk.priceLabel(mk.selected)}</span> ·{" "}
                {mk.selected.downloads.toLocaleString("pt-BR")} downloads · {mk.selected.rating.average.toFixed(1)} ★ (
                {mk.selected.rating.count})
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => mk.insertSelected()} disabled={!mk.canInsert}>
                  Inserir no cômodo ativo
                </Button>
                <Button size="sm" variant="outline" onClick={() => mk.select(null)}>Fechar</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
