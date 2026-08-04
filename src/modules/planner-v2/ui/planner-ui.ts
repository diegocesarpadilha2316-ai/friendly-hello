export type RightPanelTab = "chat" | "inspector" | "materials" | "hardware";
export type LeftPanelTab = "structure" | "library" | "rooms";
export type ViewMode = "presentation" | "technical";
export type ToolMode = "orbit" | "pan" | "zoom" | "measure" | "select";

export interface ProjectTreeItem {
  id: string;
  name: string;
  kind:
    | "room"
    | "wall"
    | "floor"
    | "ceiling"
    | "group"
    | "furniture"
    | "material"
    | "lighting"
    | "hardware"
    | "decoration";
  children?: ProjectTreeItem[];
  visible?: boolean;
  selected?: boolean;
  color?: string;
}

export interface FurnitureSelection {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  positionX: number;
  positionZ: number;
  rotationDeg: number;
  materialId?: string;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
}

export interface PlannerUIState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  leftWidth: number;
  rightWidth: number;
  leftTab: LeftPanelTab;
  rightTab: RightPanelTab;
  viewMode: ViewMode;
  toolMode: ToolMode;
  gridVisible: boolean;
  lightingEnabled: boolean;
  mobileExplorerOpen: boolean;
  mobileCopilotOpen: boolean;
  mobileCopilotHeight: 25 | 50 | 100;
  selectedFurnitureId: string | null;
}

export interface PlannerV2ShellProps {
  projectName?: string;
  clientName?: string;
  tree: ProjectTreeItem[];
  selectedFurniture?: FurnitureSelection | null;
  messages: ChatMessage[];
  fps?: number;
  autosaveStatus?: "saved" | "saving" | "error";
  children: React.ReactNode;

  onSelectTreeItem?: (id: string) => void;
  onToggleTreeVisibility?: (id: string) => void;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  onMoveSelected?: () => void;
  onRotateSelected?: () => void;
  onFocusSelected?: () => void;
  onUpdateSelected?: (patch: Partial<FurnitureSelection>) => void;
  onSendMessage?: (message: string) => void;

  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onRender?: () => void;
  onOpenFloorPlan?: () => void;
  onOpenCutList?: () => void;
  onOpenBudget?: () => void;
}
