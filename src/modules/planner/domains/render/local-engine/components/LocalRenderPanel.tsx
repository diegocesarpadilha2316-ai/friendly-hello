/**
 * Fase 3.21 — Painel do Renderizador Local (dark-first Dioris).
 */
import { useState } from "react";
import {
  Camera, Cpu, Gauge, Image as ImageIcon, Layers, Lightbulb,
  ListChecks, Palette, Play, Sparkles, Square, X, RefreshCw, Wand2,
} from "lucide-react";
import { Button, FormSection, StatusBadge } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useLocalRender } from "../hooks/use-local-render";
import { LOCAL_QUALITY_PRESETS } from "../quality";
import { LOCAL_LIGHTS } from "../lights";
import { LOCAL_CAMERAS, DEFAULT_LOCAL_CAMERA_ID } from "../cameras";
import { LOCAL_MATERIAL_FAMILIES, listLocalMaterials } from "../materials";
import { CAPTURE_SCOPES, buildCaptureRequest, DEFAULT_OUTPUT } from "../capture";
import type {
  LocalCaptureScope, LocalImageFormat, LocalBitDepth, LocalQualityId,
} from "../types";

type Tab =
  | "render" | "qualidade" | "luzes" | "materiais" | "cameras"
  | "pos" | "captura" | "fila" | "performance";

const TABS: readonly { id: Tab; label: string; icon: typeof Camera }[] = [
  { id: "render", label: "Render", icon: Play },
  { id: "qualidade", label: "Qualidade", icon: Sparkles },
  { id: "luzes", label: "Luzes", icon: Lightbulb },
  { id: "materiais", label: "Materiais", icon: Palette },
  { id: "cameras", label: "Câmeras", icon: Camera },
  { id: "pos", label: "Pós", icon: Wand2 },
  { id: "captura", label: "Captura", icon: ImageIcon },
  { id: "fila", label: "Fila", icon: ListChecks },
  { id: "performance", label: "Performance", icon: Gauge },
];

const RESOLUTIONS: readonly { label: string; width: number; height: number }[] = [
  { label: "HD 720p", width: 1280, height: 720 },
  { label: "Full HD 1080p", width: 1920, height: 1080 },
  { label: "2K 1440p", width: 2560, height: 1440 },
  { label: "4K 2160p", width: 3840, height: 2160 },
  { label: "8K 4320p", width: 7680, height: 4320 },
];

const FORMATS: readonly LocalImageFormat[] = ["png", "jpeg", "webp", "tiff"];
const BIT_DEPTHS: readonly LocalBitDepth[] = [8, 16, 32];

