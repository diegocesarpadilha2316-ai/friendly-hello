import { Plus } from "lucide-react";
import type { ModuleDefinition } from "../contracts/ModuleDefinition";
import { resolveMaterial } from "../services/resolveMaterial";
import { ModulePreview } from "./ModulePreview";

export function LibraryModuleCard({
  definition,
  onAdd,
  onDragStart,
  onDragEnd,
  onTouchStart,
}: {
  definition: ModuleDefinition;
  onAdd: (moduleId: string) => void;
  onDragStart?: (moduleId: string) => void;
  onDragEnd?: () => void;
  onTouchStart?: (moduleId: string) => void;
}) {
  const material = resolveMaterial(definition.defaultMaterialId);
  const { width, height, depth } = definition.defaultDimensionsMm;

  return (
    <div
      className="library-card"
      role="group"
      aria-label={`${definition.name}, ${width} por ${height} por ${depth} milímetros`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/x-dioris-module", definition.id);
        event.dataTransfer.effectAllowed = "copy";
        onDragStart?.(definition.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") onTouchStart?.(definition.id);
      }}
    >
      <ModulePreview definition={definition} />
      <div className="library-card-info">
        <strong>{definition.name}</strong>
        <span>
          {width} × {height} × {depth} mm
        </span>
        <span className="library-card-meta">
          {definition.category}
          {definition.subcategory ? ` · ${definition.subcategory}` : ""}
        </span>
        <span className="library-card-meta">Tipo: {definition.kind ?? "módulo"}</span>
        <span className="library-card-material">{material.name}</span>
      </div>
      <button
        type="button"
        className="library-add"
        aria-label={`Adicionar ${definition.name}`}
        onClick={() => onAdd(definition.id)}
      >
        <Plus size={14} /> Adicionar
      </button>
    </div>
  );
}
