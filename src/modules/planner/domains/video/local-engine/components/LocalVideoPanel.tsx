/**
 * Fase 3.22 — Painel do Motor de Vídeo Local (dark-first Dioris).
 *
 * Reutiliza inteiramente:
 *  - `LOCAL_CAMERAS` (Fase 3.21)
 *  - `LOCAL_QUALITY_PRESETS` (Fase 3.21)
 *  - `PlannerEditorProvider` (Fase 3.1)
 */
import { useState } from "react";
import {
  Camera, Clock, Film, Gauge, Layers, ListChecks, Music, Play, RefreshCw, Sparkles, X,
} from "lucide-react";
import { Button, FormSection, StatusBadge } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { LOCAL_CAMERAS, DEFAULT_LOCAL_CAMERA_ID } from "../../../render/local-engine/cameras";
import { LOCAL_QUALITY_PRESETS } from "../../../render/local-engine/quality";
import { useLocalVideo } from "../hooks/use-local-video";
import { LOCAL_CAMERA_MOVES } from "../camera-path";
import { SCENE_ANIMATION_CATALOG } from "../scene-animation";
import { LOCAL_TRANSITIONS } from "../transitions";
import {
  LOCAL_VIDEO_ASPECTS, LOCAL_VIDEO_CODECS, LOCAL_VIDEO_CONTAINERS, LOCAL_VIDEO_RESOLUTIONS,
} from "../encoder";
import { VIDEO_CAPTURE_SCOPES, buildVideoCapture } from "../capture";
import { makeClip, buildTimeline, totalFrames } from "../timeline";
import { timecode } from "../frames";
import type {
  LocalCameraMoveKind, LocalFps, LocalVideoAspect, LocalVideoCodec, LocalVideoContainer, LocalVideoScope,
} from "../types";
import type { LocalQualityId } from "../../../render/local-engine/types";

type Tab = "projeto" | "cameras" | "animacoes" | "timeline" | "audio" | "export" | "fila" | "performance";

const TABS: readonly { id: Tab; label: string; icon: typeof Camera }[] = [
  { id: "projeto", label: "Projeto", icon: Film },
  { id: "cameras", label: "Câmeras", icon: Camera },
  { id: "animacoes", label: "Animações", icon: Sparkles },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "audio", label: "Áudio", icon: Music },
  { id: "export", label: "Exportação", icon: Layers },
  { id: "fila", label: "Fila", icon: ListChecks },
  { id: "performance", label: "Performance", icon: Gauge },
];

const FPS_OPTIONS: readonly LocalFps[] = [24, 25, 30, 48, 50, 60];

