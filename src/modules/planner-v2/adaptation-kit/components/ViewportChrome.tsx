import {
  Crosshair,
  Focus,
  Grid3X3,
  Hand,
  Lightbulb,
  Maximize2,
  MousePointer2,
  Move3D,
  Rotate3D,
  ZoomIn
} from "lucide-react";
import type { ToolMode, ViewMode } from "../types/planner-ui";

interface Props {
  toolMode: ToolMode;
  viewMode: ViewMode;
  gridVisible: boolean;
  lightingEnabled: boolean;
  selected: boolean;
  onToolModeChange: (mode: ToolMode) => void;
  onGridChange: (value: boolean) => void;
  onLightingChange: (value: boolean) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onMove?: () => void;
  onRotate?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onFocus?: () => void;
}

export function ViewportChrome(props: Props) {
  return (
    <>
      <div className="dioris-floating-toolbar">
        <button
          type="button"
          className={props.toolMode === "orbit" ? "is-active" : ""}
          onClick={() => props.onToolModeChange("orbit")}
        ><Crosshair size={16} /> Orbit</button>
        <button
          type="button"
          className={props.toolMode === "pan" ? "is-active" : ""}
          onClick={() => props.onToolModeChange("pan")}
        ><Hand size={16} /> Pan</button>
        <button
          type="button"
          className={props.toolMode === "zoom" ? "is-active" : ""}
          onClick={() => props.onToolModeChange("zoom")}
        ><ZoomIn size={16} /> Zoom</button>
        <button
          type="button"
          className={props.toolMode === "select" ? "is-active" : ""}
          onClick={() => props.onToolModeChange("select")}
        ><MousePointer2 size={16} /> Selecionar</button>
      </div>

      {props.selected && (
        <div className="dioris-object-toolbar">
          <button type="button" onClick={props.onMove}><Move3D size={17} /></button>
          <button type="button" onClick={props.onRotate}><Rotate3D size={17} /></button>
          <button type="button" onClick={props.onFocus}><Focus size={17} /></button>
          <button type="button" onClick={props.onDuplicate}>⧉</button>
          <button type="button" onClick={props.onDelete}>⌫</button>
        </div>
      )}

      <div className="dioris-minimap">
        <div className="dioris-minimap-room" />
      </div>

      <div className="dioris-viewport-status">
        <span>Vista: Perspectiva</span>
        <label>
          <Grid3X3 size={14} />
          <input
            type="checkbox"
            checked={props.gridVisible}
            onChange={(event) => props.onGridChange(event.target.checked)}
          />
          Grade
        </label>
        <label>
          <Lightbulb size={14} />
          <input
            type="checkbox"
            checked={props.lightingEnabled}
            onChange={(event) => props.onLightingChange(event.target.checked)}
          />
          Iluminação
        </label>
        <button
          type="button"
          className={props.viewMode === "presentation" ? "is-active" : ""}
          onClick={() => props.onViewModeChange("presentation")}
        >
          Apresentação
        </button>
        <button
          type="button"
          className={props.viewMode === "technical" ? "is-active" : ""}
          onClick={() => props.onViewModeChange("technical")}
        >
          Técnico
        </button>
        <Maximize2 size={15} />
      </div>
    </>
  );
}
