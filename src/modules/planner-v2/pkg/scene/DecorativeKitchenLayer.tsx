import { useImmersiveStore } from "../state/useImmersiveStore";
import { DecorAssetRegistry } from "../../library/registry/AssetRegistry";

function assetUserData(assetId: string) {
  const asset = DecorAssetRegistry.get(assetId);
  return { renderLayer: "SCENE_CONTENT", decorAsset: "DECOR_ASSET", assetId, assetCategory: asset?.category ?? "accessory", implementation: asset?.implementation ?? "procedural", placeholder: asset?.tags.includes("placeholder") ?? false };
}

function Plant({ position }: { position: [number, number, number] }) {
  return <group position={position} userData={assetUserData("decor-plant-olive")}><mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.11, 0.08, 0.22, 16]} /><meshStandardMaterial color="#b8784b" roughness={0.7} /></mesh><mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.16, 12, 8]} /><meshStandardMaterial color="#3e714b" roughness={0.78} /></mesh><mesh position={[0.09, 0.42, 0.02]} scale={[0.6, 0.9, 0.6]}><sphereGeometry args={[0.12, 12, 8]} /><meshStandardMaterial color="#628d58" roughness={0.78} /></mesh></group>;
}

function Bowl({ position }: { position: [number, number, number] }) {
  return <group position={position} userData={assetUserData("decor-fruit-bowl")}><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.14, 0.025, 8, 24]} /><meshStandardMaterial color="#151719" metalness={0.65} roughness={0.3} /></mesh><mesh position={[0, 0.025, 0]}><sphereGeometry args={[0.12, 16, 8]} /><meshStandardMaterial color="#c7863c" roughness={0.42} /></mesh></group>;
}

function CoffeeMaker({ position }: { position: [number, number, number] }) {
  return <group position={position} userData={assetUserData("decor-coffee-maker")}><mesh position={[0, 0.16, 0]}><boxGeometry args={[0.3, 0.32, 0.24]} /><meshStandardMaterial color="#202226" metalness={0.65} roughness={0.22} /></mesh><mesh position={[0, 0.36, 0.03]}><cylinderGeometry args={[0.12, 0.12, 0.07, 20]} /><meshStandardMaterial color="#aeb6bc" metalness={0.82} roughness={0.2} /></mesh><mesh position={[0, 0.12, 0.13]}><boxGeometry args={[0.16, 0.09, 0.012]} /><meshStandardMaterial color="#7b4933" roughness={0.3} /></mesh></group>;
}

function LedStrip({ position, width }: { position: [number, number, number]; width: number }) {
  return <mesh position={position} userData={{ renderLayer: "SCENE_CONTENT", decorAsset: "DECOR_ASSET", assetId: "lighting-led-3000k", assetCategory: "fixture", implementation: "procedural" }}><boxGeometry args={[width, 0.012, 0.018]} /><meshStandardMaterial color="#ffd79b" emissive="#ffb454" emissiveIntensity={2.2} toneMapped={false} /></mesh>;
}

export function DecorativeKitchenLayer() {
  const qualityMode = useImmersiveStore((state) => state.qualityMode);
  if (qualityMode === "work") return null;
  return <group name="kitchen-decoration-layer">
    <Plant position={[-1.55, 0.88, -1.25]} />
    <Bowl position={[0.55, 1.04, 0.16]} />
    <CoffeeMaker position={[1.48, 0.91, -1.22]} />
    <LedStrip position={[-0.1, 1.41, -1.39]} width={2.7} />
    {qualityMode === "presentation" && <>
      <mesh position={[-0.95, 1.05, -1.26]} userData={assetUserData("decor-cutting-board")} rotation={[0, 0.12, 0]}><boxGeometry args={[0.36, 0.035, 0.58]} /><meshStandardMaterial color="#9b6942" roughness={0.56} /></mesh>
      <mesh position={[0.92, 1.06, -1.25]} userData={assetUserData("decor-faucet")}><cylinderGeometry args={[0.025, 0.035, 0.32, 12]} /><meshStandardMaterial color="#bfc4c7" metalness={0.9} roughness={0.18} /></mesh>
    </>}
  </group>;
}
