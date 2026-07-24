/**
 * Fase 3.23 — RealtimeStudio.
 *
 * Console interativo Dark First para o RealTime Interactive Engine.
 * Zero providers/stores/managers/banco/migrations. 100% aditivo.
 */
import { useState, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "../hooks/use-realtime";
import { REALTIME_NAV_MODES, navigationLabel } from "../viewport";
import { REALTIME_QUALITY_ORDER, qualityLabel } from "../quality";
import { REALTIME_TIME_OPTIONS } from "../lighting";
import { REALTIME_WEATHER_OPTIONS, weatherLabel } from "../weather";
import { REALTIME_INTERACTIVE_MATERIALS } from "../materials";
import { formatMeasure } from "../measure";
import type { RealtimeMeasureMode } from "../types";

type Tab =
  | "viewport"
  | "movement"
  | "interaction"
  | "lighting"
  | "materials"
  | "weather"
  | "measure"
  | "quality"
  | "performance";

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: "viewport", label: "Viewport" },
  { id: "movement", label: "Movimentação" },
  { id: "interaction", label: "Interação" },
  { id: "lighting", label: "Iluminação" },
  { id: "materials", label: "Materiais" },
  { id: "weather", label: "Clima" },
  { id: "measure", label: "Medição" },
  { id: "quality", label: "Qualidade" },
  { id: "performance", label: "Performance" },
];

export function RealtimeStudio() {
  const rt = useRealtime();
  const [tab, setTab] = useState<Tab>("viewport");

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/40 p-2 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
              tab === t.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="mt-3 rounded-md border border-border/50 bg-background/30 p-3 text-xs text-muted-foreground">
          <div className="mb-1 font-medium text-foreground">Hardware</div>
          <div>GPU tier {rt.hardware.gpuTier} · {rt.hardware.logicalCores} cores</div>
          <div>{rt.hardware.deviceMemoryGb} GB · {rt.hardware.mobile ? "mobile" : "desktop"}</div>
          <div className="mt-1">
            {rt.hardware.webgpu ? <Badge variant="secondary">WebGPU</Badge> : null}{" "}
            {rt.hardware.openxr ? <Badge variant="secondary">OpenXR</Badge> : null}
          </div>
        </div>
      </aside>

      <section className="min-h-[420px]">
        {tab === "viewport" && <ViewportPanel rt={rt} />}
        {tab === "movement" && <MovementPanel rt={rt} />}
        {tab === "interaction" && <InteractionPanel rt={rt} />}
        {tab === "lighting" && <LightingPanel rt={rt} />}
        {tab === "materials" && <MaterialsPanel rt={rt} />}
        {tab === "weather" && <WeatherPanel rt={rt} />}
        {tab === "measure" && <MeasurePanel rt={rt} />}
        {tab === "quality" && <QualityPanel rt={rt} />}
        {tab === "performance" && <PerformancePanel rt={rt} />}
      </section>
    </div>
  );
}

type RT = ReturnType<typeof useRealtime>;

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="border-border/60 bg-card/40 backdrop-blur">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

