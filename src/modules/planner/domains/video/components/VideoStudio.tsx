/**
 * Fase 3.10 — Dioris Video Studio.
 *
 * Painel dark, desktop-first, viewport grande no topo, timeline abaixo,
 * sidebar direita com cenas / motor / câmeras / animações / exportação /
 * marca / narração. Fila e histórico em rodapé.
 */
import { useMemo, useState } from "react";
import { Film, Play, Sparkles, Zap } from "lucide-react";
import { Button, FormSection, StatusBadge } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import {
  DEFAULT_VIDEO_ENGINE_ID,
  DEFAULT_VIDEO_PRESET_ID,
  buildSceneTimeline,
  buildVideoScene,
  DEFAULT_BRANDING,
  DEFAULT_NARRATION,
  getVideoEngine,
  getVideoFormat,
  getVideoPreset,
  scenePresetByKind,
  VIDEO_ENGINES,
  VIDEO_PIPELINE,
  VIDEO_PRESETS,
} from "../services";
import { useVideoQueue } from "../hooks/use-video-queue";
import type {
  VideoBranding,
  VideoEngineId,
  VideoNarration,
  VideoPresetId,
  VideoSceneKind,
} from "../types";
import { SceneGrid } from "./SceneGrid";
import { CameraMovePanel } from "./CameraMovePanel";
import { AnimationsPanel } from "./AnimationsPanel";
import { ExportPanel } from "./ExportPanel";
import { EnginePanel } from "./EnginePanel";
import { BrandingPanel } from "./BrandingPanel";
import { NarrationPanel } from "./NarrationPanel";
import { Timeline } from "./Timeline";
import { VideoQueue } from "./VideoQueue";
import { LocalVideoPanel } from "../local-engine";

type Tab = "cenas" | "motor" | "camera" | "animacoes" | "export" | "marca" | "narracao";

