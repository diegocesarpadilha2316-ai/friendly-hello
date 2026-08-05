import { Plus } from "lucide-react";
import type { ModuleDefinition } from "../contracts/ModuleDefinition";
import { resolveMaterial } from "../services/resolveMaterial";
import { ModulePreview } from "./ModulePreview";

export function LibraryModuleCard({
  definition,
  onAdd
}: {
  definition: ModuleDefinition;
  onAdd: (moduleId: string) => void;
}) {
  const material = resolveMaterial(definition.defaultMaterialId);
  const { width, height, depth } = definition.defaultDimensionsMm;

  return (
    <div className="library-card">
      <ModulePreview definition={definition} />
      <div className="library-card-info">
        <strong>{definition.name}</strong>
        <span>
          {width} × {height} × {depth} mm
        </span>
        <span className="library-card-material">{material.name}</span>
      </div>
      <button type="button" className="library-add" onClick={() => onAdd(definition.id)}>
        <Plus size={14} /> Adicionar
      </button>
    </div>
  );
}