import type { RenderPostProcessing } from "../types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 text-xs last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function PostProcessingPanel({ pp }: { pp: RenderPostProcessing }) {
  return (
    <div>
      <Row label="Bloom" value={pp.bloom.enabled ? `on · int ${pp.bloom.intensity}` : "off"} />
      <Row label="Tonemap" value={pp.tonemap.enabled ? pp.tonemap.operator.toUpperCase() : "off"} />
      <Row
        label="Color grading"
        value={
          pp.colorGrading.enabled
            ? `T ${pp.colorGrading.temperature} · S ${pp.colorGrading.saturation}`
            : "off"
        }
      />
      <Row label="Exposure" value={pp.exposure.toFixed(2)} />
      <Row label="White balance" value={`${pp.whiteBalanceK}K`} />
      <Row
        label="Depth of Field"
        value={
          pp.depthOfField.enabled
            ? `f/${pp.depthOfField.apertureF} · ${pp.depthOfField.focusDistanceMm}mm`
            : "off"
        }
      />
      <Row
        label="Motion blur"
        value={pp.motionBlur.enabled ? `1/${pp.motionBlur.shutter}` : "off"}
      />
      <Row
        label="Vignette"
        value={pp.vignette.enabled ? pp.vignette.intensity.toFixed(2) : "off"}
      />
      <Row
        label="Chromatic aberration"
        value={pp.chromaticAberration.enabled ? pp.chromaticAberration.intensity.toFixed(2) : "off"}
      />
    </div>
  );
}
