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
  ContactShadows,
  SoftShadows,
  Sky,
  Stars,
  TransformControls,
} from "@react-three/drei";
import * as THREE from "three";
import { getPlannerEventBus } from "../events";
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
import { getPbrMaterial, getPbrRoughnessBias, isPbrId } from "../materials/pbr-catalog";
import {
  getProceduralSurface,
  inferSurfaceKind,
  surfaceTileMeters,
  type SurfaceKind,
} from "./procedural-textures";
import { GlassFront } from "./GlassFront";
import { DecorMesh, isDecorSubtype } from "./DecorMesh";
import { CabinetMesh, isCabinetSubtype } from "./CabinetMesh";
import { toast } from "sonner";
import { WardrobeMesh } from "./WardrobeMesh";
import { DresserMesh } from "./DresserMesh";
import { KitchenMesh } from "./KitchenMesh";
import { BathroomMesh } from "./BathroomMesh";
import { logRendererDecision, resolveFurnitureRenderer } from "../families/wardrobe";
import { ApplianceMesh, isApplianceSubtype } from "./ApplianceMesh";
import { CinematicFX } from "./CinematicFX";

interface Scene3DProps {
  model: Scene3DModel;
  viewport: Viewport3DState;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /**
   * Modo do gizmo 3D. `null` desativa. Comita apenas em mouse-up para
   * evitar chuva de updates no reducer.
   */
  gizmoMode?: "translate" | "rotate" | null;
  onCommitTransform?: (
    id: string,
    patch: { xMm: number; yMm: number; rotationDeg: number },
  ) => void;
}

const COLORS = {
  wall: "#c9d1e0",
  wallSel: "#8b5cf6",
  floor: "#7c8598",
  ceiling: "#6b7280",
  door: "#f59e0b",
  window: "#06b6d4",
  furniture: "#b78a5c", // freijó neutro — evita "box roxo"
  furnitureSel: "#8b5cf6",
};

// -----------------------------------------------------------------------------
// Biblioteca Dioris → materiais 3D (carregamento sob demanda + cache).
// -----------------------------------------------------------------------------

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");
const textureCache = new Map<string, THREE.Texture>();