export function LocalVideoPanel() {
  const {
    scene, playbook, timeline, output, qualityId, audio, viewport,
    queue, active, history,
    setTimeline, setOutput, setQuality, setAudio, setViewport,
    enqueue, cancel, retry, clearHistory,
  } = useLocalVideo();

  const [tab, setTab] = useState<Tab>("projeto");
  const [scope, setScope] = useState<LocalVideoScope>("current-environment");
  const [cameraId, setCameraId] = useState<string>(DEFAULT_LOCAL_CAMERA_ID);
  const [batchCams, setBatchCams] = useState<readonly string[]>([DEFAULT_LOCAL_CAMERA_ID]);
  const [moveId, setMoveId] = useState<LocalCameraMoveKind>("orbit");

  const toggleBatchCam = (id: string) =>
    setBatchCams((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const submit = () => {
    enqueue(buildVideoCapture({
      scope, qualityId, output, timeline, audio,
      cameraIds: scope === "batch" ? batchCams : [cameraId],
    }));
  };

  const addClip = () => {
    const start = timeline.durationSec;
    const clip = makeClip({ id: `clip.${timeline.clips.length + 1}`, cameraId, moveId, startSec: start });
    setTimeline(buildTimeline({ fps: timeline.fps, clips: [...timeline.clips, clip], tracks: timeline.tracks }));
  };

  const removeClip = (id: string) =>
    setTimeline(buildTimeline({ fps: timeline.fps, clips: timeline.clips.filter((c) => c.id !== id), tracks: timeline.tracks }));

  const setFps = (fps: LocalFps) =>
    setTimeline(buildTimeline({ fps, clips: timeline.clips, tracks: timeline.tracks }));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      {/* Viewport + timeline */}
      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(120%_80%_at_50%_-10%,hsl(var(--primary)/0.12),transparent),linear-gradient(180deg,#0a0d17,#04050a)]">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info"><Film className="mr-1 h-3 w-3" /> Motor Local · Vídeo</StatusBadge>
            <StatusBadge tone="neutral">{playbook?.qualityId.toUpperCase() ?? "—"}</StatusBadge>
            <StatusBadge tone="neutral">{output.resolution.label}</StatusBadge>
            <StatusBadge tone="neutral">{output.container.toUpperCase()} · {output.codec}</StatusBadge>
            <StatusBadge tone="neutral">{timeline.fps}fps</StatusBadge>
            <StatusBadge tone="neutral">{timeline.durationSec.toFixed(1)}s</StatusBadge>
          </div>
          <div className="flex items-center gap-1">
            {(["realtime", "preview", "before-after", "compare", "fullscreen"] as const).map((m) => (
              <button
                key={m} type="button"
                onClick={() => setViewport({ ...viewport, mode: m })}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] transition",
                  viewport.mode === m
                    ? "bg-primary/20 text-foreground ring-1 ring-inset ring-primary/40"
                    : "text-muted-foreground hover:bg-muted/40",
                )}
              >{m}</button>
            ))}
          </div>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-6 py-6">
          <div
            className="relative flex h-full min-h-[360px] w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl ring-1 ring-inset ring-border/50"
            style={{ aspectRatio: output.aspect.replace(":", " / ") }}
          >
            <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_50%,#0b0e1a,#1a1230,#0a1220,#0b0e1a)] opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_60%,hsl(var(--primary)/0.35),transparent),radial-gradient(50%_50%_at_20%_20%,hsl(var(--accent)/0.3),transparent)] mix-blend-screen" />
            <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0px,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_3px)]" />
            {viewport.showSafeArea && (
              <div className="pointer-events-none absolute inset-6 rounded-xl ring-1 ring-inset ring-primary/30" />
            )}

            <div className="pointer-events-none relative z-10 flex flex-col items-center gap-3 text-center">
              <span className="rounded-full bg-background/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary ring-1 ring-inset ring-primary/40 backdrop-blur">
                Dioris Local Video Engine
              </span>
              <h3 className="text-lg font-semibold tracking-tight">
                {active ? active.stage : "Pronto para gerar vídeo"}
              </h3>
              <p className="max-w-md text-xs text-muted-foreground">
                Algoritmo próprio · zero IA · reutiliza Render Local, Render Engine e Ultra Real.
                Pronto para FFmpeg / WebCodecs / WebGPU sem refatoração.
              </p>
              {active && (
                <>
                  <div className="mt-1 h-1.5 w-64 overflow-hidden rounded-full bg-background/50 ring-1 ring-inset ring-border/60">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent"
                      style={{ width: `${Math.round(active.progress * 100)}%` }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {active.frameCursor}/{active.frameTotal} frames
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <footer className="border-t border-border/50 bg-background/40 px-4 py-2 backdrop-blur">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Timeline · {totalFrames(timeline)} frames · {timecode(totalFrames(timeline), timeline.fps)}</span>
            <span>{timeline.clips.length} clip(s)</span>
          </div>
          <div className="mt-2 flex h-10 overflow-hidden rounded-lg ring-1 ring-inset ring-border/50">
            {timeline.clips.map((c, i) => {
              const pct = (c.durationSec / Math.max(0.01, timeline.durationSec)) * 100;
              const move = LOCAL_CAMERA_MOVES.find((m) => m.id === c.moveId);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => removeClip(c.id)}
                  className={cn(
                    "group relative flex items-center justify-center border-r border-border/60 text-[10px] transition",
                    i % 2 === 0 ? "bg-primary/15" : "bg-accent/15",
                    "hover:bg-destructive/20",
                  )}
                  style={{ width: `${pct}%` }}
                  title={`${move?.label ?? c.moveId} · ${c.durationSec.toFixed(1)}s (clique para remover)`}
                >
                  <span className="truncate px-2 opacity-80 group-hover:opacity-0">{move?.label ?? c.moveId}</span>
                  <X className="absolute h-3 w-3 opacity-0 group-hover:opacity-100" />
                </button>
              );
            })}
            {timeline.clips.length === 0 && (
              <div className="flex flex-1 items-center justify-center text-[10px] text-muted-foreground">Timeline vazia</div>
            )}
          </div>
        </footer>
      </section>

      {/* Sidebar controles */}
      <aside className="rounded-2xl border border-border/60 bg-background/40 backdrop-blur">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 px-2 pt-2">
          {TABS.map((t) => (
            <button
              key={t.id} type="button" onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-t-lg px-2.5 py-1.5 text-[11px] transition",
                tab === t.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-3 w-3" /> {t.label}
            </button>
          ))}
        </div>

        <div className="max-h-[580px] overflow-auto p-3">
          {tab === "projeto" && (
            <FormSection title="Escopo & qualidade" description="De onde vem o vídeo e com qual qualidade.">
              <div className="space-y-1.5">
                {VIDEO_CAPTURE_SCOPES.map((s) => (
                  <label key={s.id} className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition",
                    scope === s.id ? "border-primary/60 bg-primary/10" : "border-border/40 bg-muted/10 hover:bg-muted/20",
                  )}>
                    <input type="radio" name="vscope" className="mt-0.5 accent-primary"
                      checked={scope === s.id} onChange={() => setScope(s.id)} />
                    <div>
                      <div className="font-medium">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground">{s.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Qualidade</div>
                <div className="grid grid-cols-3 gap-1">
                  {LOCAL_QUALITY_PRESETS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setQuality(p.id as LocalQualityId)}
                      className={cn(
                        "rounded-md border px-1.5 py-1 text-[10px] transition",
                        qualityId === p.id ? "border-primary/60 bg-primary/10" : "border-border/40 bg-muted/10 hover:bg-muted/20",
                      )}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {scope === "batch" && (
                <div className="mt-3 space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Câmeras do lote</div>
                  {LOCAL_CAMERAS.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-[11px]">
                      <input type="checkbox" className="accent-primary"
                        checked={batchCams.includes(c.id)} onChange={() => toggleBatchCam(c.id)} />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </FormSection>
          )}

          {tab === "cameras" && (
            <div className="space-y-3">
              <FormSection title="Câmera ativa" description="Utilizada para adicionar novos clips.">
                <div className="space-y-1.5">
                  {LOCAL_CAMERAS.map((c) => (
                    <button key={c.id} type="button" onClick={() => setCameraId(c.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left text-[11px] transition",
                        cameraId === c.id ? "border-primary/60 bg-primary/10" : "border-border/40 bg-muted/10 hover:bg-muted/20",
                      )}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-[9px] uppercase text-muted-foreground">{c.kind}</span>
                      </div>
                      <div className="mt-0.5 text-[9px] text-muted-foreground">
                        {c.focalLengthMm}mm · f/{c.apertureF} · ISO {c.iso}
                      </div>
                    </button>
                  ))}
                </div>
              </FormSection>
              <FormSection title="Movimento" description="Aplicado ao próximo clip.">
                <div className="grid grid-cols-2 gap-1">
                  {LOCAL_CAMERA_MOVES.map((m) => (
                    <button key={m.id} type="button" onClick={() => setMoveId(m.id)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-left text-[10px] transition",
                        moveId === m.id ? "border-primary/60 bg-primary/10" : "border-border/40 bg-muted/10 hover:bg-muted/20",
                      )}>
                      <div className="font-medium">{m.label}</div>
                      <div className="text-[9px] text-muted-foreground">{m.defaultDurationSec}s · {m.easing}</div>
                    </button>
                  ))}
                </div>
                <Button className="mt-2 w-full" onClick={addClip}>
                  <Play className="mr-1 h-3 w-3" /> Adicionar clip à timeline
                </Button>
              </FormSection>
            </div>
          )}

          {tab === "animacoes" && (
            <FormSection title="Animações de cena" description="Portas, gavetas, LED, iluminação, estrutura, ferragens.">
              <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                {SCENE_ANIMATION_CATALOG.map((a) => (
                  <li key={a.kind} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1">
                    <Sparkles className="mr-1 inline h-3 w-3 text-primary" /> {a.label}
                    <span className="ml-1 text-[9px] opacity-70">{a.duration}s</span>
                  </li>
                ))}
                {["Abrir/Fechar Portas","Abrir/Fechar Gavetas","LED On/Off","Trocar Iluminação"].map((e) => (
                  <li key={e} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1">
                    <Sparkles className="mr-1 inline h-3 w-3 text-accent" /> {e}
                  </li>
                ))}
              </ul>
            </FormSection>
          )}

          {tab === "timeline" && (
            <FormSection title="Timeline" description="FPS, transições, clips.">
              <label className="text-[11px] text-muted-foreground">
                FPS
                <select className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                  value={timeline.fps}
                  onChange={(e) => setFps(Number(e.target.value) as LocalFps)}>
                  {FPS_OPTIONS.map((f) => <option key={f} value={f}>{f} fps</option>)}
                </select>
              </label>
              <div className="mt-3 space-y-1.5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Transições disponíveis</div>
                <div className="flex flex-wrap gap-1">
                  {LOCAL_TRANSITIONS.map((t) => (
                    <span key={t.kind} className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {t.label} · {t.defaultSec}s
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Clips ({timeline.clips.length})</div>
                {timeline.clips.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-2 py-1 text-[11px]">
                    <span>{c.label}</span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{c.durationSec.toFixed(1)}s</span>
                      <button type="button" onClick={() => removeClip(c.id)} className="text-destructive hover:opacity-80">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>
          )}

          {tab === "audio" && (
            <FormSection title="Áudio (algoritmo próprio)" description="Preparação para trilha, narração e legenda — sem integrar APIs.">
              <label className="flex items-center gap-2 text-[11px]">
                <input type="checkbox" className="accent-primary"
                  checked={audio.enabled} onChange={(e) => setAudio({ ...audio, enabled: e.target.checked })} />
                Habilitar trilha
              </label>
              <label className="mt-2 block text-[11px] text-muted-foreground">
                Narração (texto)
                <textarea rows={3}
                  className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                  value={audio.narrationText ?? ""}
                  onChange={(e) => setAudio({ ...audio, narrationText: e.target.value })} />
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[11px] text-muted-foreground">
                  Idioma
                  <select className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={audio.language}
                    onChange={(e) => setAudio({ ...audio, language: e.target.value as "pt-BR" | "en-US" | "es-ES" })}>
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español (ES)</option>
                  </select>
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Trilha
                  <select className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={audio.musicMood}
                    onChange={(e) => setAudio({ ...audio, musicMood: e.target.value as LocalAudioMood })}>
                    {(["corporativo","cinema","lounge","minimal","energetico","elegante"] as const).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Volume trilha: {(audio.musicVolume * 100).toFixed(0)}%
                  <input type="range" min={0} max={1} step={0.05} className="mt-1 w-full accent-primary"
                    value={audio.musicVolume}
                    onChange={(e) => setAudio({ ...audio, musicVolume: Number(e.target.value) })} />
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Volume narração: {(audio.narrationVolume * 100).toFixed(0)}%
                  <input type="range" min={0} max={1} step={0.05} className="mt-1 w-full accent-primary"
                    value={audio.narrationVolume}
                    onChange={(e) => setAudio({ ...audio, narrationVolume: Number(e.target.value) })} />
                </label>
                <label className="col-span-2 flex items-center gap-2 text-[11px]">
                  <input type="checkbox" className="accent-primary"
                    checked={audio.subtitleEnabled} onChange={(e) => setAudio({ ...audio, subtitleEnabled: e.target.checked })} />
                  Legenda embutida
                </label>
                <label className="col-span-2 flex items-center gap-2 text-[11px]">
                  <input type="checkbox" className="accent-primary"
                    checked={audio.syncToClips} onChange={(e) => setAudio({ ...audio, syncToClips: e.target.checked })} />
                  Sincronizar com clips
                </label>
              </div>
            </FormSection>
          )}

          {tab === "export" && (
            <FormSection title="Exportação" description="Container, codec, aspecto, resolução e bitrate.">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-muted-foreground">
                  Container
                  <select className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={output.container}
                    onChange={(e) => setOutput({ ...output, container: e.target.value as LocalVideoContainer })}>
                    {LOCAL_VIDEO_CONTAINERS.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Codec
                  <select className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={output.codec}
                    onChange={(e) => setOutput({ ...output, codec: e.target.value as LocalVideoCodec })}>
                    {LOCAL_VIDEO_CODECS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Aspecto
                  <select className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={output.aspect}
                    onChange={(e) => setOutput({ ...output, aspect: e.target.value as LocalVideoAspect })}>
                    {LOCAL_VIDEO_ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Resolução
                  <select className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={output.resolution.label}
                    onChange={(e) => {
                      const r = LOCAL_VIDEO_RESOLUTIONS.find((x) => x.label === e.target.value) ?? LOCAL_VIDEO_RESOLUTIONS[1];
                      setOutput({ ...output, resolution: r });
                    }}>
                    {LOCAL_VIDEO_RESOLUTIONS.map((r) => <option key={r.label} value={r.label}>{r.label}</option>)}
                  </select>
                </label>
                <label className="col-span-2 text-[11px] text-muted-foreground">
                  Bitrate: {(output.bitrateKbps / 1000).toFixed(1)} Mbps
                  <input type="range" min={2000} max={80000} step={500} className="mt-1 w-full accent-primary"
                    value={output.bitrateKbps}
                    onChange={(e) => setOutput({ ...output, bitrateKbps: Number(e.target.value) })} />
                </label>
                <label className="col-span-2 flex items-center gap-2 text-[11px]">
                  <input type="checkbox" className="accent-primary"
                    checked={output.transparentBackground}
                    onChange={(e) => setOutput({ ...output, transparentBackground: e.target.checked })} />
                  Fundo transparente (quando o codec suportar)
                </label>
              </div>
            </FormSection>
          )}

          {tab === "fila" && (
            <div className="space-y-3">
              <FormSection title={`Fila (${queue.length})`} description="Jobs enfileirados/executando.">
                {queue.length === 0 && <p className="text-[11px] text-muted-foreground">Nenhum job na fila.</p>}
                {queue.map((j) => (
                  <div key={j.id} className="rounded-lg border border-border/40 bg-muted/10 p-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{j.title}</span>
                      <button type="button" onClick={() => cancel(j.id)} className="text-destructive hover:opacity-80">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-background/50">
                      <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.round(j.progress * 100)}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
                      <span>{j.stage}</span>
                      <span>{j.frameCursor}/{j.frameTotal} frames</span>
                    </div>
                  </div>
                ))}
              </FormSection>
              <FormSection title={`Histórico (${history.length})`} description="Últimos jobs concluídos.">
                {history.length === 0 && <p className="text-[11px] text-muted-foreground">Nada por aqui ainda.</p>}
                {history.length > 0 && (
                  <Button variant="outline" className="mb-2" onClick={clearHistory}>Limpar histórico</Button>
                )}
                {history.map((j) => (
                  <div key={j.id} className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-2 py-1 text-[11px]">
                    <div className="min-w-0">
                      <div className="truncate">{j.title}</div>
                      <div className="text-[9px] text-muted-foreground">{j.status} · {j.frameTotal} frames</div>
                    </div>
                    <button type="button" onClick={() => retry(j.id)} className="text-muted-foreground hover:text-foreground">
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </FormSection>
            </div>
          )}

          {tab === "performance" && (
            <FormSection title="Performance" description="Cache, streaming, render incremental, frame skip, compressão, paralelismo.">
              <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                {(playbook ? [
                  ["Tier", playbook.performance.tier],
                  ["Cache", playbook.performance.cache ? "on" : "off"],
                  ["Streaming", playbook.performance.streaming ? "on" : "off"],
                  ["Incremental", playbook.performance.incremental ? "on" : "off"],
                  ["Frame skip", String(playbook.performance.frameSkip)],
                  ["Compressão", playbook.performance.compression ? "on" : "off"],
                  ["Paralelismo", `${playbook.performance.parallelFrames}×`],
                ] : [["—", "—"]]).map(([k, v]) => (
                  <li key={k} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1">
                    <span className="opacity-70">{k}</span>: <span className="font-medium text-foreground">{v}</span>
                  </li>
                ))}
              </ul>
            </FormSection>
          )}
        </div>
      </aside>

      <section className="xl:col-span-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {scene ? (
              <>
                <span>{scene.roomCount} cômodo(s)</span><span>·</span>
                <span>{scene.moduleCount} módulos</span><span>·</span>
                <span>{scene.openableCount} aberturas</span><span>·</span>
                <span>{scene.lightCount} luzes</span><span>·</span>
                <span>{scene.frameCount} frames</span><span>·</span>
                <span>{scene.triangleEstimate.toLocaleString("pt-BR")} tris (est.)</span>
              </>
            ) : <span>Nenhum projeto carregado.</span>}
          </div>
          <Button onClick={submit} disabled={!scene || timeline.clips.length === 0}>
            <Play className="mr-1.5 h-4 w-4" /> Gerar vídeo local
          </Button>
        </div>
      </section>
    </div>
  );
}

type LocalAudioMood = "corporativo" | "cinema" | "lounge" | "minimal" | "energetico" | "elegante";