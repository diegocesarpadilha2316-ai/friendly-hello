import { useImmersiveStore } from "../state/useImmersiveStore";
import { useRoomBuilderStore } from "../state/useRoomBuilderStore";

const sceneContent = (assetId: string) => ({
  renderLayer: "SCENE_CONTENT",
  assetId,
  assetCategory: "appliance",
  implementation: "procedural",
});

function Cooktop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} userData={sceneContent("appliance-cooktop")}>
      <mesh position={[0, 0.018, 0]}>
        <boxGeometry args={[0.76, 0.035, 0.52]} />
        <meshPhysicalMaterial color="#101216" roughness={0.18} metalness={0.18} clearcoat={0.75} />
      </mesh>
      {[
        [-0.22, -0.12],
        [0.22, -0.12],
        [-0.22, 0.12],
        [0.22, 0.12],
      ].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.041, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[index === 0 ? 0.105 : 0.085, 0.012, 12, 32]} />
          <meshStandardMaterial color="#c6c7c8" metalness={0.84} roughness={0.26} />
        </mesh>
      ))}
    </group>
  );
}

function Oven({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} userData={sceneContent("appliance-oven")}>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.58, 0.58, 0.54]} />
        <meshStandardMaterial color="#1a1c1e" roughness={0.3} metalness={0.72} />
      </mesh>
      <mesh position={[0, 0.37, 0.28]}>
        <boxGeometry args={[0.48, 0.32, 0.012]} />
        <meshPhysicalMaterial
          color="#111419"
          roughness={0.12}
          metalness={0.25}
          transmission={0.06}
          clearcoat={0.7}
        />
      </mesh>
      <mesh position={[0, 0.61, 0.29]}>
        <boxGeometry args={[0.22, 0.028, 0.018]} />
        <meshStandardMaterial color="#aeb5b8" metalness={0.85} roughness={0.22} />
      </mesh>
    </group>
  );
}

function Hood({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} userData={sceneContent("appliance-hood")}>
      <mesh>
        <boxGeometry args={[0.9, 0.12, 0.34]} />
        <meshStandardMaterial color="#aeb3b5" metalness={0.8} roughness={0.22} />
      </mesh>
      <mesh position={[0, -0.08, 0.08]}>
        <boxGeometry args={[0.72, 0.018, 0.18]} />
        <meshStandardMaterial color="#202326" metalness={0.45} roughness={0.28} />
      </mesh>
    </group>
  );
}

function Sink({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} userData={sceneContent("appliance-sink")}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.24, 32]} />
        <meshStandardMaterial color="#b9c0c3" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.38, 0.08, 0.32]} />
        <meshStandardMaterial color="#808a8d" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Faucet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} userData={sceneContent("decor-faucet")}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.32, 20]} />
        <meshStandardMaterial color="#bac1c4" metalness={0.94} roughness={0.16} />
      </mesh>
      <mesh position={[0.09, 0.31, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.09, 0.025, 12, 28, Math.PI]} />
        <meshStandardMaterial color="#bac1c4" metalness={0.94} roughness={0.16} />
      </mesh>
    </group>
  );
}

function Fridge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} userData={sceneContent("appliance-fridge-inox")}>
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.86, 1.84, 0.72]} />
        <meshPhysicalMaterial color="#7f878b" metalness={0.9} roughness={0.24} clearcoat={0.32} />
      </mesh>
      {[-0.215, 0.215].map((x) => (
        <mesh key={x} position={[x, 0.98, 0.37]}>
          <boxGeometry args={[0.012, 1.52, 0.012]} />
          <meshStandardMaterial color="#25292b" metalness={0.82} roughness={0.18} />
        </mesh>
      ))}
      <mesh position={[-0.19, 1.22, 0.382]}>
        <boxGeometry args={[0.14, 0.22, 0.012]} />
        <meshPhysicalMaterial color="#151719" metalness={0.42} roughness={0.12} clearcoat={0.72} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[0.9, 0.09, 0.76]} />
        <meshStandardMaterial color="#242628" roughness={0.52} metalness={0.35} />
      </mesh>
    </group>
  );
}

function Dishwasher({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} userData={sceneContent("appliance-dishwasher-inox")}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.6, 0.78, 0.56]} />
        <meshPhysicalMaterial color="#9aa1a4" metalness={0.84} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.76, 0.285]}>
        <boxGeometry args={[0.46, 0.035, 0.018]} />
        <meshStandardMaterial color="#242729" metalness={0.7} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.64, 0.29]}>
        <boxGeometry args={[0.24, 0.018, 0.012]} />
        <meshStandardMaterial color="#d9dddf" metalness={0.88} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function KitchenApplianceLayer() {
  const qualityMode = useImmersiveStore((state) => state.qualityMode);
  const depthMm = useRoomBuilderStore((state) => state.depth);
  if (qualityMode === "work") return null;
  const backZ = -(depthMm / 1000) / 2 + 0.24;
  const counterY = 0.91;
  return (
    <group
      name="kitchen-appliance-layer"
      userData={{ renderLayer: "SCENE_CONTENT", contentType: "appliances" }}
    >
      <Cooktop position={[-0.62, counterY, backZ]} />
      <Sink position={[0.65, counterY, backZ]} />
      <Faucet position={[0.65, counterY + 0.02, backZ - 0.08]} />
      <Oven position={[-1.55, 1.18, backZ]} />
      <Dishwasher position={[1.05, 0.01, backZ - 0.02]} />
      <Fridge position={[1.78, 0.02, backZ - 0.02]} />
      <Hood position={[-0.62, 1.96, backZ]} />
    </group>
  );
}
