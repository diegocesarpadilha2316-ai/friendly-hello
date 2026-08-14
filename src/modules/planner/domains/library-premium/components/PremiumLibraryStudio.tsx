import { useMemo, useState } from "react";
import { usePremiumLibrary } from "../hooks/use-premium-library";
import {
  PREMIUM_MATERIAL_CATEGORIES,
  PREMIUM_HARDWARE_CATEGORIES,
  PREMIUM_MANUFACTURERS,
  GLASS_TYPES,
  MIRROR_TYPES,
  LED_COMPONENTS,
} from "../types";
import { initialSyncState, markReady } from "../services/sync";
import { exportPremium } from "../services/exports";

const TABS = [
  "Dashboard",
  "Materiais",
  "Ferragens",
  "Vidros",
  "Espelhos",
  "LED",
  "Fabricantes",
  "Coleções",
  "Favoritos",
  "Importação",
  "Exportação",
  "Sincronização",
] as const;
type Tab = (typeof TABS)[number];

/**
 * Fase 3.29 — PremiumLibraryStudio.
 * UI Dark First / Desktop First. Reutiliza `usePremiumLibrary()` como
 * única fonte de dados. Nenhum Provider/Store novo.
 */
export function PremiumLibraryStudio() {
  const lib = usePremiumLibrary();
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [query, setQuery] = useState("");
  const [sync, setSync] = useState(initialSyncState());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { materials: lib.materials, hardware: lib.hardware };
    return {
      materials: lib.materials.filter((m) =>
        [m.manufacturer, m.category, m.colorName ?? "", m.pattern ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      ),
      hardware: lib.hardware.filter((h) =>
        [h.manufacturer, h.category, h.model, h.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      ),
    };
  }, [lib.materials, lib.hardware, query]);

  return (
    <div className="flex h-full min-h-[640px] flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b0f19] p-4 text-slate-200">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Biblioteca Oficial Premium
          </h2>
          <p className="text-xs text-slate-400">
            Materiais, ferragens, vidros, espelhos e LED —{" "}
            {lib.stats.totalMaterials + lib.stats.totalHardware} itens
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por fabricante, cor, modelo…"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 md:w-96"
        />
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === t
                ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <section className="min-h-0 flex-1 overflow-auto">
        {tab === "Dashboard" && <DashboardView stats={lib.stats} />}
        {tab === "Materiais" && (
          <CategoryGrid
            title="Materiais"
            categories={PREMIUM_MATERIAL_CATEGORIES as readonly string[]}
            items={filtered.materials.map((m) => ({
              id: m.id,
              a: m.manufacturer,
              b: m.colorName ?? m.pattern ?? "—",
              c: m.category,
            }))}
          />
        )}
        {tab === "Ferragens" && (
          <CategoryGrid
            title="Ferragens"
            categories={PREMIUM_HARDWARE_CATEGORIES as readonly string[]}
            items={filtered.hardware.map((h) => ({
              id: h.id,
              a: h.manufacturer,
              b: h.model,
              c: h.category,
            }))}
          />
        )}
        {tab === "Vidros" && (
          <ChipGrid title="Tipos de vidro" chips={GLASS_TYPES as readonly string[]} />
        )}
        {tab === "Espelhos" && (
          <ChipGrid title="Tipos de espelho" chips={MIRROR_TYPES as readonly string[]} />
        )}
        {tab === "LED" && (
          <ChipGrid title="Componentes LED" chips={LED_COMPONENTS as readonly string[]} />
        )}
        {tab === "Fabricantes" && (
          <ChipGrid
            title="Fabricantes oficiais"
            chips={PREMIUM_MANUFACTURERS as readonly string[]}
          />
        )}
        {tab === "Coleções" && (
          <p className="text-sm text-slate-400">
            {lib.stats.totalCollections} coleções detectadas — sincronização entra em fase futura.
          </p>
        )}
        {tab === "Favoritos" && (
          <p className="text-sm text-slate-400">
            {lib.favorites.length} favoritos • {lib.recents.length} recentes
          </p>
        )}
        {tab === "Importação" && (
          <p className="text-sm text-slate-400">
            Formatos suportados: CSV, Excel, XML, JSON, ZIP, Promob, SketchUp, Bibliotecas próprias.
            Parsers CSV e JSON já ativos via Biblioteca Oficial.
          </p>
        )}
        {tab === "Exportação" && (
          <div className="flex flex-wrap gap-2">
            {(["csv", "excel", "xml", "json", "zip"] as const).map((f) => (
              <button
                key={f}
                onClick={() =>
                  exportPremium({ format: f, materials: lib.materials, hardware: lib.hardware })
                }
                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
              >
                Exportar {f.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {tab === "Sincronização" && (
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
              Status: {sync.status}
            </span>
            <button
              onClick={() => setSync(markReady(sync))}
              className="rounded-md bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-1.5 text-xs font-medium text-white"
            >
              Preparar sincronização
            </button>
          </div>
        )}
      </section>

      {lib.loading && <p className="text-xs text-slate-500">Carregando biblioteca…</p>}
    </div>
  );
}

function DashboardView({ stats }: { stats: ReturnType<typeof usePremiumLibrary>["stats"] }) {
  const cards = [
    { k: "Materiais", v: stats.totalMaterials },
    { k: "Ferragens", v: stats.totalHardware },
    { k: "Fabricantes", v: stats.totalManufacturers },
    { k: "Coleções", v: stats.totalCollections },
    { k: "Favoritos", v: stats.totalFavorites },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((c) => (
        <div key={c.k} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{c.k}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{c.v.toLocaleString("pt-BR")}</p>
        </div>
      ))}
    </div>
  );
}

function CategoryGrid({
  title,
  categories,
  items,
}: {
  title: string;
  categories: readonly string[];
  items: readonly { id: string; a: string; b: string; c: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {categories.map((c) => (
          <span
            key={c}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300"
          >
            {c}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {title}: {items.length} itens
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 60).map((it) => (
          <div key={it.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
            <p className="font-medium text-white">{it.b}</p>
            <p className="text-slate-400">
              {it.a} • {it.c}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChipGrid({ title, chips }: { title: string; chips: readonly string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <span
            key={c}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
