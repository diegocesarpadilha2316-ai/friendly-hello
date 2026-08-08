import {
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Layers3,
  Lightbulb,
  MoreHorizontal,
  PanelTop,
  Palette,
  Square,
  Wrench
} from "lucide-react";
import { usePlannerStore } from "./usePlannerStoreReady";
import { LibraryPanel } from "../../library/ui/LibraryPanel";


export function Explorer() {
  const leftTab = usePlannerStore((s) => s.leftTab || "structure");
  const setLeftTab = (tab: any) => usePlannerStore.setState({ leftTab: tab });
  const collapsed = usePlannerStore((s) => s.leftCollapsed);

  const toggleLeft = usePlannerStore((s) => s.toggleLeft);
  const furniture = usePlannerStore((s) => s.furniture);
  const selectedId = usePlannerStore((s) => s.selectedId);
  
  const selectFurniture = (id: string | null) => {
    usePlannerStore.getState().selectFurniture(id);
    usePlannerStore.getState().setMobileDrawer(false);
  };

  const toggleVisibility = (id: string) => usePlannerStore.getState().toggleVisibility(id);


  return (
    <aside className={`explorer ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-head">
        {!collapsed && <strong>Estrutura do Projeto</strong>}
        <button type="button" onClick={toggleLeft}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="panel-tabs">
          <button 
            className={leftTab === "structure" ? "active" : ""} 
            onClick={() => setLeftTab("structure")}
          >
            Estrutura
          </button>
          <button 
            className={leftTab === "library" ? "active" : ""} 
            onClick={() => setLeftTab("library")}
          >
            Biblioteca
          </button>
          <button 
            className={leftTab === "rooms" ? "active" : ""} 
            onClick={() => setLeftTab("rooms")}
          >
            Ambientes
          </button>
        </div>
      )}

      <div className="tree">
        {leftTab === "library" ? (
          <LibraryPanel />
        ) : (
          <>
            <div className="tree-row root">
              <ChevronDown size={14} />
              <Box size={16} />
              {!collapsed && <span>Sala Cozinha</span>}
              {!collapsed && <span className="grow" />}
              {!collapsed && <Eye size={15} />}
            </div>

            {!collapsed && (
              <>
                <div className="tree-row child"><Square size={15} /><span>Paredes</span><span className="grow" /><Eye size={15} /></div>
                <div className="tree-row child"><Layers3 size={15} /><span>Piso</span><span className="grow" /><Eye size={15} /></div>
                <div className="tree-row child"><PanelTop size={15} /><span>Teto</span><span className="grow" /><Eye size={15} /></div>
              </>
            )}

            <div className="tree-row root">
              <ChevronDown size={14} />
              <Layers3 size={16} />
              {!collapsed && <span>Móveis</span>}
              {!collapsed && <span className="grow" />}
            </div>

            {(furniture || []).map((item: any) => (
              <button
                type="button"
                className={`tree-row furniture child ${selectedId === item.id ? "selected" : ""}`}
                key={item.id}
                onClick={() => selectFurniture(item.id)}
                title={collapsed ? item.name : undefined}
              >
                <Box size={15} />
                {!collapsed && <span>{item.name}</span>}
                {!collapsed && <span className="grow" />}
                {!collapsed && (
                  <>
                    <span
                      className="inline-action"
                      onClick={(event: any) => {
                        event.stopPropagation();
                        toggleVisibility(item.id);
                      }}
                    >
                      {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </span>
                    <MoreHorizontal size={15} />
                  </>
                )}
              </button>
            ))}

            {!collapsed && (
              <>
                <div className="tree-row root"><Palette size={16} /><span>Materiais</span><span className="grow" /></div>
                <div className="tree-row root"><Lightbulb size={16} /><span>Iluminação</span><span className="grow" /></div>
                <div className="tree-row root"><Wrench size={16} /><span>Ferragens</span><span className="grow" /></div>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
