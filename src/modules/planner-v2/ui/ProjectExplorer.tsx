import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  MoreHorizontal,
  Box,
  Layers3,
  PanelTop,
  Square,
  Lightbulb,
  Wrench,
  Palette,
  Armchair,
} from "lucide-react";
import type { ProjectTreeItem } from "./planner-ui";

const icons: Record<ProjectTreeItem["kind"], any> = {
  room: Box,
  wall: Square,
  floor: Layers3,
  ceiling: PanelTop,
  group: Layers3,
  furniture: Box,
  material: Palette,
  lighting: Lightbulb,
  hardware: Wrench,
  decoration: Armchair,
};

interface Props {
  items: ProjectTreeItem[];
  collapsed: boolean;
  selectedId: string | null;
  onSelect?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
}

export function ProjectExplorer({
  items,
  collapsed,
  selectedId,
  onSelect,
  onToggleVisibility,
}: Props) {
  const renderItem = (item: ProjectTreeItem, depth = 0) => {
    const Icon = icons[item.kind];
    const hasChildren = Boolean(item.children?.length);

    return (
      <div key={item.id}>
        <button
          type="button"
          className={`dioris-tree-row ${selectedId === item.id ? "is-selected" : ""}`}
          style={{ paddingLeft: collapsed ? 24 : 10 + depth * 18 }}
          onClick={() => onSelect?.(item.id)}
          title={collapsed ? item.name : undefined}
        >
          {!collapsed && (
            <span className="dioris-tree-chevron">
              {hasChildren ? <ChevronDown size={14} /> : <span />}
            </span>
          )}

          <Icon size={16} />
          {!collapsed && <span className="dioris-tree-name">{item.name}</span>}

          {!collapsed && <span className="dioris-tree-spacer" />}

          {!collapsed && (
            <>
              <span
                className="dioris-tree-action"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleVisibility?.(item.id);
                }}
              >
                {item.visible === false ? <EyeOff size={15} /> : <Eye size={15} />}
              </span>

              {item.color && (
                <span className="dioris-tree-color" style={{ background: item.color }} />
              )}

              <MoreHorizontal size={15} className="dioris-tree-more" />
            </>
          )}
        </button>

        {hasChildren && item.children?.map((child) => renderItem(child, depth + 1))}
      </div>
    );
  };

  return <div className="dioris-tree">{items.map((item) => renderItem(item))}</div>;
}
