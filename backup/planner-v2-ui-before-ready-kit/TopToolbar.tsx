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
        <div className="dioris-brand-mark">DI</div>
        <div>
          <strong>DIORIS CAD</strong>
          <small>{props.projectName}</small>
        </div>
      </div>

      <nav className="dioris-toolbar" aria-label="CAD Tools">
        <Tool label="Novo"><Box size={14} /></Tool>
        <Tool label="Abrir"><FolderOpen size={14} /></Tool>
        <Tool label="Salvar" onClick={props.onSave}><Save size={14} /></Tool>
        <div className="dioris-divider" />
        <Tool label="Desfazer" onClick={props.onUndo}><Undo2 size={14} /></Tool>
        <Tool label="Refazer" onClick={props.onRedo}><Redo2 size={14} /></Tool>
        <div className="dioris-divider" />
        <Tool
          label="Orbit"
          active={props.toolMode === "orbit"}
          onClick={() => props.onToolModeChange("orbit")}
        ><Box size={14} /></Tool>
        <Tool
          label="Pan"
          active={props.toolMode === "pan"}
          onClick={() => props.onToolModeChange("pan")}
        ><Hand size={14} /></Tool>
        <Tool
          label="Zoom"
          active={props.toolMode === "zoom"}
          onClick={() => props.onToolModeChange("zoom")}
        ><ZoomIn size={14} /></Tool>
        <div className="dioris-divider" />
        <Tool
          label="Medir"
          active={props.toolMode === "measure"}
          onClick={() => props.onToolModeChange("measure")}
        ><Ruler size={14} /></Tool>
        <Tool
          label="Select"
          active={props.toolMode === "select"}
          onClick={() => props.onToolModeChange("select")}
        ><MousePointer2 size={14} /></Tool>
        <div className="dioris-divider" />
        <Tool label="Render" onClick={props.onRender}><Camera size={14} /></Tool>
        <Tool label="Planta" onClick={props.onOpenFloorPlan}><Grid2X2 size={14} /></Tool>
        <Tool label="Corte" onClick={props.onOpenCutList}><ListTree size={14} /></Tool>
        <Tool label="Custos" onClick={props.onOpenBudget}><Calculator size={14} /></Tool>
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
