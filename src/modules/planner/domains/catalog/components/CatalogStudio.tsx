/**
 * Fase 3.24 — CatalogStudio: console Dark First para o Catálogo Paramétrico.
 * Zero providers/stores/managers/banco. 100% aditivo.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCatalog } from "../hooks/use-catalog";
import { priceVariant, formatBRL } from "../pricing";
import { evaluateRules } from "../rules";
import { exportCatalog, type ExportFormat } from "../export";
import { importCatalog, type ImportFormat } from "../import";

type Tab =
  | "catalogo"
  | "colecoes"
  | "favoritos"
  | "recentes"
  | "fabricantes"
  | "materiais"
  | "ferragens"
  | "importar"
  | "exportar";

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: "catalogo",    label: "Catálogo" },
  { id: "colecoes",    label: "Coleções" },
  { id: "favoritos",   label: "Favoritos" },
  { id: "recentes",    label: "Recentes" },
  { id: "fabricantes", label: "Fabricantes" },
  { id: "materiais",   label: "Materiais" },
  { id: "ferragens",   label: "Ferragens" },
  { id: "importar",    label: "Importar" },
  { id: "exportar",    label: "Exportar" },
];

export function CatalogStudio(): ReactNode {
  const cat = useCatalog();
  const [tab, setTab] = useState<Tab>("catalogo");
  const [importText, setImportText] = useState("");
  const [importFmt, setImportFmt] = useState<ImportFormat>("json");
  const [importResult, setImportResult] = useState<string>("");
  const [exportFmt, setExportFmt] = useState<ExportFormat>("csv");

  const price = useMemo(() => {
    if (!cat.selected || !cat.variant) return null;
    return priceVariant(cat.selected, cat.variant);
  }, [cat.selected, cat.variant]);

  const warnings = useMemo(() => {
    if (!cat.selected || !cat.variant) return [];
    return evaluateRules(cat.selected, cat.variant);
  }, [cat.selected, cat.variant]);

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/40 p-2 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
              tab === t.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="mt-3 rounded-md border border-border/50 bg-background/30 p-3 text-xs text-muted-foreground">
          <div className="mb-1 font-medium text-foreground">Status</div>
          <div>{cat.items.length} itens</div>
          <div>{cat.favorites.itemIds.length} favoritos</div>
          <div>{cat.recents.itemIds.length} recentes</div>
          <div className="mt-1">
            {cat.canInsert ? (
              <Badge variant="secondary">pronto p/ inserir</Badge>
            ) : (
              <Badge variant="outline">selecione cômodo</Badge>
            )}
          </div>
        </div>
      </aside>

      <section className="min-h-[420px]">
        {tab === "catalogo" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader>
              <CardTitle>Catálogo Paramétrico</CardTitle>
              <CardDescription>Busque, filtre e configure itens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Buscar por nome, tag ou descrição…"
                value={cat.filters.query ?? ""}
                onChange={(e) => cat.setFilters({ query: e.target.value })}
              />
              <div className="grid gap-2 md:grid-cols-[1fr_320px]">
                <div className="max-h-[440px] space-y-1 overflow-auto pr-1">
                  {cat.filtered.map((item) => {
                    const active = cat.selectedId === item.id;
                    const fav = cat.favorites.itemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => cat.select(item.id)}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                          active ? "border-primary/70 bg-primary/10" : "border-border/50 bg-background/30 hover:border-border"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.category} · {item.manufacturer} · {formatBRL(item.basePrice)}
                          </div>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); cat.toggleFavorite(item.id); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); cat.toggleFavorite(item.id); } }}
                          className={`text-xs ${fav ? "text-amber-400" : "text-muted-foreground"}`}
                        >
                          ★
                        </span>
                      </button>
                    );
                  })}
                  {cat.filtered.length === 0 && (
                    <div className="rounded-md border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
                      Nenhum item encontrado.
                    </div>
                  )}
                </div>

                <aside className="rounded-lg border border-border/60 bg-background/30 p-3 text-sm">
                  {cat.selected && cat.variant ? (
                    <div className="space-y-2">
                      <div className="font-medium">{cat.selected.name}</div>
                      <div className="text-xs text-muted-foreground">SKU {cat.selected.sku}</div>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="text-xs">
                          <span className="mb-1 block text-muted-foreground">L (mm)</span>
                          <Input type="number" value={cat.variant.widthMm} onChange={(e) => cat.updateVariant({ widthMm: Number(e.target.value) })} />
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block text-muted-foreground">A (mm)</span>
                          <Input type="number" value={cat.variant.heightMm} onChange={(e) => cat.updateVariant({ heightMm: Number(e.target.value) })} />
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block text-muted-foreground">P (mm)</span>
                          <Input type="number" value={cat.variant.depthMm} onChange={(e) => cat.updateVariant({ depthMm: Number(e.target.value) })} />
                        </label>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Material</div>
                        <select
                          className="w-full rounded-md border border-border/60 bg-background/40 px-2 py-1 text-sm"
                          value={cat.variant.materialId ?? ""}
                          onChange={(e) => cat.updateVariant({ materialId: e.target.value || undefined })}
                        >
                          <option value="">— nenhum —</option>
                          {cat.materials.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Puxador</div>
                        <select
                          className="w-full rounded-md border border-border/60 bg-background/40 px-2 py-1 text-sm"
                          value={cat.variant.handleId ?? ""}
                          onChange={(e) => cat.updateVariant({ handleId: e.target.value || undefined })}
                        >
                          <option value="">— nenhum —</option>
                          {cat.handles.map((h) => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                          ))}
                        </select>
                      </div>
                      {price && (
                        <div className="rounded-md border border-border/50 bg-background/40 p-2 text-xs">
                          <div>Base: {formatBRL(price.base)}</div>
                          <div>Material: {formatBRL(price.material)}</div>
                          <div>Ferragens: {formatBRL(price.hardware)}</div>
                          <div className="mt-1 font-medium text-foreground">Total: {formatBRL(price.total)}</div>
                        </div>
                      )}
                      {warnings.length > 0 && (
                        <ul className="space-y-1 text-xs">
                          {warnings.map((w) => (
                            <li key={w.id} className={w.severity === "error" ? "text-destructive" : "text-amber-500"}>
                              • {w.message}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button size="sm" disabled={!cat.canInsert} onClick={() => cat.insertSelected()}>
                        Inserir no cômodo ativo
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Selecione um item para configurar.</div>
                  )}
                </aside>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "colecoes" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader><CardTitle>Coleções</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {cat.collections.map((c) => (
                <div key={c.id} className="rounded-md border border-border/50 bg-background/30 p-3 text-sm">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.manufacturer} · {c.line} · {c.year}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === "favoritos" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Favoritos</CardTitle></div>
              <Button size="sm" variant="ghost" onClick={cat.clearFavorites}>Limpar</Button>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {cat.favorites.itemIds.length === 0 && <div className="text-xs text-muted-foreground">Nenhum favorito ainda.</div>}
              {cat.favorites.itemIds.map((id) => {
                const item = cat.items.find((i) => i.id === id);
                if (!item) return null;
                return (
                  <button key={id} onClick={() => cat.select(id)} className="block w-full rounded-md border border-border/50 bg-background/30 px-3 py-2 text-left text-sm hover:border-border">
                    {item.name}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {tab === "recentes" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Recentes</CardTitle></div>
              <Button size="sm" variant="ghost" onClick={cat.clearRecents}>Limpar</Button>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {cat.recents.itemIds.length === 0 && <div className="text-xs text-muted-foreground">Nenhum item recente.</div>}
              {cat.recents.itemIds.map((id) => {
                const item = cat.items.find((i) => i.id === id);
                if (!item) return null;
                return (
                  <button key={id} onClick={() => cat.select(id)} className="block w-full rounded-md border border-border/50 bg-background/30 px-3 py-2 text-left text-sm hover:border-border">
                    {item.name}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {tab === "fabricantes" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader><CardTitle>Fabricantes homologados</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {cat.manufacturers.map((m) => (
                <div key={m.id} className="rounded-md border border-border/50 bg-background/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{m.name}</div>
                    {m.premium && <Badge variant="secondary">premium</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.country} · {m.categories.length} categorias</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === "materiais" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader><CardTitle>Materiais</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {cat.materials.map((m) => (
                <div key={m.id} className="rounded-md border border-border/50 bg-background/30 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{formatBRL(m.pricePerM2)} / m²</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.manufacturer} · {m.kind.toUpperCase()} · {m.thicknessesMm.join(", ")}mm · {m.finish}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === "ferragens" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader><CardTitle>Ferragens</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-3">
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Puxadores</div>
                {cat.handles.map((h) => <div key={h.id} className="rounded-md border border-border/50 bg-background/30 px-2 py-1 text-xs">{h.name} · {formatBRL(h.price)}</div>)}
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Dobradiças</div>
                {cat.hinges.map((h) => <div key={h.id} className="rounded-md border border-border/50 bg-background/30 px-2 py-1 text-xs">{h.name} · {formatBRL(h.price)}</div>)}
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Corrediças</div>
                {cat.slides.map((s) => <div key={s.id} className="rounded-md border border-border/50 bg-background/30 px-2 py-1 text-xs">{s.name} · {formatBRL(s.price)}</div>)}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "importar" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader>
              <CardTitle>Importar catálogo</CardTitle>
              <CardDescription>CSV, JSON ou XML. Preview local — não persiste no banco.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                {(["csv", "json", "xml", "excel"] as const).map((f) => (
                  <Button key={f} size="sm" variant={importFmt === f ? "default" : "outline"} onClick={() => setImportFmt(f)}>{f.toUpperCase()}</Button>
                ))}
              </div>
              <textarea
                className="min-h-[180px] w-full rounded-md border border-border/60 bg-background/40 p-2 font-mono text-xs"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Cole o conteúdo aqui…"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const res = importCatalog(importText, importFmt);
                    setImportResult(`${res.items.length} itens · ${res.errors.length} erros`);
                  }}
                >
                  Processar
                </Button>
                {importResult && <div className="text-xs text-muted-foreground self-center">{importResult}</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "exportar" && (
          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader>
              <CardTitle>Exportar catálogo</CardTitle>
              <CardDescription>Escolha o formato e copie o conteúdo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                {(["csv", "json", "xml", "excel"] as const).map((f) => (
                  <Button key={f} size="sm" variant={exportFmt === f ? "default" : "outline"} onClick={() => setExportFmt(f)}>{f.toUpperCase()}</Button>
                ))}
              </div>
              <textarea
                readOnly
                className="min-h-[240px] w-full rounded-md border border-border/60 bg-background/40 p-2 font-mono text-xs"
                value={exportCatalog(cat.items, exportFmt).content}
              />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}