import {
  Box,
  Calculator,
  Camera,
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
  ZoomIn
} from "lucide-react";
import { usePlannerStore } from "../state/usePlannerStore";
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
  { label: "Render", icon: <Camera size={17} /> },
  { label: "Planta 2D", icon: <Grid2X2 size={17} /> },
  { label: "Lista de Corte", icon: <ListTree size={17} /> },
  { label: "Orçamento", icon: <Calculator size={17} /> }
];

export function Topbar() {
  const toolMode = usePlannerStore((s) => s.toolMode);
  const setToolMode = usePlannerStore((s) => s.setToolMode);

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
            onClick={() => tool.mode && setToolMode(tool.mode)}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <button type="button" className="primary"><Save size={16} /> Salvar</button>
        <button type="button" className="secondary"><Share2 size={16} /> Compartilhar</button>
      </div>
    </header>
  );
}
