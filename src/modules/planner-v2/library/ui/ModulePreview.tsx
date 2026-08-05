import type { ModuleDefinition } from "../contracts/ModuleDefinition";
import { resolveMaterial } from "../services/resolveMaterial";

/** Miniatura simples e determinística (sem 3D) do módulo. */
export function ModulePreview({ definition }: { definition: ModuleDefinition }) {
  const material = resolveMaterial(definition.defaultMaterialId);
  const { width, height } = definition.defaultDimensionsMm;
  const ratio = width / height;
  const boxWidth = ratio >= 1 ? 46 : 46 * ratio;
  const boxHeight = ratio >= 1 ? 46 / ratio : 46;

  return (
    <span className="library-thumb" aria-hidden="true">
      <span
        style={{
          width: `${boxWidth}px`,
          height: `${boxHeight}px`,
          background: material.baseColor,
          borderRadius: 3,
          display: "block",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,.35)"
        }}
      />
    </span>
  );
}