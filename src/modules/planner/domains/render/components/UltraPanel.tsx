/**
 * Fase 3.12 — Painel Ultra Real (catálogos e flags).
 *
 * Consome exclusivamente `services/ultra/*`. Não introduz estado global —
 * o painel é *browsable*: mostra a arquitetura pronta que os providers
 * (Local/IA/Cloud/Video/Marketing) irão executar.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/core/components/ui-kit";
import type { RenderPresetId } from "../types";
import {
  AI_RENDER_HOOKS,
  LENS_PRESETS,
  PEOPLE_ASSETS,
  PROP_ASSETS,
  SKY_PRESETS,
  ULTRA_CAMERAS,
  ULTRA_HDRIS,
  ULTRA_MATERIALS,
  VEGETATION_ASSETS,
  featuresForPreset,
  performanceForPreset,
} from "../services/ultra";

type Tab =
  | "materiais"
  | "hdri"
  | "ceu"
  | "lentes"
  | "cameras"
  | "vegetacao"
  | "pessoas"
  | "objetos"
  | "features"
  | "performance"
  | "ia";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "materiais", label: "Materiais" },
  { id: "hdri", label: "HDRI" },
  { id: "ceu", label: "Céu" },
  { id: "lentes", label: "Lentes" },
  { id: "cameras", label: "Câmeras" },
  { id: "vegetacao", label: "Vegetação" },
  { id: "pessoas", label: "Pessoas" },
  { id: "objetos", label: "Objetos" },
  { id: "features", label: "Física" },
  { id: "performance", label: "Performance" },
  { id: "ia", label: "IA" },
];

export function UltraPanel({ presetId }: { presetId: RenderPresetId }) {
  const [tab, setTab] = useState<Tab>("materiais");
  const features = featuresForPreset(presetId);
  const perf = performanceForPreset(presetId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] transition",
              tab === t.id
                ? "bg-primary/20 text-foreground ring-1 ring-inset ring-primary/40"
                : "text-muted-foreground hover:bg-muted/40",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-h-[440px] overflow-auto pr-1 text-xs">
        {tab === "materiais" && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {ULTRA_MATERIALS.map((m) => (
              <div key={m.id} className="rounded-lg border border-border/60 bg-muted/10 p-2">
                <div
                  className="aspect-square rounded-md ring-1 ring-inset ring-border/60"
                  style={{
                    background: `radial-gradient(120% 120% at 20% 20%, ${m.baseColorHex}, color-mix(in oklab, ${m.baseColorHex} 55%, #000))`,
                  }}
                />
                <div className="mt-1.5 text-[11px] font-medium leading-tight">{m.label}</div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  {m.family}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "hdri" && (
          <ul className="space-y-1">
            {ULTRA_HDRIS.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 px-2 py-1.5"
              >
                <span>{h.label}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h.category} · {h.temperatureK}K
                </span>
              </li>
            ))}
          </ul>
        )}

        {tab === "ceu" && (
          <ul className="space-y-1">
            {SKY_PRESETS.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 px-2 py-1.5"
              >
                <span>{s.label}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  sol {s.sunElevationDeg}° · {s.temperatureK}K
                </span>
              </li>
            ))}
          </ul>
        )}

        {tab === "lentes" && (
          <ul className="space-y-1">
            {LENS_PRESETS.map((l) => (
              <li key={l.id} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.label}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    f/{l.recommendedApertureF}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{l.usage.join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === "cameras" && (
          <ul className="space-y-1">
            {ULTRA_CAMERAS.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 px-2 py-1.5"
              >
                <span>{c.label}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {c.focalLengthMm}mm · f/{c.apertureF}
                </span>
              </li>
            ))}
          </ul>
        )}

        {tab === "vegetacao" && (
          <ul className="grid grid-cols-2 gap-1">
            {VEGETATION_ASSETS.map((v) => (
              <li key={v.id} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1.5">
                <div className="text-[11px] font-medium">{v.label}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {v.kind}
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "pessoas" && (
          <ul className="grid grid-cols-2 gap-1">
            {PEOPLE_ASSETS.map((p) => (
              <li key={p.id} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1.5">
                <div className="text-[11px] font-medium">{p.label}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {p.age} · {p.pose}
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "objetos" && (
          <ul className="grid grid-cols-2 gap-1">
            {PROP_ASSETS.map((p) => (
              <li key={p.id} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1.5">
                <div className="text-[11px] font-medium">{p.label}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {p.category}
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "features" && (
          <div className="space-y-1">
            {Object.entries(features).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-2 py-1.5"
              >
                <span className="text-[11px] capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                <StatusBadge tone={v === false ? "neutral" : v === "off" ? "neutral" : "success"}>
                  {String(v)}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}

        {tab === "performance" && (
          <div className="space-y-1">
            {Object.entries(perf).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-2 py-1.5"
              >
                <span className="text-[11px] capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "ia" && (
          <ul className="space-y-1">
            {AI_RENDER_HOOKS.map((h) => (
              <li key={h.id} className="rounded-lg border border-border/40 bg-muted/10 px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium">{h.label}</span>
                  <StatusBadge tone="info">{h.capability.join(", ")}</StatusBadge>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{h.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
