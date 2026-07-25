/**
 * Fase 3.26 — Studio de gestão da Biblioteca Oficial Dioris.
 * 12 abas — consome exclusivamente serviços/hook do próprio domínio.
 */
import { useMemo, useState } from "react";
import { Search, Package, Wrench, Star, Clock, Filter, Download, Upload, Layers, Cog, Cpu, Sparkles } from "lucide-react";
import { Button, SearchInput, StatusBadge, EmptyState } from "@/core/components/ui-kit";
import {
  LIBRARY_MANUFACTURERS,
  listMaterialCategories,
  listHardwareCategories,
  readFavorites,
  readRecents,
  exportMaterials,
  exportHardware,
  importAuto,
} from "../services";
import type { LibraryImportReport } from "../types";
import { useLibrarySearch } from "../hooks/use-library";

type TabId =
  | "materiais" | "ferragens" | "puxadores" | "dobradicas" | "corredicas"
  | "led" | "perfis" | "favoritos" | "recentes" | "filtros" | "importar" | "exportar";

const TABS: readonly { id: TabId; label: string; icon: typeof Package }[] = [
  { id: "materiais", label: "Materiais", icon: Layers },
  { id: "ferragens", label: "Ferragens", icon: Wrench },
  { id: "puxadores", label: "Puxadores", icon: Cog },
  { id: "dobradicas", label: "Dobradiças", icon: Cog },
  { id: "corredicas", label: "Corrediças", icon: Cog },
  { id: "led", label: "Iluminação", icon: Sparkles },
  { id: "perfis", label: "Perfis", icon: Cpu },
  { id: "favoritos", label: "Favoritos", icon: Star },
  { id: "recentes", label: "Recentes", icon: Clock },
  { id: "filtros", label: "Filtros", icon: Filter },
  { id: "importar", label: "Importar", icon: Upload },
  { id: "exportar", label: "Exportar", icon: Download },
];

