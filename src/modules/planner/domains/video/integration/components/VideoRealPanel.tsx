/**
 * Fase 3.31 — Painel Video Enterprise Real (aditivo ao VideoStudio).
 *
 * Dark First / Desktop First. Reutiliza `useVideoReal()` — nenhum
 * Provider novo. Foco: encoders detectados, orçamento real, resumo da
 * cena, integrações cross-domain e exportação real.
 */
import { useMemo } from "react";
import { useVideoReal } from "../hooks/use-video-real";
import type { RealVideoEncoderId } from "../types";

const ENCODERS: readonly RealVideoEncoderId[] = ["auto", "webcodecs", "mediarecorder", "ffmpeg-wasm", "gif-encoder", "png-sequence"];

export function VideoRealPanel() {
  const real = useVideoReal();
  const { local, resolved, budget, encoders, integrations } = real;

  const encoderCards = useMemo(
    () =>
      encoders.map((e) => (
        <div
          key={e.id}
          className={`rounded-xl border p-3 text-xs ${
            e.available
              ? "border-emerald-400/30 bg-emerald-500/5 text-emerald-100"
              : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">{e.label}</span>
            <span className="text-[10px] uppercase tracking-wider">
              {e.available ? "Disponível" : "Indisponível"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{e.notes}</p>
          <p className="mt-1 text-[10px] text-slate-500">
            Máx: {e.maxTier.toUpperCase()} • {e.containers.join(", ")}
          </p>
        </div>
      )),
    [encoders],
  );

  return (
    <div className="flex h-full min-h-[560px] flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b0f19] p-4 text-slate-200">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-white">Video Enterprise Real</h2>
        <p className="text-xs text-slate-400">
          Captura frame-a-frame do viewport, timeline real, encoders nativos, exportação até 16K.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard k="Frames" v={budget?.frameCount ?? 0} />
        <StatCard k="Duração (s)" v={budget?.durationSec ?? 0} />
        <StatCard k="Paralelismo" v={budget?.parallelFrames ?? 0} />
        <StatCard k="Bytes~" v={Math.round((budget?.bytesEstimate ?? 0) / 1024 / 1024)} suffix=" MB" />
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Encoder</p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <select
            value={real.encoderId}
            onChange={(e) => real.setEncoder(e.target.value as RealVideoEncoderId)}
            className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
          >
            {ENCODERS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-500">
            Selecionado: <strong className="text-white">{resolved?.encoderId ?? "—"}</strong> •{" "}
            {resolved?.resolution.label ?? "—"} • {resolved?.output.container.toUpperCase() ?? "—"}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">{encoderCards}</div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Timeline</p>
        <p className="text-xs text-slate-400">
          {local.timeline.clips.length} clip(s) • {local.timeline.tracks.length} track(s) •{" "}
          {local.timeline.fps} fps • {local.timeline.durationSec.toFixed(1)}s
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Integrações</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries({
            Render: integrations.render,
            Realtime: integrations.realtime,
            IA: integrations.ai,
            Produção: integrations.production,
            Biblioteca: integrations.library,
            Configurador: integrations.configurator,
            Planner: integrations.planner,
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
          Enterprise: {real.queue.queue.length} • Local: {real.local.queue.length} • Histórico:{" "}
          {real.queue.history.length + real.local.history.length}
        </p>
      </section>
    </div>
  );
}

function StatCard({ k, v, suffix }: { k: string; v: number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{k}</p>
      <p className="mt-1 text-xl font-semibold text-white">
        {v.toLocaleString("pt-BR")}
        {suffix ?? ""}
      </p>
    </div>
  );
}