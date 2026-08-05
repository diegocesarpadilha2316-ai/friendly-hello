import { Grid3X3, Lightbulb, Maximize2 } from "lucide-react";
import { usePlannerStore } from "../state/usePlannerStore";

export function ViewportControls() {
  const gridVisible = usePlannerStore((s) => s.gridVisible);
  const setGridVisible = usePlannerStore((s) => s.setGridVisible);
  const lightsEnabled = usePlannerStore((s) => s.lightsEnabled);
  const setLightsEnabled = usePlannerStore((s) => s.setLightsEnabled);

  return (
    <>
      <div className="minimap"><div /></div>
      <div className="viewport-status">
        <span>Vista: Perspectiva</span>
        <label><Grid3X3 size={14}/><input type="checkbox" checked={gridVisible}
          onChange={(e) => setGridVisible(e.target.checked)}/>Grade</label>
        <label><Lightbulb size={14}/><input type="checkbox" checked={lightsEnabled}
          onChange={(e) => setLightsEnabled(e.target.checked)}/>Iluminação</label>
        <button className="active">Apresentação</button>
        <button>Técnico</button>
        <Maximize2 size={15}/>
      </div>
    </>
  );
}