export function LibraryStudio() {
  const [tab, setTab] = useState<TabId>("materiais");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [report, setReport] = useState<LibraryImportReport | null>(null);

  const filters = useMemo(
    () => ({ query, category, limit: 60 }),
    [query, category],
  );
  const { materials, hardware, loading } = useLibrarySearch(filters);

  const favorites = readFavorites();
  const recents = readRecents();

  function download(blob: { content: string; mime: string; filename: string }) {
    if (typeof window === "undefined") return;
    const url = URL.createObjectURL(new Blob([blob.content], { type: blob.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = blob.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(file: File) {
    const text = await file.text();
    setReport(importAuto(text, file.name));
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Biblioteca Oficial Dioris</h2>
          <p className="text-xs text-muted-foreground">
            {LIBRARY_MANUFACTURERS ? Object.keys(LIBRARY_MANUFACTURERS).length : 0} fabricantes homologados · fonte única para 2D, 3D, IA, Render, Produção
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone="info">{materials.length} materiais</StatusBadge>
          <StatusBadge tone="success">{hardware.length} ferragens</StatusBadge>
          {loading ? <StatusBadge tone="warning">Carregando…</StatusBadge> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border/40 bg-muted/20 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors " +
              (tab === t.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-background/60")
            }
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por fabricante, padrão, modelo…"
          className="w-72"
        />
        <select
          className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs"
          value={category ?? ""}
          onChange={(e) => setCategory(e.target.value || undefined)}
        >
          <option value="">Todas as categorias</option>
          {(tab === "ferragens"
            ? listHardwareCategories()
            : listMaterialCategories()
          ).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border/40 bg-background/40 p-3">
        {tab === "materiais" ? (
          <Grid items={materials.map((m) => ({
            key: m.id, title: m.name, subtitle: `${m.manufacturer} · ${m.thicknessMm}mm`,
            hint: m.pricePerM2 != null ? `R$ ${m.pricePerM2.toFixed(2)}/m²` : "—",
            swatch: m.colorHex ?? undefined, image: m.textureUrl ?? undefined,
          }))} empty="Nenhum material encontrado." />
        ) : tab === "ferragens" ? (
          <Grid items={hardware.map((h) => ({
            key: h.id, title: h.model, subtitle: `${h.manufacturer} · ${h.category}`,
            hint: h.unitPrice != null ? `R$ ${h.unitPrice.toFixed(2)}` : "—",
            image: h.imageUrl ?? undefined,
          }))} empty="Nenhuma ferragem encontrada." />
        ) : tab === "puxadores" || tab === "dobradicas" || tab === "corredicas" || tab === "led" || tab === "perfis" ? (
          <Grid items={hardware
            .filter((h) => matchesTab(h.category, tab))
            .map((h) => ({
              key: h.id, title: h.model, subtitle: `${h.manufacturer} · ${h.category}`,
              hint: h.unitPrice != null ? `R$ ${h.unitPrice.toFixed(2)}` : "—",
              image: h.imageUrl ?? undefined,
            }))} empty="Nenhum item nesta categoria." />
        ) : tab === "favoritos" ? (
          <EmptyState
            title="Favoritos"
            description={`${favorites.materials.length} materiais · ${favorites.hardware.length} ferragens marcados como favoritos.`}
            icon={<Star className="h-6 w-6" />}
          />
        ) : tab === "recentes" ? (
          <EmptyState
            title="Recentes"
            description={`${recents.materials.length} materiais · ${recents.hardware.length} ferragens utilizados recentemente.`}
            icon={<Clock className="h-6 w-6" />}
          />
        ) : tab === "filtros" ? (
          <EmptyState
            title="Filtros avançados"
            description="Combine fabricante, categoria, linha, cor, espessura e faixa de preço para restringir a busca."
            icon={<Filter className="h-6 w-6" />}
          />
        ) : tab === "importar" ? (
          <ImportPanel report={report} onFile={onImportFile} />
        ) : (
          <ExportPanel
            onMaterials={() => download(exportMaterials(materials, "excel"))}
            onHardware={() => download(exportHardware(hardware, "excel"))}
            onMaterialsJSON={() => download(exportMaterials(materials, "json"))}
            onHardwareJSON={() => download(exportHardware(hardware, "json"))}
          />
        )}
      </div>
    </div>
  );
}

function matchesTab(category: string, tab: TabId): boolean {
  const c = category.toLowerCase();
  if (tab === "puxadores") return c.includes("puxador");
  if (tab === "dobradicas") return c.includes("dobradi");
  if (tab === "corredicas") return c.includes("corredi");
  if (tab === "led") return c.includes("led") || c.includes("fonte") || c.includes("sensor");
  if (tab === "perfis") return c.includes("perfil");
  return false;
}

interface GridItem { key: string; title: string; subtitle?: string; hint?: string; image?: string; swatch?: string }

function Grid({ items, empty }: { items: readonly GridItem[]; empty: string }) {
  if (!items.length) {
    return <EmptyState title="Sem resultados" description={empty} icon={<Search className="h-6 w-6" />} />;
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {items.map((i) => (
        <div key={i.key} className="group rounded-lg border border-border/60 bg-background/40 p-2 transition-colors hover:border-primary/50">
          <div
            className="mb-1.5 aspect-square rounded-md bg-muted/60 bg-cover bg-center"
            style={{ backgroundImage: i.image ? `url(${i.image})` : undefined, background: !i.image && i.swatch ? i.swatch : undefined }}
          />
          <div className="truncate text-xs font-medium">{i.title}</div>
          {i.subtitle ? <div className="truncate text-[10px] text-muted-foreground">{i.subtitle}</div> : null}
          {i.hint ? <div className="mt-0.5 text-[10px] text-primary">{i.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}

function ImportPanel({ report, onFile }: { report: LibraryImportReport | null; onFile: (f: File) => void }) {
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/40 p-6 text-sm text-muted-foreground hover:border-primary/50">
        <input type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <Upload className="mr-2 h-4 w-4" />
        Selecionar CSV ou JSON da Biblioteca Dioris
      </label>
      {report ? (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-background/40 p-3 text-xs sm:grid-cols-4">
          <Stat label="Total" value={report.total} />
          <Stat label="Válidos" value={report.valid} tone="success" />
          <Stat label="Inválidos" value={report.invalid} tone={report.invalid ? "warning" : undefined} />
          <Stat label="Erros" value={report.errors.length} tone={report.errors.length ? "warning" : undefined} />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          O importador é 100% determinístico e reutiliza a fonte oficial já persistida em Supabase (Fase 3.19).
        </p>
      )}
    </div>
  );
}

function ExportPanel(props: { onMaterials: () => void; onHardware: () => void; onMaterialsJSON: () => void; onHardwareJSON: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button size="sm" variant="secondary" onClick={props.onMaterials}><Download className="mr-1 h-4 w-4" /> Materiais (CSV)</Button>
      <Button size="sm" variant="secondary" onClick={props.onMaterialsJSON}><Download className="mr-1 h-4 w-4" /> Materiais (JSON)</Button>
      <Button size="sm" variant="secondary" onClick={props.onHardware}><Download className="mr-1 h-4 w-4" /> Ferragens (CSV)</Button>
      <Button size="sm" variant="secondary" onClick={props.onHardwareJSON}><Download className="mr-1 h-4 w-4" /> Ferragens (JSON)</Button>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) {
  return (
    <div className="rounded-md border border-border/50 bg-background/60 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={"text-lg font-semibold " + (tone === "success" ? "text-emerald-400" : tone === "warning" ? "text-amber-400" : "")}>{value}</div>
    </div>
  );
}