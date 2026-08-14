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
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { usePlannerStore } from "../state/usePlannerStore";
import { ImageReferencePanel, RoomBuilderPanel } from "./RoomBuilderPanel";
import { LibraryPanel } from "../../library/ui/LibraryPanel";

type ExplorerTab = "structure" | "library" | "room" | "reference";

export function Explorer() {
  const [activeTab, setActiveTab] = useState<ExplorerTab>("structure");
  const [expandedInstances, setExpandedInstances] = useState<Record<string, boolean>>({});
  const collapsed = usePlannerStore((s) => s.leftCollapsed);
  const toggleLeft = usePlannerStore((s) => s.toggleLeft);
  const furniture = usePlannerStore((s) => s.furniture);
  const instances = usePlannerStore((s) => s.instances);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const selectFurniture = usePlannerStore((s) => s.selectFurniture);
  const selectFurnitureInstance = usePlannerStore((s) => s.selectFurnitureInstance);
  const toggleVisibility = usePlannerStore((s) => s.toggleVisibility);
  const hideFurnitureInstance = usePlannerStore((s) => s.hideFurnitureInstance);
  const showFurnitureInstance = usePlannerStore((s) => s.showFurnitureInstance);

  return (
    <aside className={`explorer ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-head">
        {!collapsed && <strong>Estrutura do Projeto</strong>}
        <button
          type="button"
          onClick={toggleLeft}
          aria-label={collapsed ? "Expandir explorador" : "Recolher explorador"}
          title={collapsed ? "Expandir explorador" : "Recolher explorador"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="panel-tabs">
          <button
            className={activeTab === "structure" ? "active" : ""}
            onClick={() => setActiveTab("structure")}
          >
            Estrutura
          </button>
          <button
            className={activeTab === "library" ? "active" : ""}
            onClick={() => setActiveTab("library")}
          >
            Biblioteca
          </button>
          <button
            className={activeTab === "room" ? "active" : ""}
            onClick={() => setActiveTab("room")}
          >
            Construir
          </button>
          <button
            className={activeTab === "reference" ? "active" : ""}
            onClick={() => setActiveTab("reference")}
          >
            Imagem IA
          </button>
        </div>
      )}

      {activeTab === "library" && !collapsed ? (
        <LibraryPanel />
      ) : activeTab === "room" && !collapsed ? (
        <RoomBuilderPanel />
      ) : activeTab === "reference" && !collapsed ? (
        <ImageReferencePanel />
      ) : (
        <div className="tree">
          <div className="tree-row root">
            <ChevronDown size={14} />
            <Box size={16} />
            {!collapsed && <span>Sala Cozinha</span>}
            {!collapsed && <span className="grow" />}
            {!collapsed && <Eye size={15} />}
          </div>

          {!collapsed && (
            <>
              <div className="tree-row child">
                <Square size={15} />
                <span>Paredes</span>
                <span className="grow" />
                <Eye size={15} />
              </div>
              <div className="tree-row child">
                <Layers3 size={15} />
                <span>Piso</span>
                <span className="grow" />
                <Eye size={15} />
              </div>
              <div className="tree-row child">
                <PanelTop size={15} />
                <span>Teto</span>
                <span className="grow" />
                <Eye size={15} />
              </div>
            </>
          )}

          <div className="tree-row root">
            <ChevronDown size={14} />
            <Layers3 size={16} />
            {!collapsed && <span>Móveis</span>}
            {!collapsed && <span className="grow" />}
          </div>

          {instances.length > 0
            ? instances.map((instance) => (
                <div key={instance.id}>
                  <button
                    type="button"
                    className={`tree-row furniture child ${selectedId === instance.id ? "selected" : ""}`}
                    onClick={() => {
                      selectFurnitureInstance(instance.id);
                      setExpandedInstances((current) => ({
                        ...current,
                        [instance.id]: !current[instance.id],
                      }));
                    }}
                    title={collapsed ? instance.name : undefined}
                  >
                    {expandedInstances[instance.id] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    <Box size={15} />
                    {!collapsed && <span>{instance.name}</span>}
                    {!collapsed && <span className="grow" />}
                    {!collapsed && (
                      <>
                        <span
                          className="inline-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            instance.visible
                              ? hideFurnitureInstance(instance.id)
                              : showFurnitureInstance(instance.id);
                          }}
                        >
                          {instance.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </span>
                        <MoreHorizontal size={15} />
                      </>
                    )}
                  </button>
                  {!collapsed &&
                    expandedInstances[instance.id] &&
                    instance.parts.map((part) => (
                      <button
                        type="button"
                        className="tree-row child part-row"
                        key={part.id}
                        onClick={() => selectFurnitureInstance(instance.id)}
                        title={part.name}
                      >
                        <span className="tree-indent" />
                        <Square size={13} />
                        <span>{part.name}</span>
                        <span className="grow" />
                        {part.hardwareId && <Wrench size={13} />}
                      </button>
                    ))}
                </div>
              ))
            : furniture.map((item) => (
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
                        onClick={(event) => {
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
              <div className="tree-row root">
                <Palette size={16} />
                <span>Materiais</span>
                <span className="grow" />
              </div>
              <div className="tree-row root">
                <Lightbulb size={16} />
                <span>Iluminação</span>
                <span className="grow" />
              </div>
              <div className="tree-row root">
                <Wrench size={16} />
                <span>Ferragens</span>
                <span className="grow" />
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
