/**
 * Fase 3.9 — Dioris Render Studio.
 *
 * Painel foto-realista inspirado em softwares profissionais de render:
 * viewport central escuro com preview cinematográfico da cena, sidebar
 * esquerda com estágios do pipeline, sidebar direita com controles
 * (presets, iluminação, câmera, materiais, pós), rodapé com fila
 * ativa e histórico.
 */
import { useMemo, useState } from "react";
import {
  Camera,
  Cloud,
  Cpu,
  Film,
  Layers,
  Megaphone,
  MonitorPlay,
  Play,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button, FormSection, StatusBadge } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { useRenderQueue } from "../hooks/use-render-queue";
import { buildRenderScene } from "../services/adapter";
import { DEFAULT_CAMERA_ID } from "../services/cameras";
import { DEFAULT_HDRI_ID } from "../services/lighting";
import { DEFAULT_RENDER_PRESET_ID, getRenderPreset } from "../services/presets";
import { RENDER_PIPELINE } from "../services/pipeline";
import { postForPreset } from "../services/postprocess";
import {
  DEFAULT_RENDER_PROVIDER_ID,
  RENDER_PROVIDERS,
} from "../services/providers";
import type {
  RenderPresetId,
  RenderProviderId,
  RenderTargetKind,
} from "../types";
import { PresetGrid } from "./PresetGrid";
import { LightingPanel } from "./LightingPanel";
import { CameraPanel } from "./CameraPanel";
import { MaterialLibrary } from "./MaterialLibrary";
import { PostProcessingPanel } from "./PostProcessingPanel";
import { RenderQueue } from "./RenderQueue";

type Tab = "iluminacao" | "camera" | "materiais" | "pos";

const TARGETS: readonly { id: RenderTargetKind; label: string; icon: typeof Camera }[] = [
  { id: "still", label: "Still", icon: Camera },
  { id: "panorama", label: "Panorama", icon: MonitorPlay },
  { id: "ai", label: "IA", icon: Sparkles },
  { id: "video", label: "Vídeo", icon: Film },
  { id: "marketing", label: "Marketing", icon: Megaphone },
];

function providerIcon(id: RenderProviderId) {
  switch (id) {
    case "dioris.local":
      return Cpu;
    case "dioris.cloud":
      return Cloud;
    case "dioris.ai":
      return Wand2;
    case "dioris.video":
      return Film;
    case "dioris.marketing":
      return Megaphone;
  }
}

