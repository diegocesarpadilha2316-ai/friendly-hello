/**
 * Cena 3D do Planner (Fase 3.3). Consome os descritores puros de
 * `extrusion.ts` — a mesma estrutura paramétrica que alimenta o
 * Editor 2D. Nenhum estado global novo: seleção e viewport ficam
 * locais ao Viewport3D. Persistência e Undo/Redo continuam sob o
 * `PlannerEditorProvider` da Fase 3.1.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  FlyControls,
  PointerLockControls,
  Grid,
  Environment,
  Bounds,
} from "@react-three/drei";
import * as THREE from "three";
import type {
  Scene3DModel,
  WallDescriptor,
  SlabDescriptor,
  OpeningDescriptor,
  FurnitureDescriptor,
} from "./extrusion";
import type { Viewport3DState } from "./types";
import {
  getCachedLibraryMaterial,
  requestLibraryMaterial,
  subscribeLibrary,
  type LibraryMaterial,
} from "../../domains/catalog/services/library-supabase";
import { GlassFront } from "./GlassFront";

interface Scene3DProps {
  model: Scene3DModel;
  viewport: Viewport3DState;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const COLORS = {
  wall: "#c9d1e0",
  wallSel: "#8b5cf6",
  floor: "#7c8598",
  ceiling: "#6b7280",
  door: "#f59e0b",
  window: "#06b6d4",
  furniture: "#a78bfa",
  furnitureSel: "#8b5cf6",
};

// -----------------------------------------------------------------------------
// Biblioteca Dioris → materiais 3D (carregamento sob demanda + cache).
// -----------------------------------------------------------------------------

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");
const textureCache = new Map<string, THREE.Texture>();

function loadTexture(url: string): THREE.Texture {
  const cached = textureCache.get(url);
  if (cached) return cached;
  const tex = textureLoader.load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(url, tex);
  return tex;
}

function useLibraryMaterial(id: string | undefined): LibraryMaterial | null {
  const [, force] = useState(0);
  useEffect(() => {
    if (!id) return;
    if (!getCachedLibraryMaterial(id)) requestLibraryMaterial(id);
    const unsub = subscribeLibrary(() => force((n) => n + 1));
    return () => unsub();
  }, [id]);
  return id ? getCachedLibraryMaterial(id) : null;
}

/**
 * Retorna props para `<meshStandardMaterial>` aplicando cor + textura da
 * Biblioteca Dioris quando disponível, respeitando escala real e veio.
 */
function useTexturedMaterialProps(
  materialId: string | undefined,
  meshSizeM: readonly [number, number],
  fallbackColor: string,
  overrides: { roughness?: number; metalness?: number; wireframe?: boolean; transparent?: boolean; opacity?: number } = {},
) {
  const lib = useLibraryMaterial(materialId);
  return useMemo(() => {
    const props: {
      color: string;
      map?: THREE.Texture;
      roughness: number;
      metalness: number;
      wireframe: boolean;
      transparent: boolean;
      opacity: number;
    } = {
      color: lib?.colorHex || fallbackColor,
      roughness: overrides.roughness ?? 0.75,
      metalness: overrides.metalness ?? 0.05,
      wireframe: overrides.wireframe ?? false,
      transparent: overrides.transparent ?? false,
      opacity: overrides.opacity ?? 1,
    };
    if (lib?.textureUrl && !props.wireframe) {
      const base = loadTexture(lib.textureUrl);
      const tex = base.clone();
      tex.needsUpdate = true;
      // Tile em metros a partir da largura/comprimento da chapa (padrão 1m×2m).
      const tileX = (lib.widthMm ?? 1000) / 1000;
      const tileY = (lib.lengthMm ?? 2000) / 1000;
      const [sizeX, sizeY] = meshSizeM;
      let repX = Math.max(0.1, sizeX / Math.max(tileX, 0.05));
      let repY = Math.max(0.1, sizeY / Math.max(tileY, 0.05));
      // Veio horizontal → gira o mapa em 90°.
      if (lib.grain === "horizontal") {
        tex.center.set(0.5, 0.5);
        tex.rotation = Math.PI / 2;
        [repX, repY] = [repY, repX];
      }
      tex.repeat.set(repX, repY);
      props.map = tex;
    }
    return props;
  }, [lib?.id, lib?.colorHex, lib?.textureUrl, lib?.widthMm, lib?.lengthMm, lib?.grain, meshSizeM[0], meshSizeM[1], fallbackColor, overrides.roughness, overrides.metalness, overrides.wireframe, overrides.transparent, overrides.opacity]);
}

function centerOffset(model: Scene3DModel) {
  const cx = (model.bounds.minX + model.bounds.maxX) / 2;
  const cz = (model.bounds.minZ + model.bounds.maxZ) / 2;
  return { cx, cz };
}

function explodeVec(cx: number, cz: number, cy: number, center: THREE.Vector3, factor: number) {
  if (factor <= 0) return new THREE.Vector3(cx, cy, cz);
  const dir = new THREE.Vector3(cx - center.x, cy - center.y, cz - center.z);
  dir.multiplyScalar(factor);
  return new THREE.Vector3(cx + dir.x, cy + dir.y, cz + dir.z);
}

