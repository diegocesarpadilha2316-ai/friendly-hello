import {
  Box,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Hand,
  ZoomIn,
  Ruler,
  MousePointer2,
  Scissors,
  Camera,
  Grid2X2,
  ListTree,
  Calculator,
  Share2
} from "lucide-react";
import type { ToolMode } from "./planner-ui";

interface Props {
  toolMode: ToolMode;
  projectName: string;
  onToolModeChange: (mode: ToolMode) => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onRender?: () => void;
  onOpenFloorPlan?: () => void;
  onOpenCutList?: () => void;
  onOpenBudget?: () => void;
}

function Tool({
  label,
  active,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`dioris-tool ${active ? "is-active" : ""}`}
      onClick={onClick}
      title={label}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

export function TopToolbar(props: Props) {
  return (
    <header className="dioris-topbar">
      <div className="dioris-brand">
        <div className="dioris-brand-mark">D</div>
        <div>
          <strong>DIORIS PLANNER V2</strong>
          <small>{props.projectName}</small>
        </div>
      </div>

      <nav className="dioris-toolbar" aria-label="Ferramentas principais">
        <Tool label="Novo"><Box size={17} /></Tool>
        <Tool label="Abrir"><FolderOpen size={17} /></Tool>
        <Tool label="Salvar" onClick={props.onSave}><Save size={17} /></Tool>
        <Tool label="Desfazer" onClick={props.onUndo}><Undo2 size={17} /></Tool>
        <Tool label="Refazer" onClick={props.onRedo}><Redo2 size={17} /></Tool>
        <Tool
          label="Orbit"
          active={props.toolMode === "orbit"}
          onClick={() => props.onToolModeChange("orbit")}
        ><Box size={17} /></Tool>
        <Tool
          label="Pan"
          active={props.toolMode === "pan"}
          onClick={() => props.onToolModeChange("pan")}
        ><Hand size={17} /></Tool>
        <Tool
          label="Zoom"
          active={props.toolMode === "zoom"}
          onClick={() => props.onToolModeChange("zoom")}
        ><ZoomIn size={17} /></Tool>
        <Tool
          label="Medir"
          active={props.toolMode === "measure"}
          onClick={() => props.onToolModeChange("measure")}
        ><Ruler size={17} /></Tool>
        <Tool
          label="Selecionar"
          active={props.toolMode === "select"}
          onClick={() => props.onToolModeChange("select")}
        ><MousePointer2 size={17} /></Tool>
        <Tool label="Cortar"><Scissors size={17} /></Tool>
        <Tool label="Render" onClick={props.onRender}><Camera size={17} /></Tool>
        <Tool label="Planta 2D" onClick={props.onOpenFloorPlan}><Grid2X2 size={17} /></Tool>
        <Tool label="Lista de Corte" onClick={props.onOpenCutList}><ListTree size={17} /></Tool>
        <Tool label="Orçamento" onClick={props.onOpenBudget}><Calculator size={17} /></Tool>
      </nav>

      <div className="dioris-top-actions">
        <button type="button" className="dioris-primary-button" onClick={props.onSave}>
          <Save size={16} /> Salvar
        </button>
        <button type="button" className="dioris-secondary-button">
          <Share2 size={16} /> Compartilhar
        </button>
      </div>
    </header>
  );
}
