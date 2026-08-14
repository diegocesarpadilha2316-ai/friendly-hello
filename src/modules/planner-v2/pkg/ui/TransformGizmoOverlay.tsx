import { RotateCw, Move3d } from "lucide-react";
import { usePlannerStore } from "../state/usePlannerStore";

export function TransformGizmoOverlay() {
  const selectedId = usePlannerStore((s) => s.selectedId);
  const instance = usePlannerStore((s) => s.instances.find((item) => item.id === selectedId));
  const updateInstance = usePlannerStore((s) => s.updateFurnitureInstance);
  if (!instance || instance.locked) return null;

  const move = (axis: "x" | "y" | "z", delta: number) => {
    const next = { ...instance.positionMm, [axis]: instance.positionMm[axis] + delta };
    updateInstance(instance.id, { positionMm: next });
  };
  const rotate = (delta: number) => {
    updateInstance(instance.id, { rotationDeg: { ...instance.rotationDeg, y: instance.rotationDeg.y + delta } });
  };

  return (
    <div className="transform-gizmo-overlay" role="toolbar" aria-label="Gizmo de transformação no viewport">
      <span className="gizmo-title"><Move3d size={14} /> {instance.name}</span>
      <button type="button" onClick={() => move("x", -50)} aria-label="Mover X menos">X−</button>
      <button type="button" onClick={() => move("x", 50)} aria-label="Mover X mais">X+</button>
      <button type="button" onClick={() => move("y", 50)} aria-label="Mover Y mais">Y+</button>
      <button type="button" onClick={() => move("z", -50)} aria-label="Mover Z menos">Z−</button>
      <button type="button" onClick={() => move("z", 50)} aria-label="Mover Z mais">Z+</button>
      <button type="button" onClick={() => rotate(-5)} aria-label="Rotacionar menos"><RotateCw size={14} />−</button>
      <button type="button" onClick={() => rotate(5)} aria-label="Rotacionar mais"><RotateCw size={14} />+</button>
    </div>
  );
}