function Wall({
  w,
  center,
  viewport,
  selected,
  onSelect,
}: {
  w: WallDescriptor;
  center: THREE.Vector3;
  viewport: Viewport3DState;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const pos = explodeVec(w.cx, w.cz, w.height / 2, center, viewport.explode);
  const clipped =
    viewport.sectionHeight != null && w.height / 2 > (viewport.sectionHeight / 1000);
  if (clipped) return null;
  const wireframe = viewport.render === "wireframe";
  const opacity = viewport.wallOpacity;
  const props = useTexturedMaterialProps(
    w.materialId,
    [w.length, w.height],
    selected ? COLORS.wallSel : (w.overrideColor ?? COLORS.wall),
    { wireframe, transparent: opacity < 1, opacity, roughness: 0.85, metalness: 0.05 },
  );
  return (
    <mesh
      position={[pos.x, pos.y, pos.z]}
      rotation={[0, w.rotationY, 0]}
      castShadow
      receiveShadow
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(w.id);
      }}
    >
      <boxGeometry args={[w.length, w.height, w.thickness]} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

function Slab({
  s,
  kind,
  center,
  viewport,
  selected,
  onSelect,
}: {
  s: SlabDescriptor;
  kind: "floor" | "ceiling";
  center: THREE.Vector3;
  viewport: Viewport3DState;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const pos = explodeVec(s.cx, s.cz, s.y, center, viewport.explode);
  const fallback = selected
    ? COLORS.wallSel
    : s.overrideColor ?? (kind === "floor" ? COLORS.floor : COLORS.ceiling);
  const props = useTexturedMaterialProps(
    s.materialId,
    [s.width, s.depth],
    fallback,
    { wireframe: viewport.render === "wireframe", roughness: 0.9, metalness: 0.02 },
  );
  return (
    <mesh
      position={[pos.x, pos.y, pos.z]}
      receiveShadow
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(s.id);
      }}
    >
      <boxGeometry args={[s.width, s.thickness, s.depth]} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

function Opening({
  o,
  center,
  viewport,
  selected,
  onSelect,
}: {
  o: OpeningDescriptor;
  center: THREE.Vector3;
  viewport: Viewport3DState;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const pos = explodeVec(o.cx, o.cz, o.y, center, viewport.explode);
  const color = selected
    ? COLORS.wallSel
    : o.overrideColor ?? (o.role === "door" ? COLORS.door : COLORS.window);
  return (
    <mesh
      position={[pos.x, pos.y, pos.z]}
      rotation={[0, o.rotationY, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(o.id);
      }}
    >
      <boxGeometry args={[o.width, o.height, 0.04]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={o.role === "window" ? 0.45 : 0.9}
        roughness={o.role === "window" ? 0.1 : 0.6}
        metalness={o.role === "window" ? 0.2 : 0}
      />
    </mesh>
  );
}

function Furniture({
  f,
  center,
  viewport,
  selected,
  onSelect,
}: {
  f: FurnitureDescriptor;
  center: THREE.Vector3;
  viewport: Viewport3DState;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const pos = explodeVec(f.cx, f.cz, f.y, center, viewport.explode);
  const clipped =
    viewport.sectionHeight != null && f.y - f.height / 2 > viewport.sectionHeight / 1000;
  if (clipped) return null;
  const fallback = selected ? COLORS.furnitureSel : (f.overrideColor ?? COLORS.furniture);
  const props = useTexturedMaterialProps(
    f.materialId,
    [f.width, f.height],
    fallback,
    { wireframe: viewport.render === "wireframe", roughness: 0.6, metalness: 0.05 },
  );
  return (
    <mesh
      position={[pos.x, pos.y, pos.z]}
      rotation={[0, f.rotationY, 0]}
      castShadow
      receiveShadow
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(f.id);
      }}
    >
      <boxGeometry args={[f.width, f.height, f.depth]} />
      <meshStandardMaterial {...props} />
      {(f.frontType === "vidro" || f.frontType === "reeded") ? (
        <GlassFront
          width={f.width}
          height={f.height}
          depth={f.depth}
          variant={f.frontType}
          tint={f.glassTint}
        />
      ) : null}
    </mesh>
  );
}

function BoundingBox({ id, model, center, viewport }: { id: string; model: Scene3DModel; center: THREE.Vector3; viewport: Viewport3DState }) {
  const target = useMemo(() => {
    const w = model.walls.find((x) => x.id === id);
    if (w) return { pos: explodeVec(w.cx, w.cz, w.height / 2, center, viewport.explode), size: [w.length, w.height, w.thickness] as const, rot: w.rotationY };
    const f = [...model.floors, ...model.ceilings].find((x) => x.id === id);
    if (f) {
      const kind = model.ceilings.includes(f as SlabDescriptor) ? "ceiling" : "floor";
      return { pos: explodeVec(f.cx, f.cz, f.y, center, viewport.explode), size: [f.width, f.thickness, f.depth] as const, rot: 0, kind };
    }
    const o = model.openings.find((x) => x.id === id);
    if (o) return { pos: explodeVec(o.cx, o.cz, o.y, center, viewport.explode), size: [o.width, o.height, 0.04] as const, rot: o.rotationY };
    const fu = model.furniture.find((x) => x.id === id);
    if (fu) return { pos: explodeVec(fu.cx, fu.cz, fu.y, center, viewport.explode), size: [fu.width, fu.height, fu.depth] as const, rot: fu.rotationY };
    return null;
  }, [id, model, center, viewport.explode]);
  if (!target) return null;
  return (
    <mesh position={[target.pos.x, target.pos.y, target.pos.z]} rotation={[0, target.rot, 0]}>
      <boxGeometry args={[target.size[0] * 1.02, target.size[1] * 1.02, target.size[2] * 1.02]} />
      <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.9} />
    </mesh>
  );
}

function Cameras({ mode }: { mode: Viewport3DState["camera"] }) {
  if (mode === "first-person") return <PointerLockControls />;
  if (mode === "fly") return <FlyControls movementSpeed={5} rollSpeed={0.5} dragToLook />;
  return <OrbitControls makeDefault enableDamping dampingFactor={0.15} />;
}

/**
 * Move a câmera para presets ortogonais/perspectivos quando `viewport.view`
 * muda. Roda uma única vez por mudança de view — depois disso o usuário
 * segue livre com OrbitControls.
 */
function ApplyViewPreset({
  view,
  center,
  diag,
}: {
  view: Viewport3DState["view"];
  center: THREE.Vector3;
  diag: number;
}) {
  const { camera } = useThree();
  useEffect(() => {
    const d = Math.max(6, diag * 1.2);
    switch (view) {
      case "topo":
        camera.position.set(center.x, d * 1.4, center.z + 0.001);
        break;
      case "frontal":
        camera.position.set(center.x, center.y, center.z + d);
        break;
      case "lateral":
        camera.position.set(center.x + d, center.y, center.z);
        break;
      default:
        camera.position.set(center.x + d * 0.7, d * 0.6, center.z + d * 0.7);
    }
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [view, camera, center.x, center.y, center.z, diag]);
  return null;
}

function AutoResize() {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    // hook reservado para animações futuras
    if (ref.current) ref.current.updateMatrixWorld();
  });
  return null;
}

export function Scene3D({ model, viewport, selectedId, onSelect }: Scene3DProps) {
  const { cx, cz } = centerOffset(model);
  const center = useMemo(() => new THREE.Vector3(cx, viewport.wallHeight / 2000, cz), [cx, cz, viewport.wallHeight]);
  const diag = Math.hypot(model.bounds.maxX - model.bounds.minX, model.bounds.maxZ - model.bounds.minZ) || 8;
  const camDist = Math.max(6, diag * 1.2);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [cx + camDist * 0.7, camDist * 0.6, cz + camDist * 0.7], fov: 45, near: 0.05, far: 500 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#0b0f1a"]} />
      <ambientLight intensity={viewport.showLights ? 0.35 : 0.15} />
      {viewport.showLights ? (
        <>
          <directionalLight
            position={[cx + 8, 12, cz + 8]}
            intensity={1.1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <hemisphereLight args={["#b7c4e0", "#1a1f2e", 0.4]} />
        </>
      ) : null}
      {viewport.render === "material" ? <Environment preset="apartment" /> : null}
      <ApplyViewPreset view={viewport.view} center={center} diag={diag} />
      {viewport.showGrid ? (
        <Grid
          args={[80, 80]}
          position={[cx, 0, cz]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#334155"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#8b5cf6"
          fadeDistance={40}
          fadeStrength={1}
          infiniteGrid
        />
      ) : null}
      {viewport.showAxes ? <axesHelper args={[2]} position={[cx, 0.01, cz]} /> : null}

      <Bounds observe margin={1.3}>
        <group>
          <AutoResize />
          {model.floors.map((s) => (
            <Slab key={s.id} s={s} kind="floor" center={center} viewport={viewport} selected={selectedId === s.id} onSelect={onSelect} />
          ))}
          {model.walls.map((w) => (
            <Wall key={w.id} w={w} center={center} viewport={viewport} selected={selectedId === w.id} onSelect={onSelect} />
          ))}
          {model.openings.map((o) => (
            <Opening key={o.id} o={o} center={center} viewport={viewport} selected={selectedId === o.id} onSelect={onSelect} />
          ))}
          {model.furniture.map((f) => (
            <Furniture key={f.id} f={f} center={center} viewport={viewport} selected={selectedId === f.id} onSelect={onSelect} />
          ))}
          {viewport.sectionHeight == null &&
            model.ceilings.map((s) => (
              <Slab key={s.id} s={s} kind="ceiling" center={center} viewport={viewport} selected={selectedId === s.id} onSelect={onSelect} />
            ))}
          {selectedId ? <BoundingBox id={selectedId} model={model} center={center} viewport={viewport} /> : null}
        </group>
      </Bounds>

      <Cameras mode={viewport.camera} />
    </Canvas>
  );
}

export default Scene3D;