export function RenderStudio() {
  const { state } = usePlannerEditor();
  const project = state.project;

  const [presetId, setPresetId] = useState<RenderPresetId>(DEFAULT_RENDER_PRESET_ID);
  const [providerId, setProviderId] = useState<RenderProviderId>(DEFAULT_RENDER_PROVIDER_ID);
  const [target, setTarget] = useState<RenderTargetKind>("still");
  const [cameraId, setCameraId] = useState(DEFAULT_CAMERA_ID);
  const [hdriId, setHdriId] = useState<string | null>(DEFAULT_HDRI_ID);
  const [extraLights, setExtraLights] = useState<readonly string[]>([]);
  const [tab, setTab] = useState<Tab>("iluminacao");

  const { queue, active, history, enqueue, cancel, retry, clearHistory } = useRenderQueue();
  const preset = getRenderPreset(presetId);
  const pp = useMemo(() => postForPreset(presetId), [presetId]);
  const scene = useMemo(
    () => (project ? buildRenderScene(project, state.selectedRoomId) : null),
    [project, state.selectedRoomId],
  );

  const toggleLight = (id: string) =>
    setExtraLights((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const submit = () => {
    enqueue({
      presetId,
      providerId,
      target,
      cameraId,
      hdriId,
      extraLightIds: extraLights,
      roomId: state.selectedRoomId,
      environmentId: state.selectedEnvironmentId,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)_360px]">
      {/* Sidebar esquerda — pipeline */}
      <aside className="rounded-2xl border border-border/60 bg-background/40 p-3 backdrop-blur">
        <h3 className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Layers className="h-3.5 w-3.5" /> Pipeline
        </h3>
        <ol className="space-y-1">
          {RENDER_PIPELINE.map((s) => {
            const isActive = active?.stage === s.label;
            return (
              <li
                key={s.id}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[11px] transition",
                  isActive
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border/40 bg-muted/10 text-muted-foreground",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-[9px] uppercase tracking-widest opacity-60">
                    {(s.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[10px] opacity-80">{s.description}</p>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Viewport central */}
      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(120%_80%_at_50%_-10%,hsl(var(--primary)/0.15),transparent),linear-gradient(180deg,#0b0e1a,#05060a)]">
        <header className="flex items-center justify-between border-b border-border/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <StatusBadge tone="info">{preset.label}</StatusBadge>
            <StatusBadge tone="neutral">{preset.quality.resolution.label}</StatusBadge>
            <StatusBadge tone="neutral">{preset.quality.samples} spp</StatusBadge>
            <StatusBadge tone="neutral">AA {preset.quality.antialiasing.toUpperCase()}</StatusBadge>
          </div>
          <div className="flex items-center gap-1">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTarget(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition",
                  t.id === target
                    ? "bg-primary/20 text-foreground ring-1 ring-inset ring-primary/40"
                    : "text-muted-foreground hover:bg-muted/40",
                )}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </header>
        <div className="relative flex flex-1 items-center justify-center px-6 py-6">
          <ViewportPreview
            active={!!active}
            stage={active?.stage}
            progress={active?.progress ?? 0}
          />
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-border/50 bg-background/40 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {scene ? (
              <>
                <span>{scene.summary.roomCount} cômodo(s)</span>
                <span>·</span>
                <span>{scene.summary.moduleNodeCount} módulos</span>
                <span>·</span>
                <span>{scene.summary.lightNodeCount} luzes</span>
                <span>·</span>
                <span>{scene.summary.decorNodeCount} deco</span>
                <span>·</span>
                <span>{scene.summary.wallCount} paredes</span>
              </>
            ) : (
              <span>Nenhum projeto carregado. Abra em /planner/projetos.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value as RenderProviderId)}
            >
              {RENDER_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.available}>
                  {p.label} {p.available ? "" : "(em breve)"}
                </option>
              ))}
            </select>
            <Button onClick={submit} disabled={!project}>
              <Play className="mr-1.5 h-4 w-4" /> Renderizar
            </Button>
          </div>
        </footer>
      </section>

      {/* Sidebar direita — controles */}
      <aside className="space-y-4">
        <FormSection title="Preset de qualidade" description="Sombras, GI, AO, AA, resolução, amostras e denoise.">
          <PresetGrid selectedId={presetId} onSelect={setPresetId} />
        </FormSection>

        <div className="rounded-2xl border border-border/60 bg-background/40 backdrop-blur">
          <div className="flex items-center gap-0.5 border-b border-border/50 px-2 pt-2">
            {(
              [
                { id: "iluminacao", label: "Iluminação" },
                { id: "camera", label: "Câmera" },
                { id: "materiais", label: "Materiais" },
                { id: "pos", label: "Pós" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-t-lg px-3 py-1.5 text-xs transition",
                  tab === t.id
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="max-h-[520px] overflow-auto p-3">
            {tab === "iluminacao" && (
              <LightingPanel
                hdriId={hdriId}
                extraLightIds={extraLights}
                onHdriChange={setHdriId}
                onToggleLight={toggleLight}
              />
            )}
            {tab === "camera" && <CameraPanel cameraId={cameraId} onSelect={setCameraId} />}
            {tab === "materiais" && <MaterialLibrary />}
            {tab === "pos" && <PostProcessingPanel pp={pp} />}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground backdrop-blur">
          {(() => {
            const Icon = providerIcon(providerId);
            return (
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span>
                  {RENDER_PROVIDERS.find((p) => p.id === providerId)?.description}
                </span>
              </div>
            );
          })()}
        </div>
      </aside>

      {/* Fila / histórico */}
      <section className="xl:col-span-3">
        <FormSection title="Fila & histórico" description="Status, progresso, cancelar, repetir.">
          <RenderQueue
            queue={queue}
            history={history}
            onCancel={cancel}
            onRetry={retry}
            onClearHistory={clearHistory}
          />
        </FormSection>
      </section>
    </div>
  );
}

function ViewportPreview({
  active,
  stage,
  progress,
}: {
  active: boolean;
  stage?: string;
  progress: number;
}) {
  return (
    <div className="relative flex h-full min-h-[420px] w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl ring-1 ring-inset ring-border/50">
      {/* Fundo cinema */}
      <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_50%,#0b0e1a,#1a1230,#0a1220,#0b0e1a)] opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_60%,hsl(var(--primary)/0.35),transparent),radial-gradient(50%_50%_at_20%_20%,hsl(var(--accent)/0.35),transparent)] mix-blend-screen" />
      <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0px,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_3px)]" />

      {/* Grid CAD */}
      <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden>
        <defs>
          <pattern id="render-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#render-grid)" className="text-primary" />
      </svg>

      {/* HUD */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-background/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary ring-1 ring-inset ring-primary/40 backdrop-blur">
          Dioris Render Engine
        </span>
        <h3 className="text-lg font-semibold tracking-tight">
          {active ? stage : "Viewport pronto para renderizar"}
        </h3>
        <p className="max-w-md text-xs text-muted-foreground">
          Prepare presets, iluminação e câmeras. O motor está desacoplado —
          qualquer backend (Local, IA, Nuvem, Vídeo, Marketing) consome os
          mesmos jobs.
        </p>
        <div className="mt-2 h-1.5 w-64 overflow-hidden rounded-full bg-background/50 ring-1 ring-inset ring-border/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}