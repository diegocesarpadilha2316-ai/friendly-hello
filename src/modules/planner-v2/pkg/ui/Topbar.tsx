import {
  Box,
  Move,
  RotateCw,
  Calculator,
  Camera,
  DoorOpen,
  FolderOpen,
  Grid2X2,
  Hand,
  ListTree,
  MousePointer2,
  Redo2,
  Ruler,
  Save,
  Share2,
  Undo2,
  ZoomIn,
} from "lucide-react";
import { usePlannerStore } from "../state/usePlannerStore";
import { useImmersiveStore } from "../state/useImmersiveStore";
import type { ToolMode } from "../types";

const toolList: { label: string; icon: React.ReactNode; mode?: ToolMode }[] = [
  { label: "Novo", icon: <Box size={17} /> },
  { label: "Abrir", icon: <FolderOpen size={17} /> },
  { label: "Salvar", icon: <Save size={17} /> },
  { label: "Desfazer", icon: <Undo2 size={17} /> },
  { label: "Refazer", icon: <Redo2 size={17} /> },
  { label: "Orbit", icon: <Box size={17} />, mode: "orbit" },
  { label: "Pan", icon: <Hand size={17} />, mode: "pan" },
  { label: "Zoom", icon: <ZoomIn size={17} />, mode: "pan" },
  { label: "Medir", icon: <Ruler size={17} />, mode: "measure" },
  { label: "Selecionar", icon: <MousePointer2 size={17} />, mode: "select" },
  { label: "Mover", icon: <Move size={17} />, mode: "move" },
  { label: "Rotacionar", icon: <RotateCw size={17} />, mode: "rotate" },
  { label: "Medidas", icon: <Ruler size={17} />, mode: "dimensions" },
  { label: "Render", icon: <Camera size={17} /> },
  { label: "Planta 2D", icon: <Grid2X2 size={17} /> },
  { label: "Plano de Corte", icon: <ListTree size={17} /> },
  { label: "Orçamento", icon: <Calculator size={17} /> },
];

export function Topbar() {
  const toolMode = usePlannerStore((s) => s.toolMode);
  const setToolMode = usePlannerStore((s) => s.setToolMode);
  const saveProject = usePlannerStore((s) => s.saveProject);
  const loadProject = usePlannerStore((s) => s.loadProject);
  const newProject = usePlannerStore((s) => s.newProject);
  const setRightTab = usePlannerStore((s) => s.setRightTab);
  const undo = usePlannerStore((s) => s.undo);
  const redo = usePlannerStore((s) => s.redo);
  const canUndo = usePlannerStore((s) => s.canUndo);
  const canRedo = usePlannerStore((s) => s.canRedo);
  usePlannerStore((s) => s.historyVersion);
  const navigationMode = useImmersiveStore((s) => s.navigationMode);
  const setNavigationMode = useImmersiveStore((s) => s.setNavigationMode);

  return (
    <header className="topbar">
      <div className="brand">
        <img src="/src/assets/dioris-logo.png" alt="Dioris" />
        <div>
          <strong>DIORIS PLANNER V2</strong>
          <small>Cozinha Moderna — Dioris User</small>
        </div>
      </div>

      <nav className="toolbar">
        {toolList.map((tool) => (
          <button
            type="button"
            key={tool.label}
            className={`tool ${tool.mode === toolMode ? "active" : ""}`}
            disabled={
              tool.label === "Desfazer"
                ? !canUndo()
                : tool.label === "Refazer"
                  ? !canRedo()
                  : undefined
            }
            onClick={() => {
              if (tool.mode) setToolMode(tool.mode);
              if (tool.label === "Novo") newProject();
              if (tool.label === "Abrir") loadProject();
              if (tool.label === "Salvar") saveProject();
              if (tool.label === "Desfazer") undo();
              if (tool.label === "Refazer") redo();
              if (tool.label === "Render")
                window.dispatchEvent(new CustomEvent("dioris:open-render-final"));
              if (tool.label === "Plano de Corte") setRightTab("fabrication");
            }}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`tool ${navigationMode === "walk" ? "active" : ""}`}
          onClick={() => setNavigationMode(navigationMode === "walk" ? "orbit" : "walk")}
          aria-pressed={navigationMode === "walk"}
        >
          <DoorOpen size={17} />
          <span>{navigationMode === "walk" ? "Sair do modo Entrar" : "Entrar"}</span>
        </button>
      </nav>

      <div className="top-actions">
        <button type="button" className="primary" onClick={saveProject}>
          <Save size={16} /> Salvar
        </button>
        <button type="button" className="secondary">
          <Share2 size={16} /> Compartilhar
        </button>
      </div>
    </header>
  );
}
