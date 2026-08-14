import type { VideoBranding } from "../types";

export interface BrandingPanelProps {
  readonly branding: VideoBranding;
  readonly onChange: (patch: Partial<VideoBranding>) => void;
}

export function BrandingPanel({ branding, onChange }: BrandingPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-2 text-[11px]">
      <label className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/10 px-2.5 py-1.5">
        <span>Ativar marca</span>
        <input
          type="checkbox"
          checked={branding.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
      </label>
      <Field
        label="Empresa"
        value={branding.companyName ?? ""}
        onChange={(v) => onChange({ companyName: v })}
      />
      <Field
        label="Telefone"
        value={branding.phone ?? ""}
        onChange={(v) => onChange({ phone: v })}
      />
      <Field
        label="Instagram"
        value={branding.instagram ?? ""}
        onChange={(v) => onChange({ instagram: v })}
      />
      <Field
        label="Site"
        value={branding.website ?? ""}
        onChange={(v) => onChange({ website: v })}
      />
      <Field
        label="Logo URL"
        value={branding.logoUrl ?? ""}
        onChange={(v) => onChange({ logoUrl: v || undefined })}
      />
      <Field
        label="Marca d'água URL"
        value={branding.watermarkUrl ?? ""}
        onChange={(v) => onChange({ watermarkUrl: v || undefined })}
      />
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Posição</span>
        <select
          className="rounded-md border border-border/60 bg-background/60 px-2 py-1"
          value={branding.position}
          onChange={(e) => onChange({ position: e.target.value as VideoBranding["position"] })}
        >
          <option value="bottom-right">Inferior direito</option>
          <option value="bottom-left">Inferior esquerdo</option>
          <option value="top-right">Superior direito</option>
          <option value="top-left">Superior esquerdo</option>
          <option value="center">Centro</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Chamada final: {branding.endCardDurationSec}s
        </span>
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={branding.endCardDurationSec}
          onChange={(e) => onChange({ endCardDurationSec: Number(e.target.value) })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Opacidade: {Math.round(branding.opacity * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={branding.opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