function loadTexture(url: string, srgb = true): THREE.Texture {
  const cached = textureCache.get(url);
  if (cached) return cached;
  const tex = textureLoader.load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
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
  role: "wall" | "floor" | "ceiling" | "furniture" = "furniture",
) {
  const lib = useLibraryMaterial(materialId);
  return useMemo(() => {
    const pbr = isPbrId(materialId) ? getPbrMaterial(materialId!) : null;
    const roughBias = getPbrRoughnessBias(materialId);
    const props: {
      color: string;
      map?: THREE.Texture;
      normalMap?: THREE.Texture;
      normalScale?: THREE.Vector2;
      aoMap?: THREE.Texture;
      roughnessMap?: THREE.Texture;
      metalnessMap?: THREE.Texture;
      roughness: number;
      metalness: number;
      envMapIntensity: number;
      wireframe: boolean;
      transparent: boolean;
      opacity: number;
    } = {
      color: lib?.colorHex || fallbackColor,
      roughness: Math.min(1, Math.max(0, (overrides.roughness ?? 0.75) + roughBias)),
      metalness: overrides.metalness ?? 0.05,
      envMapIntensity: 1,
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

      // Aplica mapas PBR completos (Normal + ARM) quando disponíveis.
      if (pbr) {
        const applyTiling = (t: THREE.Texture) => {
          t.wrapS = THREE.RepeatWrapping;
          t.wrapT = THREE.RepeatWrapping;
          if (lib.grain === "horizontal") {
            t.center.set(0.5, 0.5);
            t.rotation = Math.PI / 2;
          }
          t.repeat.set(repX, repY);
          t.needsUpdate = true;
        };
        const nrm = loadTexture(pbr.maps.normal, false).clone();
        applyTiling(nrm);
        props.normalMap = nrm;
        props.normalScale = new THREE.Vector2(1, 1);

        const arm = loadTexture(pbr.maps.arm, false).clone();
        applyTiling(arm);
        // Three.js lê aoMap=R, roughnessMap=G, metalnessMap=B automaticamente
        // quando bindado à mesma textura ARM combinada.
        props.aoMap = arm;
        props.roughnessMap = arm;
        props.metalnessMap = arm;
      }
    }

    // ---------------------------------------------------------------
    // Realismo: nenhuma superfície fica "cor chapada". Sem textura da
    // biblioteca, aplicamos a superfície procedural correspondente
    // (madeira, laca, reboco, piso ou pedra) com tiling em metros reais.
    // ---------------------------------------------------------------
    if (!props.map && !props.wireframe) {
      const kind: SurfaceKind = inferSurfaceKind(
        role,
        materialId ?? lib?.id,
        props.color,
      );
      const surf = getProceduralSurface(kind);
      if (surf) {
        const tile = surfaceTileMeters(kind);
        const [sizeX, sizeY] = meshSizeM;
        const repX = Math.max(0.25, Math.abs(sizeX) / tile);
        const repY = Math.max(0.25, Math.abs(sizeY) / tile);
        const withTiling = (t: THREE.Texture) => {
          const c = t.clone();
          c.wrapS = THREE.RepeatWrapping;
          c.wrapT = THREE.RepeatWrapping;
          c.repeat.set(repX, repY);
          c.needsUpdate = true;
          return c;
        };
        props.map = withTiling(surf.map);
        props.normalMap = withTiling(surf.normalMap);
        props.normalScale = new THREE.Vector2(surf.normalScale, surf.normalScale);
        props.roughnessMap = withTiling(surf.roughnessMap);
        if (kind === "paint") {
          props.roughness = Math.min(props.roughness, 0.42);
          props.envMapIntensity = 1.25;
        } else if (kind === "stone") {
          props.roughness = Math.min(props.roughness, 0.3);
          props.metalness = Math.max(props.metalness, 0.08);
          props.envMapIntensity = 1.4;
        } else if (kind === "floor") {
          props.roughness = Math.min(props.roughness, 0.55);
          props.envMapIntensity = 1.15;
        } else if (kind === "wall") {
          props.envMapIntensity = 0.85;
        }
      }
    }
    return props;
  }, [materialId, role, lib?.id, lib?.colorHex, lib?.textureUrl, lib?.widthMm, lib?.lengthMm, lib?.grain, meshSizeM[0], meshSizeM[1], fallbackColor, overrides.roughness, overrides.metalness, overrides.wireframe, overrides.transparent, overrides.opacity]);
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
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
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
    { wireframe, transparent: true, opacity, roughness: 0.85, metalness: 0.05 },
    "wall",
  );
  // Auto-fade: se a parede está ENTRE a câmera e o centro do ambiente,
  // deixamos ela quase invisível para o usuário sempre enxergar os móveis
  // (regra "câmera nunca escondida por parede"). O usuário não precisa
  // apertar nenhum botão — o Planner cuida disso a cada frame.
  useFrame(({ camera }) => {
    if (!matRef.current) return;
    const base = opacity;
    let target = base;
    if (viewport.autoFadeNearWalls && !selected) {
      const wallPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      const camToCenter = new THREE.Vector3().subVectors(center, camera.position);
      const camToWall = new THREE.Vector3().subVectors(wallPos, camera.position);
      const distCenter = camToCenter.length();
      const distWall = camToWall.length();
      // Alinhado com o vetor câmera→centro e mais perto que o centro?
      // Então essa parede está bloqueando a visão — apagamos.
      camToCenter.normalize();
      camToWall.normalize();
      const aligned = camToWall.dot(camToCenter);
      if (aligned > 0.35 && distWall < distCenter * 1.05) {
        target = Math.min(base, 0.08);
      }
    }
    const current = matRef.current.opacity;
    matRef.current.opacity = current + (target - current) * 0.25;
    matRef.current.transparent = matRef.current.opacity < 0.999;
    matRef.current.depthWrite = matRef.current.opacity > 0.6;
  });
  return (
    <group position={[pos.x, pos.y, pos.z]} rotation={[0, w.rotationY, 0]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(w.id);
        }}
      >
        <boxGeometry args={[w.length, w.height, w.thickness]} />
        <meshStandardMaterial ref={matRef} {...props} />
      </mesh>
      {/* Rodapé real (100 mm, saliente 12 mm) — só em modo material e com
          a parede visível. Detalhe barato que ancora o ambiente e elimina
          a junta "flutuante" entre parede e piso. */}
      {viewport.render === "material" && opacity > 0.5 ? (
        [-1, 1].map((side) => (
          <mesh
            key={`skirt-${side}`}
            position={[0, -w.height / 2 + 0.05, side * (w.thickness / 2 + 0.006)]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[w.length, 0.1, 0.012]} />
            <meshStandardMaterial color="#f2f3f5" roughness={0.45} metalness={0.02} envMapIntensity={1.1} />
          </mesh>
        ))
      ) : null}
    </group>
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
    kind,
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
  // Aterramento garantido no render: independente do que o extrusor
  // enviou, base do móvel nunca fica abaixo de y=0 (topo do piso).
  // Para módulos suspensos (base > 0) mantemos a altura original.
  const rawBottom = pos.y - f.height / 2;
  const safeBottom = rawBottom < 0 ? 0 : rawBottom;
  const safeCenterY = safeBottom + f.height / 2;
  const clipped =
    viewport.sectionHeight != null && safeBottom > viewport.sectionHeight / 1000;
  if (clipped) return null;
  const fallback = selected ? COLORS.furnitureSel : (f.overrideColor ?? COLORS.furniture);
  const props = useTexturedMaterialProps(
    f.materialId,
    [f.width, f.height],
    fallback,
    { wireframe: viewport.render === "wireframe", roughness: 0.6, metalness: 0.05 },
    "furniture",
  );
  // Decoração procedural: sofá, cama, planta, luminária, etc. — renderiza
  // silhueta reconhecível em vez do box padrão. Wireframe volta ao box.
  const decor = viewport.render !== "wireframe" && isDecorSubtype(f.subtype);
  if (decor) {
    return (
      <group
        position={[pos.x, safeBottom, pos.z]}
        rotation={[0, f.rotationY, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(f.id);
        }}
      >
        <DecorMesh
          subtype={f.subtype as never}
          width={f.width}
          height={f.height}
          depth={f.depth}
          color={selected ? COLORS.furnitureSel : f.overrideColor}
          selected={selected}
        />
      </group>
    );
  }
  const appliance = viewport.render !== "wireframe" && isApplianceSubtype(f.subtype);
  if (appliance) {
    return (
      <group
        position={[pos.x, safeBottom, pos.z]}
        rotation={[0, f.rotationY, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(f.id);
        }}
      >
        <ApplianceMesh
          subtype={f.subtype as never}
          width={f.width}
          height={f.height}
          depth={f.depth}
          color={f.overrideColor}
          selected={selected}
        />
      </group>
    );
  }
  // ── FAMÍLIA ROUPEIRO ──
  // Roupeiros deixam de usar geometria procedural e passam a ser montados
  // pela Biblioteca Construtiva Paramétrica. Demais móveis seguem no
  // caminho antigo até serem convertidos, um a um.
  const decision = resolveFurnitureRenderer({
    id: f.id,
    subtype: f.subtype,
    catalogItemId: f.catalogItemId,
    params: f.params,
  });
  logRendererDecision(f.id, decision);
  const wardrobe = viewport.render !== "wireframe" && decision.renderer === "wardrobe";
  if (wardrobe) {
    return (
      <group
        position={[pos.x, safeCenterY, pos.z]}
        rotation={[0, f.rotationY, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(f.id);
        }}
      >
        <WardrobeMesh
          nodeId={f.id}
          width={f.width}
          height={f.height}
          depth={f.depth}
          params={f.params}
          bodyProps={props}
          selected={selected}
          openDoors={viewport.openDoors ?? f.openDoors}
          openDrawers={viewport.openDrawers ?? f.openDrawers}
          onInterlock={(blocked) => {
            // Aviso discreto: a gaveta ficou fechada porque a porta está fechada.
            toast(blocked[0].message, { id: `interlock-${f.id}`, duration: 2600 });
          }}
          doorsCount={f.doorsCount}
          drawersCount={f.drawersCount}
          shelvesCount={f.shelvesCount}
          style={f.style}
          handleStyle={f.handleStyle}
        />
      </group>
    );
  }
  const cabinet = viewport.render !== "wireframe" && isCabinetSubtype(f.subtype);
  const dresser = viewport.render !== "wireframe" && decision.renderer === "dresser";
  const kitchen = viewport.render !== "wireframe" && decision.renderer === "kitchen";
  const bathroom = viewport.render !== "wireframe" && decision.renderer === "bathroom";
  if (bathroom) {
    return (
      <group
        position={[pos.x, safeCenterY, pos.z]}
        rotation={[0, f.rotationY, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(f.id);
        }}
      >
        <BathroomMesh
          nodeId={f.id}
          width={f.width}
          height={f.height}
          depth={f.depth}
          subtype={f.subtype}
          catalogItemId={f.catalogItemId}
          params={f.params}
          bodyProps={props}
          selected={selected}
          openDoors={viewport.openDoors ?? f.openDoors}
          openDrawers={viewport.openDrawers ?? f.openDrawers}
          onInterlock={(blocked) => {
            toast(blocked[0].message, { id: `interlock-${f.id}`, duration: 2600 });
          }}
          doorsCount={f.doorsCount}
          drawersCount={f.drawersCount}
          shelvesCount={f.shelvesCount}
          style={f.style}
          handleStyle={f.handleStyle}
        />
      </group>
    );
  }
  if (kitchen) {
    return (
      <group
        position={[pos.x, safeCenterY, pos.z]}
        rotation={[0, f.rotationY, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(f.id);
        }}
      >
        <KitchenMesh
          width={f.width}
          height={f.height}
          depth={f.depth}
          subtype={f.subtype}
          params={f.params}
          bodyProps={props}
          selected={selected}
          openDoors={viewport.openDoors ?? f.openDoors}
          openDrawers={viewport.openDrawers ?? f.openDrawers}
          onInterlock={(blocked) => {
            toast(blocked[0].message, { id: `interlock-${f.id}`, duration: 2600 });
          }}
          doorsCount={f.doorsCount}
          drawersCount={f.drawersCount}
          shelvesCount={f.shelvesCount}
          style={f.style}
          handleStyle={f.handleStyle}
        />
      </group>
    );
  }
  if (dresser) {
    return (
      <group
        position={[pos.x, safeCenterY, pos.z]}
        rotation={[0, f.rotationY, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(f.id);
        }}
      >
        <DresserMesh
          width={f.width}
          height={f.height}
          depth={f.depth}
          params={f.params}
          bodyProps={props}
          selected={selected}
          openDrawers={viewport.openDrawers ?? f.openDrawers}
          onInterlock={(blocked) => {
            toast(blocked[0].message, { id: `interlock-${f.id}`, duration: 2600 });
          }}
          drawersCount={f.drawersCount}
          style={f.style}
          handleStyle={f.handleStyle}
        />
      </group>
    );
  }
  if (cabinet) {
    return (
      <group
        position={[pos.x, safeCenterY, pos.z]}
        rotation={[0, f.rotationY, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(f.id);
        }}
      >
        <CabinetMesh
          subtype={f.subtype as never}
          width={f.width}
          height={f.height}
          depth={f.depth}
          bodyProps={props}
          selected={selected}
          openDoors={viewport.openDoors ?? f.openDoors}
          openDrawers={viewport.openDrawers ?? f.openDrawers}
          doorsCount={f.doorsCount}
          drawersCount={f.drawersCount}
          shelvesCount={f.shelvesCount}
          led={f.led}
          hasSink={f.hasSink}
          style={f.style}
          handleStyle={f.handleStyle}
          hardwareFinish={f.hardwareFinish}
          frontStyle={f.frontStyle}
        />
        {(f.frontType === "vidro" || f.frontType === "reeded") ? (
          <GlassFront
            width={f.width}
            height={f.height}
            depth={f.depth}
            variant={f.frontType}
            tint={f.glassTint}
          />
        ) : null}
      </group>
    );
  }
  return (
    <mesh
      position={[pos.x, safeCenterY, pos.z]}
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

/**
 * Gizmo interativo (translate/rotate) para o móvel selecionado. Usa um
 * `Group` proxy sincronizado com o descritor de extrusão e comita no
 * mouse-up — evita floods no reducer durante o arrasto. A altura Y é
 * travada: a base fica sempre no piso (aterramento garantido).
 */
function FurnitureGizmo({
  fu,
  center,
  viewport,
  mode,
  onCommit,
}: {
  fu: FurnitureDescriptor;
  center: THREE.Vector3;
  viewport: Viewport3DState;
  mode: "translate" | "rotate";
  onCommit: (id: string, patch: { xMm: number; yMm: number; rotationDeg: number }) => void;
}) {
  const proxyRef = useRef<THREE.Group>(null);
  const [attached, setAttached] = useState<THREE.Group | null>(null);
  const worldPos = explodeVec(fu.cx, fu.cz, fu.y, center, viewport.explode);

  // Sincroniza a proxy com o descritor sempre que a seleção ou a
  // posição extraída muda (após um commit, por exemplo).
  useEffect(() => {
    const g = proxyRef.current;
    if (!g) return;
    g.position.set(worldPos.x, worldPos.y, worldPos.z);
    g.rotation.set(0, fu.rotationY, 0);
    setAttached(g);
  }, [fu.id, worldPos.x, worldPos.y, worldPos.z, fu.rotationY]);

  const commit = () => {
    const g = proxyRef.current;
    if (!g) return;
    // world → params mm (top-left). rotation stored = -worldRotY em graus.
    const cxMm = g.position.x * 1000;
    const czMm = g.position.z * 1000;
    const xMm = Math.round(cxMm - (fu.width * 1000) / 2);
    const yMm = Math.round(czMm - (fu.depth * 1000) / 2);
    let rotationDeg = Math.round((-g.rotation.y * 180) / Math.PI);
    rotationDeg = Math.round(rotationDeg / 15) * 15; // snap 15°
    onCommit(fu.id, { xMm, yMm, rotationDeg });
  };

  return (
    <>
      <group ref={proxyRef} />
      {attached ? (
        mode === "translate" ? (
          <TransformControls
            object={attached}
            mode="translate"
            size={0.75}
            space="world"
            translationSnap={0.05}
            showY={false}
            onMouseUp={commit}
          />
        ) : (
          <TransformControls
            object={attached}
            mode="rotate"
            size={0.75}
            space="world"
            rotationSnap={THREE.MathUtils.degToRad(15)}
            showX={false}
            showZ={false}
            onMouseUp={commit}
          />
        )
      ) : null}
    </>
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
 * Enquadramento suave da peça selecionada.
 *
 * Dispara quando o usuário aperta "F" (frame) com um item selecionado.
 * Interpola posição da câmera e o alvo do OrbitControls até um ângulo
 * confortável em torno do bounding box da peça — sem quebrar a
 * navegação manual (o usuário continua orbitando normalmente depois).
 */
function FocusOnSelection({
  model,
  selectedId,
  center,
  viewport,
}: {
  model: Scene3DModel;
  selectedId: string | null;
  center: THREE.Vector3;
  viewport: Viewport3DState;
}) {
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: (THREE.EventDispatcher & { target: THREE.Vector3; update?: () => void }) | null;
  };
  const [tick, setTick] = useState(0);
  const anim = useRef<{
    active: boolean;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTgt: THREE.Vector3;
    toTgt: THREE.Vector3;
    t: number;
  }>({
    active: false,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTgt: new THREE.Vector3(),
    toTgt: new THREE.Vector3(),
    t: 0,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignora atalhos dentro de inputs (Inspector, chat, etc.)
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "f" || e.key === "F") setTick((n) => n + 1);
    };
    window.addEventListener("keydown", onKey);
    // Assina o bus tipado. O bridgeToWindow ainda reemite para `window`,
    // então listeners legados continuam funcionando; aqui usamos o bus
    // diretamente para pegar também emissões que não passem pela ponte.
    const bus = getPlannerEventBus();
    const offFocus = bus.on("ui:focus-selection", () => setTick((n) => n + 1));
    return () => {
      window.removeEventListener("keydown", onKey);
      offFocus();
    };
  }, []);

  useEffect(() => {
    if (!selectedId || tick === 0) return;
    // Localiza a peça no modelo para calcular centro + raio de enquadramento.
    const fu = model.furniture.find((x) => x.id === selectedId);
    const wl = model.walls.find((x) => x.id === selectedId);
    const op = model.openings.find((x) => x.id === selectedId);
    let cx = 0, cy = 0, cz = 0, radius = 1;
    if (fu) {
      cx = fu.cx - center.x; cy = fu.y; cz = fu.cz - center.z;
      radius = Math.hypot(fu.width, fu.height, fu.depth) * 0.6;
    } else if (wl) {
      cx = wl.cx - center.x; cy = wl.height / 2; cz = wl.cz - center.z;
      radius = Math.hypot(wl.length, wl.height) * 0.6;
    } else if (op) {
      cx = op.cx - center.x; cy = op.y; cz = op.cz - center.z;
      radius = Math.hypot(op.width, op.height) * 0.7;
    } else return;
    const dist = Math.max(1.4, radius * 2.2);
    // Aproxima na diagonal frontal-superior do item mantendo a orientação
    // atual da câmera (mesmo azimute) — o usuário reconhece "para onde foi".
    const dir = new THREE.Vector3().subVectors(camera.position, controls?.target ?? center).setY(0);
    if (dir.lengthSq() < 1e-6) dir.set(1, 0, 1);
    dir.normalize();
    const target = new THREE.Vector3(cx, cy, cz);
    const desired = target.clone().add(dir.multiplyScalar(dist)).setY(cy + dist * 0.55);
    anim.current = {
      active: true,
      fromPos: camera.position.clone(),
      toPos: desired,
      fromTgt: (controls?.target ?? center).clone(),
      toTgt: target,
      t: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, selectedId]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a.active) return;
    a.t = Math.min(1, a.t + dt / 0.65); // ~650ms
    const e = 1 - Math.pow(1 - a.t, 3); // easeOutCubic
    camera.position.lerpVectors(a.fromPos, a.toPos, e);
    if (controls?.target) {
      controls.target.lerpVectors(a.fromTgt, a.toTgt, e);
      controls.update?.();
    } else {
      camera.lookAt(a.toTgt);
    }
    if (a.t >= 1) a.active = false;
  });

  // Não renderiza — apenas gerencia foco. Silencia lint de dep desnecessária.
  void viewport;
  return null;
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
  // Guardar valores em refs para NÃO re-disparar o preset quando o modelo
  // muda (AI adicionando móveis). A câmera só deve reposicionar quando o
  // usuário troca de `view` explicitamente.
  const centerRef = useRef(center);
  const diagRef = useRef(diag);
  centerRef.current = center;
  diagRef.current = diag;
  useEffect(() => {
    const c = centerRef.current;
    const d = Math.max(6, diagRef.current * 1.2);
    switch (view) {
      case "topo":
        camera.position.set(c.x, d * 1.4, c.z + 0.001);
        break;
      case "frontal":
        camera.position.set(c.x, c.y, c.z + d);
        break;
      case "lateral":
        camera.position.set(c.x + d, c.y, c.z);
        break;
      default:
        camera.position.set(c.x + d * 0.7, d * 0.6, c.z + d * 0.7);
    }
    camera.lookAt(centerRef.current);
    camera.updateProjectionMatrix();
  }, [view, camera]);
  return null;
}

