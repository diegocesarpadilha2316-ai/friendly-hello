import { X } from "lucide-react";
import type {
  ChatMessage,
  FurnitureSelection,
  ProjectTreeItem,
  RightPanelTab
} from "../types/planner-ui";
import { CopilotPanel } from "./CopilotPanel";
import { ProjectExplorer } from "./ProjectExplorer";

interface Props {
  explorerOpen: boolean;
  copilotOpen: boolean;
  copilotHeight: 25 | 50 | 100;
  tree: ProjectTreeItem[];
  selectedId: string | null;
  messages: ChatMessage[];
  activeTab: RightPanelTab;
  selectedFurniture?: FurnitureSelection | null;
  onCloseExplorer: () => void;
  onCloseCopilot: () => void;
  onSelectTreeItem?: (id: string) => void;
  onToggleTreeVisibility?: (id: string) => void;
  onTabChange: (tab: RightPanelTab) => void;
  onHeightChange: (height: 25 | 50 | 100) => void;
  onSendMessage?: (message: string) => void;
  onUpdateSelected?: (patch: Partial<FurnitureSelection>) => void;
}

export function MobilePanels(props: Props) {
  return (
    <>
      <div
        className={`dioris-mobile-backdrop ${
          props.explorerOpen ? "is-visible" : ""
        }`}
        onClick={props.onCloseExplorer}
      />

      <aside
        className={`dioris-mobile-drawer ${
          props.explorerOpen ? "is-open" : ""
        }`}
      >
        <div className="dioris-mobile-panel-head">
          <strong>Estrutura do Projeto</strong>
          <button type="button" onClick={props.onCloseExplorer}><X size={17} /></button>
        </div>
        <ProjectExplorer
          items={props.tree}
          collapsed={false}
          selectedId={props.selectedId}
          onSelect={(id) => {
            props.onSelectTreeItem?.(id);
            props.onCloseExplorer();
          }}
          onToggleVisibility={props.onToggleTreeVisibility}
        />
      </aside>

      <section
        className={`dioris-mobile-sheet ${
          props.copilotOpen ? "is-open" : ""
        }`}
        style={{ height: `${props.copilotHeight}%` }}
      >
        <div className="dioris-sheet-handle" />
        <div className="dioris-mobile-panel-head">
          <strong>IA Copiloto</strong>
          <div>
            {[25, 50, 100].map((height) => (
              <button
                type="button"
                key={height}
                onClick={() => props.onHeightChange(height as 25 | 50 | 100)}
              >
                {height === 25 ? "¼" : height === 50 ? "½" : "1"}
              </button>
            ))}
            <button type="button" onClick={props.onCloseCopilot}><X size={17} /></button>
          </div>
        </div>
        <CopilotPanel
          activeTab={props.activeTab}
          messages={props.messages}
          selectedFurniture={props.selectedFurniture}
          onTabChange={props.onTabChange}
          onSendMessage={props.onSendMessage}
          onUpdateSelected={props.onUpdateSelected}
        />
      </section>
    </>
  );
}
