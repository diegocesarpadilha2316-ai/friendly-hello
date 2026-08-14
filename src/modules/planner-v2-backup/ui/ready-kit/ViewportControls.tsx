import {
  Box,
  Focus,
  Grid3X3,
  Hand,
  Lightbulb,
  Maximize2,
  MousePointer2,
  Move3D,
  Rotate3D,
  ZoomIn,
  Camera,
  Layout,
  Layers,
  Eye,
} from "lucide-react";
import { usePlannerStore } from "./usePlannerStoreReady";

export function ViewportControls() {
  const toolMode = usePlannerStore((s) => s.toolMode);
  const setToolMode = usePlannerStore((s) => s.setToolMode);
  const gridVisible = usePlannerStore((s) => s.gridVisible);
  const setGridVisible = usePlannerStore((s) => s.setGridVisible);
  const lightsEnabled = usePlannerStore((s) => s.lightsEnabled);
  const setLightsEnabled = usePlannerStore((s) => s.setLightsEnabled);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const duplicateSelected = usePlannerStore((s) => s.duplicateSelected);
  const deleteSelected = usePlannerStore((s) => s.deleteSelected);
  const viewMode = usePlannerStore((s) => s.viewMode) || "presentation";
  const setViewMode = usePlannerStore((s) => s.setViewMode);
  const setCameraAction = usePlannerStore((s) => s.setCameraAction);

  return (
    <>
      <div className="floating-tools">
        <button
          className={toolMode === "orbit" ? "active" : ""}
          onClick={() => setToolMode("orbit")}
        >
          <Box size={16} /> Orbit
        </button>
        <button className={toolMode === "pan" ? "active" : ""} onClick={() => setToolMode("pan")}>
          <Hand size={16} /> Pan
        </button>
        <button>
          <ZoomIn size={16} /> Zoom
        </button>
        <button
          className={toolMode === "select" ? "active" : ""}
          onClick={() => setToolMode("select")}
        >
          <MousePointer2 size={16} /> Selecionar
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <button onClick={() => setCameraAction("room")} title="Enquadrar Ambiente">
          <Camera size={16} />
        </button>
        <button onClick={() => setCameraAction("perspective")} title="Perspectiva">
          <Layout size={16} />
        </button>
        <button onClick={() => setCameraAction("front")} title="Vista Frontal">
          <Layers size={16} />
        </button>
        <button onClick={() => setCameraAction("top")} title="Vista Superior">
          <Eye size={16} />
        </button>
      </div>

      {selectedId && (
        <div className="object-tools">
          <button title="Mover">
            <Move3D size={17} />
          </button>
          <button title="Girar">
            <Rotate3D size={17} />
          </button>
          <button title="Foco">
            <Focus size={17} />
          </button>
          <button title="Duplicar" onClick={duplicateSelected}>
            ⧉
          </button>
          <button title="Excluir" onClick={deleteSelected}>
            ⌫
          </button>
        </div>
      )}

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
            onChange={(e: any) => setGridVisible(e.target.checked)}
          />{" "}
          Grade
        </label>
        <label>
          <Lightbulb size={14} />
          <input
            type="checkbox"
            checked={lightsEnabled}
            onChange={(e: any) => setLightsEnabled(e.target.checked)}
          />{" "}
          Iluminação
        </label>
        <button
          className={viewMode === "presentation" ? "active" : ""}
          onClick={() => setViewMode("presentation")}
        >
          Apresentação
        </button>
        <button
          className={viewMode === "technical" ? "active" : ""}
          onClick={() => setViewMode("technical")}
        >
          Técnico
        </button>
        <Maximize2 size={15} />
      </div>
    </>
  );
}