export function VideoStudio() {
  const { state } = usePlannerEditor();
  const project = state.project;

  const [mode, setMode] = useState<"studio" | "local">("studio");
  const [sceneKind, setSceneKind] = useState<VideoSceneKind>("apresentacao");
  const [presetId, setPresetId] = useState<VideoPresetId>(DEFAULT_VIDEO_PRESET_ID);
  const [engineId, setEngineId] = useState<VideoEngineId>(DEFAULT_VIDEO_ENGINE_ID);
  const [formatId, setFormatId] = useState<string>(getVideoPreset(DEFAULT_VIDEO_PRESET_ID).formatId);
  const [branding, setBranding] = useState<VideoBranding>(DEFAULT_BRANDING);
  const [narration, setNarration] = useState<VideoNarration>(DEFAULT_NARRATION);
  const [tab, setTab] = useState<Tab>("cenas");

  const { queue, active, history, enqueue, cancel, retry, clearHistory } = useVideoQueue();

  const modeTabs = (
    <div className="mb-4 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 p-1 backdrop-blur">
      {([
        { id: "studio", label: "Video Studio" },
        { id: "local", label: "Vídeo Local" },
      ] as const).map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMode(m.id)}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] transition",
            mode === m.id
              ? "bg-primary/20 text-foreground ring-1 ring-inset ring-primary/40"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  if (mode === "local") {
    return (
      <div>
        {modeTabs}
        <LocalVideoPanel />
      </div>
    );
  }

  const preset = getVideoPreset(presetId);
  const engine = getVideoEngine(engineId);
  const format = getVideoFormat(formatId);
  const scene = scenePresetByKind(sceneKind);

  const { timeline } = useMemo(() => buildSceneTimeline(sceneKind), [sceneKind]);
  const videoScene = useMemo(
    () =>
      project
        ? buildVideoScene(project, state.selectedRoomId, timeline.fps, timeline.durationSec)
        : null,
    [project, state.selectedRoomId, timeline.fps, timeline.durationSec],
  );

  const submit = () => {
    enqueue({
      presetId,
      engineId,
      renderProviderId: "dioris.video",
      sceneKind,
      formatId,
      timeline,
      branding,
      narration,
      roomId: state.selectedRoomId,
      environmentId: state.selectedEnvironmentId,
    });
  };

  return (
    <>
    {modeTabs}
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      {/* Coluna central: viewport + timeline */}
      <section className="space-y-4">
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(120%_80%_at_50%_-10%,hsl(var(--primary)/0.15),transparent),linear-gradient(180deg,#0b0e1a,#05060a)]">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="info">{scene.label}</StatusBadge>
              <StatusBadge tone="neutral">{preset.label}</StatusBadge>
              <StatusBadge tone="neutral">{format.label}</StatusBadge>
              <StatusBadge tone="neutral">{timeline.fps}fps</StatusBadge>
              <StatusBadge tone="neutral">{timeline.durationSec.toFixed(1)}s</StatusBadge>
            </div>
            <div className="flex items-center gap-1.5">
              {engine.tier === "free" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                  <Zap className="h-3 w-3" /> Motor Gratuito
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary ring-1 ring-inset ring-primary/30">
                  <Sparkles className="h-3 w-3" /> Motor Premium
                </span>
              )}
            </div>
          </header>
          <div className="relative flex flex-1 items-center justify-center px-6 py-6">
            <VideoPreview
              active={!!active}
              stage={active?.stage}
              progress={active?.progress ?? 0}
              aspect={scene.aspectRatio}
            />
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-background/40 px-4 py-2.5 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {videoScene ? (
                <>
                  <span>{videoScene.summary.roomCount} cômodo(s)</span>
                  <span>·</span>
                  <span>{videoScene.summary.moduleNodeCount} módulos</span>
                  <span>·</span>
                  <span>{videoScene.summary.openableNodeCount} aberturas</span>
                  <span>·</span>
                  <span>{videoScene.summary.lightNodeCount} luzes</span>
                  <span>·</span>
                  <span>{videoScene.summary.estimatedFrameCount} frames</span>
                </>
              ) : (
                <span>Nenhum projeto carregado. Abra em /planner/projetos.</span>
              )}
            </div>
            <Button onClick={submit} disabled={!project}>
              <Play className="mr-1.5 h-4 w-4" /> Gerar vídeo
            </Button>
          </footer>
        </div>

        <Timeline timeline={timeline} />
      </section>

      {/* Sidebar direita: controles */}
      <aside className="space-y-4">
        <FormSection title="Preset de qualidade" description="Combina render + duração + formato.">
          <div className="grid grid-cols-1 gap-1.5">
            {VIDEO_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPresetId(p.id);
                  setFormatId(p.formatId);
                }}
                className={cn(
                  "flex flex-col gap-0.5 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition",
                  presetId === p.id
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/50 bg-muted/10 hover:border-primary/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.label}</span>
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    {p.durationSec}s
                  </span>
                </div>
                <p className="line-clamp-2 text-[10px] text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>
        </FormSection>

        <div className="rounded-2xl border border-border/60 bg-background/40 backdrop-blur">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 px-2 pt-2">
            {(
              [
                { id: "cenas", label: "Cenas" },
                { id: "motor", label: "Motor" },
                { id: "camera", label: "Câmeras" },
                { id: "animacoes", label: "Anim." },
                { id: "export", label: "Export" },
                { id: "marca", label: "Marca" },
                { id: "narracao", label: "Áudio" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-t-lg px-2.5 py-1.5 text-[11px] transition",
                  tab === t.id
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="max-h-[540px] overflow-auto p-3">
            {tab === "cenas" && <SceneGrid selectedKind={sceneKind} onSelect={setSceneKind} />}
            {tab === "motor" && <EnginePanel engineId={engineId} onSelect={setEngineId} />}
            {tab === "camera" && <CameraMovePanel selectedKinds={[]} onToggle={() => undefined} />}
            {tab === "animacoes" && <AnimationsPanel selectedKinds={[]} onToggle={() => undefined} />}
            {tab === "export" && <ExportPanel formatId={formatId} onSelect={setFormatId} />}
            {tab === "marca" && (
              <BrandingPanel branding={branding} onChange={(p) => setBranding((b) => ({ ...b, ...p }))} />
            )}
            {tab === "narracao" && (
              <NarrationPanel
                narration={narration}
                onChange={(p) => setNarration((n) => ({ ...n, ...p }))}
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground backdrop-blur">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <span>
              {VIDEO_ENGINES.length} motores declarados · Motor gratuito ativo · Premium em breve.
            </span>
          </div>
          <div className="mt-1 text-[10px] opacity-80">
            Pipeline de {VIDEO_PIPELINE.length} estágios · frames renderizados pelo Render Engine (Fase 3.9).
          </div>
        </div>
      </aside>

      <section className="xl:col-span-2">
        <FormSection title="Fila & histórico" description="Status, progresso, cancelar, repetir.">
          <VideoQueue
            queue={queue}
            history={history}
            onCancel={cancel}
            onRetry={retry}
            onClearHistory={clearHistory}
          />
        </FormSection>
      </section>
    </div>
    </>
  );
}

function VideoPreview({
  active,
  stage,
  progress,
  aspect,
}: {
  active: boolean;
  stage?: string;
  progress: number;
  aspect: string;
}) {
  return (
    <div
      className="relative flex w-full max-w-4xl items-center justify-center overflow-hidden rounded-2xl ring-1 ring-inset ring-border/50"
      style={{ aspectRatio: aspect.replace(":", " / ") }}
    >
      <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_50%,#0b0e1a,#1a1230,#0a1220,#0b0e1a)] opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_60%,hsl(var(--primary)/0.35),transparent),radial-gradient(50%_50%_at_20%_20%,hsl(var(--accent)/0.35),transparent)] mix-blend-screen" />
      <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0px,rgba(255,255,255,0.02)_1px,transparent_1px,transparent_3px)]" />

      <div className="pointer-events-none relative z-10 flex flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-background/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary ring-1 ring-inset ring-primary/40 backdrop-blur">
          Dioris Video Engine
        </span>
        <h3 className="text-lg font-semibold tracking-tight">
          {active ? stage : "Viewport pronto para gerar vídeo"}
        </h3>
        <p className="max-w-md text-xs text-muted-foreground">
          Motor gratuito por algoritmo próprio. Motor premium preparado para
          Runway, Pika, Luma, Kling, OpenAI, Gemini — sem depender de IA.
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