export function LocalRenderPanel() {
  const {
    scene, playbook, queue, active, history,
    qualityId, output, viewport,
    setQuality, setOutput, setViewport,
    enqueue, enqueueSingle, cancel, retry, clearHistory,
  } = useLocalRender();

  const [tab, setTab] = useState<Tab>("render");
  const [cameraId, setCameraId] = useState<string>(DEFAULT_LOCAL_CAMERA_ID);
  const [scope, setScope] = useState<LocalCaptureScope>("single");
  const [batchCams, setBatchCams] = useState<readonly string[]>([DEFAULT_LOCAL_CAMERA_ID]);

  const toggleBatchCam = (id: string) =>
    setBatchCams((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const submit = () => {
    if (scope === "single") { enqueueSingle(cameraId); return; }
    enqueue(buildCaptureRequest({ scope, qualityId, output, cameraIds: batchCams }));
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(120%_80%_at_50%_-10%,hsl(var(--primary)/0.12),transparent),linear-gradient(180deg,#0a0d17,#04050a)]">
        <header className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <StatusBadge tone="info"><Cpu className="mr-1 h-3 w-3" /> Motor Local</StatusBadge>
            <StatusBadge tone="neutral">{playbook?.quality.label ?? "—"}</StatusBadge>
            <StatusBadge tone="neutral">{output.resolution.label}</StatusBadge>
            <StatusBadge tone="neutral">{output.format.toUpperCase()} · {output.bitDepth}bit</StatusBadge>
          </div>
          <div className="flex items-center gap-1">
            {(["realtime","preview","before-after","quality-compare","fullscreen"] as const).map((m) => (
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
          <div className="relative flex h-full min-h-[380px] w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl ring-1 ring-inset ring-border/50">
            <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_50%,#0b0e1a,#1a1230,#0a1220,#0b0e1a)] opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_60%,hsl(var(--primary)/0.35),transparent),radial-gradient(50%_50%_at_20%_20%,hsl(var(--accent)/0.3),transparent)] mix-blend-screen" />
            {viewport.showGrid && (
              <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden>
                <defs>
                  <pattern id="loc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#loc-grid)" className="text-primary" />
              </svg>
            )}
            <div className="pointer-events-none relative z-10 flex flex-col items-center gap-3 text-center">
              <span className="rounded-full bg-background/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary ring-1 ring-inset ring-primary/40 backdrop-blur">
                Dioris Local Engine
              </span>
              <h3 className="text-lg font-semibold tracking-tight">
                {active ? active.stage : "Pronto para renderizar"}
              </h3>
              <p className="max-w-md text-xs text-muted-foreground">
                Algoritmo próprio · zero IA · reflexos físicos · GI · sombras ray ·
                pronto para WebGPU/Vulkan/OpenGL sem refatoração.
              </p>
              {active && (
                <div className="mt-1 h-1.5 w-64 overflow-hidden rounded-full bg-background/50 ring-1 ring-inset ring-border/60">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all"
                    style={{ width: `${Math.round(active.progress * 100)}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border/50 bg-background/40 px-4 py-2.5 text-[11px] text-muted-foreground backdrop-blur">
          <div className="flex items-center gap-2">
            {scene ? (
              <>
                <span>{scene.roomCount} cômodo(s)</span><span>·</span>
                <span>{scene.moduleCount} módulos</span><span>·</span>
                <span>{scene.wallCount} paredes</span><span>·</span>
                <span>{scene.triangleEstimate.toLocaleString("pt-BR")} tris (est.)</span>
              </>
            ) : <span>Nenhum projeto carregado.</span>}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
            >
              {LOCAL_CAMERAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <Button onClick={submit} disabled={!scene}>
              <Play className="mr-1.5 h-4 w-4" /> Renderizar
            </Button>
          </div>
        </footer>
      </section>

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

        <div className="max-h-[560px] overflow-auto p-3">
          {tab === "render" && (
            <FormSection title="Saída" description="Formato, profundidade e resolução.">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-muted-foreground">
                  Formato
                  <select
                    className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={output.format}
                    onChange={(e) => setOutput({ ...output, format: e.target.value as LocalImageFormat })}
                  >
                    {FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Bits
                  <select
                    className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={output.bitDepth}
                    onChange={(e) => setOutput({ ...output, bitDepth: Number(e.target.value) as LocalBitDepth })}
                  >
                    {BIT_DEPTHS.map((b) => <option key={b} value={b}>{b} bits</option>)}
                  </select>
                </label>
                <label className="col-span-2 text-[11px] text-muted-foreground">
                  Resolução
                  <select
                    className="mt-1 w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
                    value={output.resolution.label}
                    onChange={(e) => {
                      const r = RESOLUTIONS.find((x) => x.label === e.target.value) ?? RESOLUTIONS[1];
                      setOutput({ ...output, resolution: r });
                    }}
                  >
                    {RESOLUTIONS.map((r) => <option key={r.label} value={r.label}>{r.label}</option>)}
                  </select>
                </label>
                <label className="col-span-2 text-[11px] text-muted-foreground">
                  Qualidade JPEG/WebP: {(output.quality * 100).toFixed(0)}%
                  <input
                    type="range" min={0.5} max={1} step={0.02}
                    className="mt-1 w-full accent-primary"
                    value={output.quality}
                    onChange={(e) => setOutput({ ...output, quality: Number(e.target.value) })}
                  />
                </label>
              </div>
            </FormSection>
          )}

          {tab === "qualidade" && (
            <div className="space-y-2">
              {LOCAL_QUALITY_PRESETS.map((p) => (
                <button
                  key={p.id} type="button"
                  onClick={() => setQuality(p.id as LocalQualityId)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left transition",
                    qualityId === p.id
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/40 bg-muted/10 hover:bg-muted/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {p.quality.samples} spp
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{p.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-muted-foreground">
                    <span>Reflex×{p.reflectionBounces}</span>
                    <span>GI×{p.giBounces}</span>
                    <span>Shadow×{p.shadowSamples}</span>
                    <span>AO×{p.aoSamples}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === "luzes" && (
            <div className="grid grid-cols-2 gap-2">
              {LOCAL_LIGHTS.map((l) => (
                <div key={l.id} className="rounded-lg border border-border/40 bg-muted/10 p-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    <span className="font-medium">{l.label}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-1 text-[9px] text-muted-foreground">
                    <span>{l.intensity.toFixed(2)}×</span>
                    <span>{l.temperatureK}K</span>
                    {l.castsShadows && <span>Sombra</span>}
                    <span>{l.indoor ? "Indoor" : "Outdoor"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "materiais" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1 text-[10px]">
                {LOCAL_MATERIAL_FAMILIES.map((f) => (
                  <span key={f} className="rounded-full border border-border/40 px-2 py-0.5 text-muted-foreground">{f}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {listLocalMaterials().slice(0, 12).map((m) => (
                  <div key={m.id} className="rounded-lg border border-border/40 bg-muted/10 p-2 text-[11px]">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full ring-1 ring-inset ring-border/60"
                        style={{ backgroundColor: m.baseColorHex }}
                      />
                      <span className="font-medium">{m.label}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {m.family} · rough {m.roughness.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "cameras" && (
            <div className="space-y-2">
              {LOCAL_CAMERAS.map((c) => (
                <button
                  key={c.id} type="button" onClick={() => setCameraId(c.id)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-[11px] transition",
                    cameraId === c.id ? "border-primary/60 bg-primary/10" : "border-border/40 bg-muted/10 hover:bg-muted/20",
                  )}
                >
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
          )}

          {tab === "pos" && (
            <FormSection title="Pós-processamento" description="Bloom, ACES, DOF, grade cinematográfica.">
              <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                {["Bloom","Exposure","White Balance","ACES","Color Grading","Sharpen","Vignette","Chromatic Aberration","Motion Blur","Depth of Field"].map((e) => (
                  <li key={e} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1">
                    <Layers className="mr-1 inline h-3 w-3 text-primary" /> {e}
                  </li>
                ))}
              </ul>
            </FormSection>
          )}

          {tab === "captura" && (
            <FormSection title="Escopo" description="Onde o motor irá aplicar o render.">
              <div className="space-y-1.5">
                {CAPTURE_SCOPES.map((s) => (
                  <label key={s.id} className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition",
                    scope === s.id ? "border-primary/60 bg-primary/10" : "border-border/40 bg-muted/10 hover:bg-muted/20",
                  )}>
                    <input type="radio" name="scope" className="mt-0.5 accent-primary"
                      checked={scope === s.id} onChange={() => setScope(s.id)} />
                    <div>
                      <div className="font-medium">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground">{s.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {(scope === "batch" || scope === "all-environments") && (
                <div className="mt-2 space-y-1">
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

          {tab === "fila" && (
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Fila</span><span>{queue.length}</span>
                </div>
                {queue.length === 0 && <p className="text-[11px] text-muted-foreground">Nenhum job na fila.</p>}
                {queue.map((j) => (
                  <div key={j.id} className="mb-1 rounded-lg border border-border/40 bg-muted/10 p-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{j.title}</span>
                      <button type="button" onClick={() => cancel(j.id)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted/40">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{j.stage}</div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-background/60">
                      <div className="h-full bg-primary" style={{ width: `${Math.round(j.progress * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Histórico</span>
                  <button type="button" onClick={clearHistory}
                    className="text-[10px] normal-case text-muted-foreground hover:text-foreground">
                    limpar
                  </button>
                </div>
                {history.length === 0 && <p className="text-[11px] text-muted-foreground">Sem renders anteriores.</p>}
                {history.map((j) => (
                  <div key={j.id} className="mb-1 flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 p-2 text-[11px]">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{j.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {j.status} · {j.result?.durationMs ? `${(j.result.durationMs / 1000).toFixed(1)}s` : "—"}
                      </div>
                    </div>
                    <button type="button" onClick={() => retry(j.id)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted/40" title="Repetir">
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "performance" && (
            <FormSection title="Performance" description="Tier recomendado automaticamente pela cena.">
              {playbook ? (
                <ul className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {(Object.entries(playbook.performance) as readonly [string, unknown][]).map(([k, v]) => (
                    <li key={k} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{k}</div>
                      <div>{String(v)}</div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[11px] text-muted-foreground">Abra um projeto para calcular.</p>}
              {playbook && (
                <div className="mt-3 rounded-lg border border-border/40 bg-muted/10 p-2 text-[11px]">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Texturas</div>
                  <div>aniso {playbook.textures.anisotropy}× · max {playbook.textures.maxSize}px · {playbook.textures.compression}</div>
                </div>
              )}
            </FormSection>
          )}
        </div>
      </aside>

      <section className="xl:col-span-2">
        <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info"><Square className="mr-1 h-3 w-3" /> {DEFAULT_OUTPUT.format.toUpperCase()} padrão</StatusBadge>
            {playbook && (
              <>
                <StatusBadge tone="neutral">Reflex {playbook.reflection.bounces}× · GI {playbook.gi.bounces}×</StatusBadge>
                <StatusBadge tone="neutral">Shadows {playbook.shadows.kinds.join(" · ")}</StatusBadge>
                <StatusBadge tone="neutral">Perf: {playbook.performance.tier}</StatusBadge>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}