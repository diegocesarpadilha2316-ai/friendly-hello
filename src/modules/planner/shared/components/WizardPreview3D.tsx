/**
 * Mini preview 3D exibido no wizard "Novo projeto" (etapa Confirmar).
 * Não persiste estado — apenas visualiza um cômodo paramétrico com base
 * no tipo de ambiente e estilo selecionados. Carregado atrás de
 * <ClientOnly> pelo consumidor para não custar SSR.
 */
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { PlannerProjectStyle, PlannerRoomType } from "@/modules/planner/shared";

interface Props {
  roomType: PlannerRoomType | null;
  style: PlannerProjectStyle | null;
}

const ROOM_DIMS: Record<PlannerRoomType, { w: number; d: number; h: number }> = {
  cozinha: { w: 4.2, d: 3.6, h: 2.7 },
  closet: { w: 3.0, d: 2.4, h: 2.5 },
  dormitorio: { w: 3.8, d: 3.4, h: 2.7 },
  banheiro: { w: 2.4, d: 2.0, h: 2.5 },
  escritorio: { w: 3.4, d: 3.0, h: 2.7 },
  sala: { w: 5.0, d: 4.2, h: 2.8 },
  lavanderia: { w: 2.4, d: 1.8, h: 2.5 },
  comercial: { w: 5.4, d: 4.0, h: 3.0 },
};

const STYLE_PALETTE: Record<PlannerProjectStyle, { floor: string; walls: string; accent: string }> = {
  moderno: { floor: "#3f3a36", walls: "#eceef2", accent: "#8b5cf6" },
  minimalista: { floor: "#d9d4cc", walls: "#f7f6f2", accent: "#a3a3a3" },
  escandinavo: { floor: "#d9c3a4", walls: "#f6f2ec", accent: "#93b7d6" },
  industrial: { floor: "#4a4744", walls: "#8f8b86", accent: "#c26b2d" },
  japandi: { floor: "#c9a982", walls: "#efe9df", accent: "#3d3833" },
  contemporaneo: { floor: "#7a6e60", walls: "#ecebe6", accent: "#8b5cf6" },
  classico: { floor: "#6b4a2b", walls: "#f2e9d8", accent: "#b58b4a" },
  luxo: { floor: "#1e1c22", walls: "#efe6d6", accent: "#d4af37" },
  rustico: { floor: "#7a5230", walls: "#d9c9b0", accent: "#5e3b1e" },
  boho: { floor: "#a67447", walls: "#efe0c9", accent: "#c46a4a" },
};

export function WizardPreview3D({ roomType, style }: Props) {
  const dims = ROOM_DIMS[roomType ?? "cozinha"];
  const palette = STYLE_PALETTE[style ?? "moderno"];

  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.floor, roughness: 0.7, metalness: 0.05 }),
    [palette.floor],
  );
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.walls, roughness: 0.85, metalness: 0 }),
    [palette.walls],
  );
  const accentMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.5, metalness: 0.15 }),
    [palette.accent],
  );

  const { w, d, h } = dims;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [w * 1.1, h * 1.1, d * 1.3], fov: 40 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0b1220"]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[w, h * 2, d]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Suspense fallback={null}>
        <Environment preset="apartment" />
      </Suspense>

      {/* Piso */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={floorMat}
      >
        <planeGeometry args={[w, d]} />
      </mesh>
      {/* Parede fundo */}
      <mesh position={[0, h / 2, -d / 2]} material={wallMat} receiveShadow>
        <boxGeometry args={[w, h, 0.05]} />
      </mesh>
      {/* Parede lateral */}
      <mesh position={[-w / 2, h / 2, 0]} material={wallMat} receiveShadow>
        <boxGeometry args={[0.05, h, d]} />
      </mesh>
      {/* Móvel de destaque (bloco paramétrico proporcional ao ambiente) */}
      <mesh
        position={[-w / 2 + 0.35, 0.9, 0]}
        material={accentMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.6, 1.8, Math.min(d * 0.7, 2.2)]} />
      </mesh>
      {/* Bancada baixa */}
      <mesh
        position={[0.2, 0.45, -d / 2 + 0.35]}
        material={accentMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[Math.min(w * 0.55, 2.4), 0.9, 0.6]} />
      </mesh>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={Math.max(w, d) * 1.5} blur={2.4} far={4} />

      <OrbitControls
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={Math.max(w, d) * 0.9}
        maxDistance={Math.max(w, d) * 2.4}
        target={[0, h / 3, 0]}
      />
    </Canvas>
  );
}

export default WizardPreview3D;