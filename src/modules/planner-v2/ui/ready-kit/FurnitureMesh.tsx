import { Edges } from "@react-three/drei";
import type { FurnitureItem } from "../types";
import { usePlannerStore } from "./usePlannerStoreReady";

const colors: Record<string, string> = {
  taupe: "#8b7564",
  wood: "#7a4f2c",
  stone: "#cbbba6",
  white: "#e8e5df",
  graphite: "#4a4745"
};

export function FurnitureMesh({ item }: { item: FurnitureItem }) {
  const selectFurniture = usePlannerStore((s) => s.selectFurniture);

  if (!item.visible) return null;

  return (
    <group
      position={item.position}
      rotation={[0, item.rotationY, 0]}
      onClick={(event) => {
        event.stopPropagation();
        selectFurniture(item.id);
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={item.size} />
        <meshStandardMaterial
          color={colors[item.material] ?? "#8b7564"}
          roughness={0.55}
          metalness={0.04}
        />
        {item.selected && <Edges color="#7c6cff" scale={1.01} />}
      </mesh>

      {item.kind === "island" && (
        <mesh position={[0, item.size[1] / 2 + 0.035, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.size[0] + 0.08, 0.07, item.size[2] + 0.08]} />
          <meshStandardMaterial color="#d8cabb" roughness={0.32} />
        </mesh>
      )}

      {item.kind === "base" && (
        <>
          <mesh position={[0, item.size[1] / 2 + 0.025, 0]} castShadow receiveShadow>
            <boxGeometry args={[item.size[0] + 0.04, 0.05, item.size[2] + 0.04]} />
            <meshStandardMaterial color="#d8cabb" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, item.size[2] / 2 + 0.01]}>
            <boxGeometry args={[item.size[0] * 0.96, item.size[1] * 0.9, 0.018]} />
            <meshStandardMaterial color={colors[item.material] ?? "#8b7564"} roughness={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
}