function ViewportPanel({ rt }: { rt: RT }) {
  return (
    <Panel title="Viewport interativo" description="Navegação, HUD e comparação em tempo real.">
      <div className="flex flex-wrap gap-2">
        {REALTIME_NAV_MODES.map((m) => (
          <Button
            key={m}
            size="sm"
            variant={rt.viewport.navigation === m ? "default" : "secondary"}
            onClick={() => rt.setNavigationMode(m)}
          >
            {navigationLabel(m)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Câmera: <span className="text-foreground">{rt.camera.mode}</span></div>
        <div>FOV: <span className="text-foreground">{rt.camera.fovDeg}°</span></div>
        <div>Grid: <span className="text-foreground">{rt.viewport.showGrid ? "on" : "off"}</span></div>
        <div>Minimapa: <span className="text-foreground">{rt.viewport.showMinimap ? "on" : "off"}</span></div>
        <div>Safe area: <span className="text-foreground">{rt.viewport.showSafeArea ? "on" : "off"}</span></div>
        <div>Comparação: <span className="text-foreground">{rt.viewport.showCompare ? "on" : "off"}</span></div>
      </div>
    </Panel>
  );
}

function MovementPanel({ rt }: { rt: RT }) {
  return (
    <Panel title="Movimentação" description="WASD, mouse, touch, joystick mobile e gamepad.">
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Andar: <span className="text-foreground">{rt.movement.walkSpeedMs} m/s</span></div>
        <div>Correr: <span className="text-foreground">{rt.movement.runSpeedMs} m/s</span></div>
        <div>Agachar: <span className="text-foreground">{rt.movement.crouchSpeedMs} m/s</span></div>
        <div>Pulo: <span className="text-foreground">{rt.movement.jumpMs} m/s</span></div>
        <div>Gravidade: <span className="text-foreground">{rt.gravity.gravityMs2} m/s²</span></div>
        <div>Raio colisão: <span className="text-foreground">{rt.collision.radiusMm} mm</span></div>
        <div>Degrau: <span className="text-foreground">{rt.collision.stepHeightMm} mm</span></div>
        <div>Rampa: <span className="text-foreground">{rt.collision.slopeLimitDeg}°</span></div>
      </div>
    </Panel>
  );
}

function InteractionPanel({ rt }: { rt: RT }) {
  const sel = rt.selection.selectedNodeIds[0] ?? null;
  return (
    <Panel title="Interação" description="Portas, gavetas, LED, materiais, puxadores e estrutura.">
      <div className="text-xs text-muted-foreground">
        Selecionado: <span className="text-foreground">{sel ?? "—"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { k: "open-door", l: "Abrir porta" },
          { k: "close-door", l: "Fechar porta" },
          { k: "open-drawer", l: "Abrir gaveta" },
          { k: "close-drawer", l: "Fechar gaveta" },
          { k: "led-on", l: "Acender LED" },
          { k: "led-off", l: "Apagar LED" },
          { k: "toggle-structure", l: "Estrutura" },
          { k: "toggle-slats", l: "Ripado" },
          { k: "toggle-glass", l: "Vidro" },
          { k: "toggle-mirror", l: "Espelho" },
        ].map((b) => (
          <Button
            key={b.k}
            size="sm"
            variant="secondary"
            disabled={!sel}
            onClick={() =>
              sel &&
              rt.interact({
                kind: b.k as never,
                nodeId: sel,
              })
            }
          >
            {b.l}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>Portas: <span className="text-foreground">{rt.doors.length}</span></div>
        <div>Gavetas: <span className="text-foreground">{rt.drawers.length}</span></div>
        <div>LEDs: <span className="text-foreground">{rt.leds.filter((l) => l.on).length}</span></div>
      </div>
    </Panel>
  );
}

function LightingPanel({ rt }: { rt: RT }) {
  return (
    <Panel title="Iluminação" description="Hora do dia, intensidade, temperatura, HDRI e IES.">
      <div className="flex flex-wrap gap-2">
        {REALTIME_TIME_OPTIONS.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={rt.lighting.time === t ? "default" : "secondary"}
            onClick={() => rt.setTime(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Intensidade: <span className="text-foreground">{rt.lighting.sunIntensity.toFixed(2)}</span></div>
        <div>Temperatura: <span className="text-foreground">{rt.lighting.sunTemperatureK} K</span></div>
        <div>HDRI: <span className="text-foreground">{rt.lighting.hdriId ?? "off"}</span></div>
        <div>IES: <span className="text-foreground">{rt.lighting.iesEnabled ? "on" : "off"}</span></div>
      </div>
    </Panel>
  );
}

function MaterialsPanel({ rt }: { rt: RT }) {
  const sample = REALTIME_INTERACTIVE_MATERIALS.slice(0, 12);
  const sel = rt.selection.selectedNodeIds[0] ?? null;
  return (
    <Panel title="Materiais" description="Troque revestimentos, cores e ferragens em tempo real.">
      <div className="text-xs text-muted-foreground">
        {sel ? `Aplicar em ${sel}` : "Selecione um item no viewport para trocar materiais."}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {sample.map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant="secondary"
            disabled={!sel}
            onClick={() =>
              sel &&
              rt.interact({
                kind: "swap-material",
                nodeId: sel,
                payload: { materialId: m.id },
              })
            }
          >
            {m.label}
          </Button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Overrides ativos: <span className="text-foreground">{rt.materials.length}</span>
      </div>
    </Panel>
  );
}

function WeatherPanel({ rt }: { rt: RT }) {
  return (
    <Panel title="Clima" description="Sol, nublado, chuva, blue hour, noite e transições.">
      <div className="flex flex-wrap gap-2">
        {REALTIME_WEATHER_OPTIONS.map((w) => (
          <Button
            key={w}
            size="sm"
            variant={rt.lighting.weather === w ? "default" : "secondary"}
            onClick={() => rt.setWeather(w)}
          >
            {weatherLabel(w)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Fog: <span className="text-foreground">{rt.environment.fogDensity.toFixed(2)}</span></div>
        <div>Ambiente: <span className="text-foreground">{rt.environment.ambientHex}</span></div>
      </div>
    </Panel>
  );
}

function MeasurePanel({ rt }: { rt: RT }) {
  const modes: ReadonlyArray<{ id: RealtimeMeasureMode; label: string }> = [
    { id: "distance", label: "Distância" },
    { id: "area", label: "Área" },
    { id: "height", label: "Altura" },
    { id: "width", label: "Largura" },
    { id: "depth", label: "Profundidade" },
  ];
  return (
    <Panel title="Medição" description="Régua, área e cotas em tempo real.">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant="secondary"
            onClick={() =>
              rt.addMeasure(m.id, { x: 0, y: 0, z: 0 }, { x: 1000, y: 0, z: 1000 })
            }
          >
            {m.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={rt.clearMeasures}>
          Limpar
        </Button>
      </div>
      <ul className="max-h-40 space-y-1 overflow-auto text-xs text-muted-foreground">
        {rt.measures.map((m) => (
          <li key={m.id}>
            {m.mode} — <span className="text-foreground">{formatMeasure(m)}</span>
          </li>
        ))}
        {rt.measures.length === 0 ? <li>Nenhuma medida.</li> : null}
      </ul>
    </Panel>
  );
}

function QualityPanel({ rt }: { rt: RT }) {
  return (
    <Panel title="Qualidade" description="Eco → Cinema (auto-quality baseado no hardware).">
      <div className="flex flex-wrap gap-2">
        {REALTIME_QUALITY_ORDER.map((q) => (
          <Button
            key={q}
            size="sm"
            variant={rt.viewport.quality === q ? "default" : "secondary"}
            onClick={() => rt.setQuality(q)}
          >
            {qualityLabel(q)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Escala: <span className="text-foreground">{rt.performance.resolutionScale}</span></div>
        <div>AA: <span className="text-foreground">{rt.performance.aa}</span></div>
        <div>SSR: <span className="text-foreground">{rt.reflection.ssrEnabled ? "on" : "off"}</span></div>
        <div>Sondas: <span className="text-foreground">{rt.reflection.probesEnabled ? "on" : "off"}</span></div>
      </div>
    </Panel>
  );
}

function PerformancePanel({ rt }: { rt: RT }) {
  return (
    <Panel title="Performance" description="LOD, streaming, occlusion, instancing, mipmaps e compressão.">
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Target: <span className="text-foreground">{rt.performance.targetFps} fps</span></div>
        <div>LOD: <span className="text-foreground">{rt.performance.lodEnabled ? "on" : "off"}</span></div>
        <div>Streaming: <span className="text-foreground">{rt.performance.streamingEnabled ? "on" : "off"}</span></div>
        <div>Occlusion: <span className="text-foreground">{rt.performance.occlusionEnabled ? "on" : "off"}</span></div>
        <div>Instancing: <span className="text-foreground">{rt.performance.instancingEnabled ? "on" : "off"}</span></div>
        <div>Mipmaps: <span className="text-foreground">{rt.performance.mipmapsEnabled ? "on" : "off"}</span></div>
        <div>Compressão: <span className="text-foreground">{rt.performance.textureCompression ? "on" : "off"}</span></div>
        <div>Auto Quality: <span className="text-foreground">{rt.performance.autoQuality ? "on" : "off"}</span></div>
      </div>
    </Panel>
  );
}