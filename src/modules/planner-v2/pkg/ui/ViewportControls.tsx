import { ArrowUp, Expand, Grid3X3, Lightbulb } from "lucide-react";
import { usePlannerStore } from "../state/usePlannerStore";
import { useImmersiveStore } from "../state/useImmersiveStore";

export function ViewportControls() {
  const gridVisible = usePlannerStore((s) => s.gridVisible);
  const setGridVisible = usePlannerStore((s) => s.setGridVisible);
  const lightsEnabled = usePlannerStore((s) => s.lightsEnabled);
  const setLightsEnabled = usePlannerStore((s) => s.setLightsEnabled);
  const qualityMode = useImmersiveStore((s) => s.qualityMode);
  const setQualityMode = useImmersiveStore((s) => s.setQualityMode);
  const autoOcclusion = useImmersiveStore((s) => s.autoOcclusion);
  const setAutoOcclusion = useImmersiveStore((s) => s.setAutoOcclusion);

  const focusScene = () => window.dispatchEvent(new CustomEvent("dioris:focus-scene"));
  const focusTop = () => window.dispatchEvent(new CustomEvent("dioris:view-top"));

  return (
    <>
      <div className="minimap">
        <div />
      </div>
      <div className="viewport-status">
        <span>Vista: Perspectiva</span>
        <label>
          <Grid3X3 size={14} />
          <input
            type="checkbox"
            checked={gridVisible}
            onChange={(event) => setGridVisible(event.target.checked)}
          />
          Grade
        </label>
        <label>
          <Lightbulb size={14} />
          <input
            type="checkbox"
            checked={lightsEnabled}
            onChange={(event) => setLightsEnabled(event.target.checked)}
          />
          Iluminação
        </label>
        <label title="Desbota paredes somente para facilitar a inspeção visual">
          <input
            type="checkbox"
            checked={autoOcclusion}
            onChange={(event) => setAutoOcclusion(event.target.checked)}
          />
          Auto-oclusão
        </label>
        <button
          type="button"
          className={qualityMode === "work" ? "active" : ""}
          onClick={() => setQualityMode("work")}
        >
          Trabalho
        </button>
        <button
          type="button"
          className={qualityMode === "realistic" ? "active" : ""}
          onClick={() => setQualityMode("realistic")}
        >
          Realista
        </button>
        <button
          type="button"
          className={qualityMode === "presentation" ? "active" : ""}
          onClick={() => setQualityMode("presentation")}
        >
          Apresentação
        </button>
        <button type="button" aria-label="Vista superior" title="Vista superior do móvel" onClick={focusTop}>
          <ArrowUp size={15} />
        </button>
        <button type="button" aria-label="Focar cena" onClick={focusScene}>
          <Expand size={15} />
        </button>
      </div>
    </>
  );
}
