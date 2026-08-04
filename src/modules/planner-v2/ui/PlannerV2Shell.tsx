import {
  Bot,
  Box,
  ChevronLeft,
  ChevronRight,
  Menu,
  Settings2
} from "lucide-react";
import { useMemo } from "react";
import { usePlannerUIState } from "./use-planner-ui-state";
import type { PlannerV2ShellProps } from "./planner-ui";
import { CopilotPanel } from "./CopilotPanel";
import { MobilePanels } from "./MobilePanels";
import { ProjectExplorer } from "./ProjectExplorer";
import { TopToolbar } from "./TopToolbar";
import { ViewportChrome } from "./ViewportChrome";

export function PlannerV2Shell({
  projectName = "Projeto Dioris",
  clientName = "CAD Studio",
  tree,
  selectedFurniture,
  messages,
  fps = 60,
  autosaveStatus = "saved",
  children,
  ...events
}: PlannerV2ShellProps) {
  const { state, patch } = usePlannerUIState();

  const selectedId =
    selectedFurniture?.id ?? state.selectedFurnitureId ?? null;

  const shellStyle = useMemo(
    () =>
      ({
        "--dioris-left-panel-width": `${state.leftCollapsed ? 0 : 320}px`,
        "--dioris-right-panel-width": `${state.rightCollapsed ? 0 : 360}px`
      }) as React.CSSProperties,
    [
      state.leftCollapsed,
      state.leftWidth,
      state.rightCollapsed,
      state.rightWidth
    ]
  );

  return (
    <div className="dioris-shell" style={shellStyle}>
      <TopToolbar
        projectName={`${projectName} — ${clientName}`}
        toolMode={state.toolMode}
        onToolModeChange={(toolMode) => patch({ toolMode })}
        onSave={events.onSave}
        onUndo={events.onUndo}
        onRedo={events.onRedo}
        onRender={events.onRender}
        onOpenFloorPlan={events.onOpenFloorPlan}
        onOpenCutList={events.onOpenCutList}
        onOpenBudget={events.onOpenBudget}
      />

      <main className="dioris-workspace">
        <aside className={`dioris-left-panel ${state.leftCollapsed ? 'is-collapsed' : ''}`}>
          <div className="dioris-panel-head">
            {!state.leftCollapsed && <strong>PROJETO</strong>}
            <button
              type="button"
              className="dioris-panel-toggle"
              onClick={() => patch({ leftCollapsed: !state.leftCollapsed })}
            >
              {state.leftCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {!state.leftCollapsed && (
            <div className="dioris-left-tabs">
              <button
                type="button"
                className={state.leftTab === "structure" ? "is-active" : ""}
                onClick={() => patch({ leftTab: "structure" })}
              >
                Estrutura
              </button>
              <button
                type="button"
                className={state.leftTab === "library" ? "is-active" : ""}
                onClick={() => patch({ leftTab: "library" })}
              >
                Biblioteca
              </button>
              <button
                type="button"
                className={state.leftTab === "rooms" ? "is-active" : ""}
                onClick={() => patch({ leftTab: "rooms" })}
              >
                Ambientes
              </button>
              <button
                type="button"
                className={state.leftTab === "project" ? "is-active" : ""}
                onClick={() => patch({ leftTab: "project" })}
              >
                Projeto
              </button>
            </div>
          )}

          {state.leftCollapsed ? (
            <div className="dioris-collapsed-icons">
              <Box size={18} />
              <Settings2 size={18} />
            </div>
          ) : (
            <ProjectExplorer
              items={tree}
              collapsed={true}
              selectedId={selectedId}
              onSelect={(id) => {
                patch({ selectedFurnitureId: id });
                events.onSelectTreeItem?.(id);
              }}
              onToggleVisibility={events.onToggleTreeVisibility}
            />
          )}
        </aside>

        <section
          className={`dioris-viewport ${
            state.gridVisible ? "has-grid" : ""
          } ${state.lightingEnabled ? "" : "is-dimmed"}`}
        >
          <div className="dioris-viewport-content">{children}</div>

          <ViewportChrome
            toolMode={state.toolMode}
            viewMode={state.viewMode}
            gridVisible={state.gridVisible}
            lightingEnabled={state.lightingEnabled}
            selected={Boolean(selectedFurniture)}
            onToolModeChange={(toolMode) => patch({ toolMode })}
            onGridChange={(gridVisible) => patch({ gridVisible })}
            onLightingChange={(lightingEnabled) => patch({ lightingEnabled })}
            onViewModeChange={(viewMode) => patch({ viewMode })}
            onMove={events.onMoveSelected}
            onRotate={events.onRotateSelected}
            onDuplicate={events.onDuplicateSelected}
            onDelete={events.onDeleteSelected}
            onFocus={events.onFocusSelected}
          />

          <MobilePanels
            explorerOpen={state.mobileExplorerOpen}
            copilotOpen={state.mobileCopilotOpen}
            copilotHeight={state.mobileCopilotHeight}
            tree={tree}
            selectedId={selectedId}
            messages={messages}
            activeTab={state.rightTab}
            selectedFurniture={selectedFurniture}
            onCloseExplorer={() => patch({ mobileExplorerOpen: false })}
            onCloseCopilot={() => patch({ mobileCopilotOpen: false })}
            onSelectTreeItem={events.onSelectTreeItem}
            onToggleTreeVisibility={events.onToggleTreeVisibility}
            onTabChange={(rightTab) => patch({ rightTab })}
            onHeightChange={(mobileCopilotHeight) =>
              patch({ mobileCopilotHeight })
            }
            onSendMessage={events.onSendMessage}
            onUpdateSelected={events.onUpdateSelected}
          />
        </section>

        <aside className={`dioris-right-panel ${state.rightCollapsed ? 'is-collapsed' : ''}`}>
          <div className="dioris-panel-head">
            {!state.rightCollapsed && <strong>INSPETOR</strong>}
            <button
              type="button"
              className="dioris-panel-toggle"
              onClick={() => patch({ rightCollapsed: !state.rightCollapsed })}
            >
              {state.rightCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {state.rightCollapsed ? (
            <div className="dioris-collapsed-icons">
              <Bot size={18} />
            </div>
          ) : (
            <CopilotPanel
              activeTab={state.rightTab}
              messages={messages}
              selectedFurniture={selectedFurniture}
              onTabChange={(rightTab) => patch({ rightTab })}
              onSendMessage={events.onSendMessage}
              onUpdateSelected={events.onUpdateSelected}
            />
          )}
        </aside>
      </main>

      <footer className="dioris-statusbar">
        <span className="is-ready">● READY</span>
        <span>FPS {fps}</span>
        <span>UNIDADE mm</span>
        <span>SNAP ATIVO</span>
        <span className="dioris-status-spacer" />
        <span>
          {autosaveStatus === "saved"
            ? "AUTOSAVE ✓"
            : autosaveStatus === "saving"
              ? "SALVANDO..."
              : "ERRO AO SALVAR"}
        </span>
      </footer>

      <nav className="dioris-mobile-nav">
        <button
          type="button"
          onClick={() => patch({ mobileExplorerOpen: true })}
        >
          <Menu size={18} />
          <span>Projeto</span>
        </button>
        <button type="button">
          <Box size={18} />
          <span>3D</span>
        </button>
        <button
          type="button"
          onClick={() => patch({ mobileCopilotOpen: true })}
        >
          <Bot size={18} />
          <span>IA</span>
        </button>
        <button
          type="button"
          onClick={() =>
            patch({ mobileCopilotOpen: true, rightTab: "inspector" })
          }
        >
          <Settings2 size={18} />
          <span>Propriedades</span>
        </button>
      </nav>
    </div>
  );
}
