/**
 * Fase 3.30 — Painel de Render Real (aditivo ao RenderStudio existente).
 *
 * Dark First / Desktop First. Reutiliza `useRenderReal()` — nenhum Provider
 * novo. Foco: viewport before/after, exportação real, resumo da cena real,
 * integrações cross-domain.
 */
import { useState } from "react";
import { useRenderReal } from "../hooks/use-render-real";
import { REAL_EXPORT_RESOLUTIONS } from "../exporter";
import type { RealExportFormat, ViewportCompareMode } from "../types";

const COMPARE_MODES: readonly { readonly id: ViewportCompareMode; readonly label: string }[] = [
  { id: "before", label: "Antes" },
  { id: "after", label: "Depois" },
  { id: "split", label: "Split" },
  { id: "fullscreen", label: "Fullscreen" },
];

const FORMATS: readonly RealExportFormat[] = ["png", "jpeg", "webp", "tiff"];

export function RenderRealPanel() {
  const real = useRenderReal();
  const [format, setFormat] = useState<RealExportFormat>("png");
  const [resIdx, setResIdx] = useState(2);
  const res = REAL_EXPORT_RESOLUTIONS[resIdx] ?? REAL_EXPORT_RESOLUTIONS[0]!;

  return (
    <div className="flex h-full min-h-[560px] flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b0f19] p-4 text-slate-200">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-white">Render Enterprise Real</h2>
        <p className="text-xs text-slate-400">
          Cena real, iluminação HDRI, PBR, sombras físicas, exportação 4K/8K.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard k="Objetos" v={real.scene?.objects.length ?? 0} />
        <StatCard k="Luzes" v={real.scene?.lights.length ?? 0} />
        <StatCard k="Materiais PBR" v={real.scene?.materials.length ?? 0} />
        <StatCard k="Câmeras" v={real.scene?.cameras.length ?? 0} />
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
          Viewport — Comparação
        </p>
        <div className="flex flex-wrap gap-2">
          {COMPARE_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => real.setCompareMode(m.id)}
              className={`rounded-md px-3 py-1.5 text-xs transition ${
                real.compare.mode === m.id
                  ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {real.compare.mode === "split" && (
          <div className="mt-3">
            <label className="text-[11px] text-slate-400">
              Divisão: {real.compare.splitPercent}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={real.compare.splitPercent}
              onChange={(e) => real.setCompareSplit(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Exportação</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as RealExportFormat)}
            className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={resIdx}
            onChange={(e) => setResIdx(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
          >
            {REAL_EXPORT_RESOLUTIONS.map((r, i) => (
              <option key={r.label} value={i}>
                {r.label} — {r.width}×{r.height}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-500">
            Preset: {real.config?.presetId ?? "—"} • {real.performance?.performance.tier ?? "—"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Chamar `real.exportCanvas(canvas, {`{`} format, quality: 0.92, bitDepth: 8, width:{" "}
          {res.width}, height: {res.height} {`}`})` a partir do viewport ativo.
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Integrações</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries({
            Studio: real.integrations.studio,
            Realtime: real.integrations.realtime,
            Vídeo: real.integrations.video,
            IA: real.integrations.ai,
            Biblioteca: real.integrations.library,
            Produção: real.integrations.production,
            Planner: real.integrations.planner,
          }).map(([k, v]) => (
            <span
              key={k}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                v
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {k}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Fila</p>
        <p className="text-xs text-slate-400">
          {real.queue.queue.length} job(s) na fila • {real.queue.history.length} no histórico
        </p>
      </section>
    </div>
  );
}

function StatCard({ k, v }: { k: string; v: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{k}</p>
      <p className="mt-1 text-xl font-semibold text-white">{v.toLocaleString("pt-BR")}</p>
    </div>
  );
}