/**
 * Reenquadramento automático "de apresentação".
 *
 * Sempre que o `autoFitVersion` do viewport muda (por exemplo, quando a
 * IA acaba de gerar um ambiente completo), a câmera pula para uma posição
 * fora da sala, olhando o centro em um ângulo de ~35° — nunca dentro de
 * parede, nunca dentro de teto. É o "primeiro enquadramento" prometido
 * pelo Dioris Planner: o usuário digita "quero uma cozinha" e vê o
 * projeto inteiro imediatamente.
 */
/** Ponte de depuração (apenas DEV): expõe a cena para validação no viewport. */
function SceneDebugBridge() {
  const { scene } = useThree();
  useEffect(() => {
    if (!import.meta.env?.DEV) return;
    (window as unknown as { __diorisScene?: THREE.Scene }).__diorisScene = scene;
  }, [scene]);
  return null;
}

function AutoFitCamera({
  version,
  center,
  diag,
  wallHeight,
}: {
  version: number;
  center: THREE.Vector3;
  diag: number;
  wallHeight: number;
}) {
  const { camera } = useThree();
  const centerRef = useRef(center);
  const diagRef = useRef(diag);
  const wallRef = useRef(wallHeight);
  centerRef.current = center;
  diagRef.current = diag;
  wallRef.current = wallHeight;
  useEffect(() => {
    const c = centerRef.current;
    const d = Math.max(6, diagRef.current * 1.35);
    // Câmera na diagonal SE, ~1.65m do chão (linha do olho humano),
    // afastada o suficiente para o ambiente inteiro caber no frame.
    const eyeY = Math.max(1.4, (wallRef.current / 1000) * 0.55);
    camera.position.set(c.x + d * 0.75, eyeY + d * 0.35, c.z + d * 0.75);
    camera.lookAt(c.x, eyeY * 0.6, c.z);
    camera.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, camera]);
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

export function Scene3D({ model, viewport, selectedId, onSelect, gizmoMode, onCommitTransform }: Scene3DProps) {
  const { cx, cz } = centerOffset(model);
  // Alvo da câmera: 1/3 da altura da parede (~olho baixo). Isso ancora o
  // piso (y=0) no terço inferior da tela e reforça a percepção de escala.
  // NUNCA usar o centro do bounding box (meio do volume) — o ambiente
  // pareceria flutuando.
  const center = useMemo(
    () => new THREE.Vector3(cx, Math.max(0.6, viewport.wallHeight / 3000), cz),
    [cx, cz, viewport.wallHeight],
  );
  const diag = Math.hypot(model.bounds.maxX - model.bounds.minX, model.bounds.maxZ - model.bounds.minZ) || 8;
  const camDist = Math.max(6, diag * 1.2);
  // Altura da câmera: um pouco acima da linha do olho (1.6 m) sem
  // exagerar — piso sempre visível na base do frame.
  const camHeight = Math.max(1.6, camDist * 0.5);
  const daytime = viewport.daytime ?? "noon";
  // Presets de horário — sol (posição/cor/intensidade), fill e ambiente.
  const dayPreset = useMemo(() => {
    const d = Math.max(20, diag * 2);
    switch (daytime) {
      case "morning":
        return {
          sun: [d * 0.9, d * 0.35, d * 0.15] as [number, number, number],
          sunColor: "#ffd9a8", sunIntensity: 2.0,
          fillColor: "#a8c5ff", fillIntensity: 0.4,
          hemi: ["#ffe1b8", "#1a1f2e", 0.35] as [string, string, number],
          skyDist: 450000, turbidity: 8, rayleigh: 3.2, mieCoefficient: 0.006, mieDirectionalG: 0.85,
          bgFallback: "#7ea8d8",
          envPreset: "sunset" as const,
          envIntensity: 1.1,
          showSky: true, showStars: false,
        };
      case "golden":
        return {
          sun: [-d * 0.9, d * 0.28, d * 0.35] as [number, number, number],
          sunColor: "#ffb066", sunIntensity: 2.6,
          fillColor: "#7c8fb5", fillIntensity: 0.35,
          hemi: ["#ffd0a0", "#1a1420", 0.3] as [string, string, number],
          skyDist: 450000, turbidity: 12, rayleigh: 5, mieCoefficient: 0.01, mieDirectionalG: 0.92,
          bgFallback: "#d69564",
          envPreset: "sunset" as const,
          envIntensity: 1.3,
          showSky: true, showStars: false,
        };
      case "night":
        return {
          sun: [d * 0.4, d * 0.05, -d] as [number, number, number],
          sunColor: "#a8c0ff", sunIntensity: 0.25,
          fillColor: "#5b6e9b", fillIntensity: 0.15,
          hemi: ["#3a4a70", "#0a0d18", 0.2] as [string, string, number],
          skyDist: 450000, turbidity: 2, rayleigh: 0.2, mieCoefficient: 0.001, mieDirectionalG: 0.5,
          bgFallback: "#050813",
          envPreset: "night" as const,
          envIntensity: 0.5,
          showSky: false, showStars: true,
        };
      default: // noon
        return {
          sun: [d * 0.3, d, d * 0.4] as [number, number, number],
          sunColor: "#fff4e0", sunIntensity: 2.4,
          fillColor: "#a8c5ff", fillIntensity: 0.35,
          hemi: ["#dbe6ff", "#141822", 0.3] as [string, string, number],
          skyDist: 450000, turbidity: 6, rayleigh: 1.5, mieCoefficient: 0.005, mieDirectionalG: 0.8,
          bgFallback: "#87b4e6",
          envPreset: "city" as const,
          envIntensity: 1.0,
          showSky: true, showStars: false,
        };
    }
  }, [daytime, diag]);
  const useSky = viewport.render === "material" && dayPreset.showSky;

  return (
    <Canvas
      shadows
      dpr={[1, viewport.cinematic ? 2 : 1.5]}
      camera={{ position: [cx + camDist * 0.7, camHeight, cz + camDist * 0.7], fov: 38, near: 0.05, far: 500 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        // Sombras suaves com filtragem PCF de alta qualidade
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      onPointerMissed={() => onSelect(null)}
    >
      <SceneDebugBridge />
      {viewport.render === "material" ? (
        <color attach="background" args={[dayPreset.bgFallback]} />
      ) : (
        <color attach="background" args={["#0b0f1a"]} />
      )}
      {useSky ? (
        <Sky
          distance={dayPreset.skyDist}
          sunPosition={dayPreset.sun}
          turbidity={dayPreset.turbidity}
          rayleigh={dayPreset.rayleigh}
          mieCoefficient={dayPreset.mieCoefficient}
          mieDirectionalG={dayPreset.mieDirectionalG}
        />
      ) : null}
      {viewport.render === "material" && dayPreset.showStars ? (
        <Stars radius={200} depth={80} count={4000} factor={4} fade speed={0.5} />
      ) : null}
      {/* PCSS: penumbra realista, custo baixo — só quando materiais estão ativos */}
      {viewport.render === "material" && viewport.showLights ? (
        <SoftShadows size={18} samples={12} focus={0.9} />
      ) : null}
      <ambientLight intensity={viewport.showLights ? (daytime === "night" ? 0.08 : 0.18) : 0.12} />
      {viewport.showLights ? (
        <>
          <directionalLight
            position={[cx + dayPreset.sun[0] * 0.05, dayPreset.sun[1] * 0.05 + 4, cz + dayPreset.sun[2] * 0.05]}
            intensity={dayPreset.sunIntensity}
            color={dayPreset.sunColor}
            castShadow
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-bias={-0.00015}
            shadow-normalBias={0.04}
            shadow-camera-far={60}
            shadow-camera-left={-diag}
            shadow-camera-right={diag}
            shadow-camera-top={diag}
            shadow-camera-bottom={-diag}
          />
          {/* Rim/fill frio para volumetria */}
          <directionalLight
            position={[cx - 6, 6, cz - 8]}
            intensity={dayPreset.fillIntensity}
            color={dayPreset.fillColor}
          />
          <hemisphereLight args={dayPreset.hemi} />
        </>
      ) : null}
      {/* HDRI IBL sempre ativo em modo material — sem alterar cor de fundo */}
      {viewport.render === "material" ? (
        <Environment preset={dayPreset.envPreset} background={false} environmentIntensity={dayPreset.envIntensity} />
      ) : null}
      {/* Iluminação interna real: spots de teto em grade + bounce quente do
          piso. É o que separa "maquete cinza" de "ambiente fotografado" —
          sem eles o interior fica apenas com a luz do sol externa. */}
      {viewport.render === "material" && viewport.showLights ? (
        <group>
          {[-1, 1].map((sx) =>
            [-1, 1].map((sz) => (
              <pointLight
                key={`spot-${sx}-${sz}`}
                position={[
                  cx + sx * Math.max(0.8, diag * 0.22),
                  Math.max(1.8, viewport.wallHeight / 1000 - 0.15),
                  cz + sz * Math.max(0.8, diag * 0.22),
                ]}
                intensity={daytime === "night" ? 9 : 4.5}
                distance={Math.max(6, diag * 1.6)}
                decay={2}
                color={daytime === "night" ? "#ffd9a8" : "#fff3e2"}
              />
            )),
          )}
          {/* Bounce do piso — clareia a barriga dos móveis, sem sombra. */}
          <pointLight
            position={[cx, 0.35, cz]}
            intensity={daytime === "night" ? 1.2 : 2.2}
            distance={Math.max(5, diag * 1.2)}
            decay={2}
            color="#f6ece0"
          />
        </group>
      ) : null}
      <ApplyViewPreset view={viewport.view} center={center} diag={diag} />
      {/* Contact shadow suave no chão — enraíza os móveis mesmo em modo wireframe */}
      {viewport.showLights ? (
        <ContactShadows
          position={[cx, 0.002, cz]}
          scale={Math.max(diag * 2, 20)}
          resolution={2048}
          blur={1.8}
          far={4}
          opacity={0.72}
          color="#000000"
        />
      ) : null}
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
            !(viewport.autoHideCeiling !== false && !viewport.cinematic) &&
            model.ceilings.map((s) => (
              <Slab key={s.id} s={s} kind="ceiling" center={center} viewport={viewport} selected={selectedId === s.id} onSelect={onSelect} />
            ))}
          {selectedId ? <BoundingBox id={selectedId} model={model} center={center} viewport={viewport} /> : null}
          {(() => {
            // Gizmo só aparece para MÓVEIS selecionados, em modo válido e
            // com "explode" zerado (a inversão do explode não é feita).
            if (!gizmoMode || !onCommitTransform || !selectedId) return null;
            if ((viewport.explode ?? 0) > 0) return null;
            const fu = model.furniture.find((x) => x.id === selectedId);
            if (!fu) return null;
            return (
              <FurnitureGizmo
                fu={fu}
                center={center}
                viewport={viewport}
                mode={gizmoMode}
                onCommit={onCommitTransform}
              />
            );
          })()}
      </group>

      <Cameras mode={viewport.camera} />
      <AutoFitCamera
        version={viewport.autoFitVersion ?? 0}
        center={center}
        diag={diag}
        wallHeight={viewport.wallHeight}
      />
      <FocusOnSelection model={model} selectedId={selectedId} center={center} viewport={viewport} />
      {viewport.cinematic && viewport.render === "material" ? <CinematicFX /> : null}
    </Canvas>
  );
}

export default Scene3D;