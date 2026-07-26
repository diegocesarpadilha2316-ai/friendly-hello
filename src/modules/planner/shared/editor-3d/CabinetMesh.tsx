/**
 * Modelos procedurais de marcenaria (armários, gaveteiros, torres, closets).
 *
 * Substitui o "box roxo" genérico por uma caixa de MDF com frentes reais
 * (portas ou gavetas) recuadas, sulcos entre peças e puxadores metálicos.
 * A cor principal vem do material da biblioteca (props do <meshStandardMaterial>
 * repassados via prop `bodyMaterialProps`); quando ausente, cai em freijó neutro.
 */
import { useMemo } from "react";
import * as THREE from "three";

export type CabinetSubtype =
  | "closet" | "roupeiro" | "armario" | "guarda-roupa"
  | "balcao" | "aereo" | "torre" | "gaveteiro"
  | "bancada" | "tampo" | "ilha"
  | "prateleira" | "nicho" | "painel" | "cristaleira";

const CABINET_SUBTYPES = new Set<CabinetSubtype>([
  "closet","roupeiro","armario","guarda-roupa",
  "balcao","aereo","torre","gaveteiro",
  "bancada","tampo","ilha",
  "prateleira","nicho","painel","cristaleira",
]);

export function isCabinetSubtype(s: string | undefined): s is CabinetSubtype {
  return !!s && CABINET_SUBTYPES.has(s as CabinetSubtype);
}

interface CabinetMeshProps {
  subtype: CabinetSubtype;
  width: number;   // mm em X (repassado como three units)
  height: number;  // mm em Y
  depth: number;   // mm em Z
  bodyProps: React.ComponentProps<"meshStandardMaterial">;
  frontProps?: React.ComponentProps<"meshStandardMaterial">;
  selected?: boolean;
  openDoors?: boolean;
  openDrawers?: boolean;
  drawersCount?: number;
  doorsCount?: number;
}

// -----------------------------------------------------------------------------
// Heurísticas de composição
// -----------------------------------------------------------------------------
function inferComposition(p: CabinetMeshProps) {
  const { subtype, width, height, drawersCount, doorsCount } = p;
  // gaveteiros: só gavetas
  if (subtype === "gaveteiro") {
    const n = drawersCount ?? Math.max(2, Math.min(6, Math.round(height / 200)));
    return { drawers: n, doors: 0 };
  }
  if (subtype === "prateleira" || subtype === "nicho" || subtype === "tampo" || subtype === "bancada" || subtype === "painel") {
    return { drawers: 0, doors: 0 };
  }
  // armários: portas verticais, 1 por ~500mm
  const doors = doorsCount ?? Math.max(1, Math.min(6, Math.round(width / 500)));
  return { drawers: 0, doors };
}

export function CabinetMesh(props: CabinetMeshProps) {
  const { width, height, depth, bodyProps, frontProps, selected, openDoors, openDrawers } = props;
  const comp = useMemo(() => inferComposition(props), [props]);

  // Espessura das chapas (18mm) e gap entre frentes (2mm)
  const T = 18;
  const GAP = 2;
  const FRONT_T = 18;
  const INSET = 3; // frentes recuadas 3mm do rosto da caixa

  // Caixa (corpo) — meshes internos: fundo, laterais, tampo, base
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  const bodyColor = (bodyProps as { color?: string }).color ?? "#b78a5c";
  const frontMatProps = frontProps ?? bodyProps;

  return (
    <group>
      {/* Fundo */}
      <mesh position={[0, 0, -halfD + T / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, T]} />
        <meshStandardMaterial {...bodyProps} color={bodyColor} />
      </mesh>
      {/* Lateral esquerda */}
      <mesh position={[-halfW + T / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, height, depth]} />
        <meshStandardMaterial {...bodyProps} color={bodyColor} />
      </mesh>
      {/* Lateral direita */}
      <mesh position={[halfW - T / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, height, depth]} />
        <meshStandardMaterial {...bodyProps} color={bodyColor} />
      </mesh>
      {/* Tampo */}
      <mesh position={[0, halfH - T / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, T, depth]} />
        <meshStandardMaterial {...bodyProps} color={bodyColor} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -halfH + T / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, T, depth]} />
        <meshStandardMaterial {...bodyProps} color={bodyColor} />
      </mesh>

      {/* Prateleiras internas (visíveis quando abre) */}
      {comp.doors > 0 && !openDoors ? null : (
        Array.from({ length: Math.max(0, Math.floor(height / 400) - 1) }).map((_, i) => {
          const y = -halfH + ((i + 1) * height) / Math.max(1, Math.floor(height / 400));
          return (
            <mesh key={`shelf-${i}`} position={[0, y, 0]} castShadow receiveShadow>
              <boxGeometry args={[width - 2 * T, T * 0.9, depth - T]} />
              <meshStandardMaterial {...bodyProps} color={bodyColor} />
            </mesh>
          );
        })
      )}

      {/* Frentes: portas */}
      {comp.doors > 0 && Array.from({ length: comp.doors }).map((_, i) => {
        const doorW = (width - (comp.doors + 1) * GAP) / comp.doors;
        const doorH = height - 2 * GAP;
        const cx = -halfW + GAP + doorW / 2 + i * (doorW + GAP);
        const openAngle = openDoors ? (i % 2 === 0 ? -1.2 : 1.2) : 0;
        const hingeSide = i % 2 === 0 ? -1 : 1;
        return (
          <group
            key={`door-${i}`}
            position={[cx + (hingeSide * doorW) / 2, 0, halfD - INSET]}
            rotation={[0, openAngle, 0]}
          >
            <mesh position={[(-hingeSide * doorW) / 2, 0, FRONT_T / 2]} castShadow receiveShadow>
              <boxGeometry args={[doorW, doorH, FRONT_T]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            {/* Puxador vertical minimalista */}
            <mesh
              position={[(-hingeSide * doorW) + hingeSide * 30, 0, FRONT_T + 8]}
              castShadow
            >
              <boxGeometry args={[12, Math.min(180, doorH * 0.6), 8]} />
              <meshStandardMaterial color="#c9cdd4" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        );
      })}

      {/* Frentes: gavetas */}
      {comp.drawers > 0 && Array.from({ length: comp.drawers }).map((_, i) => {
        const drH = (height - (comp.drawers + 1) * GAP) / comp.drawers;
        const cy = halfH - GAP - drH / 2 - i * (drH + GAP);
        const outset = openDrawers ? 160 : 0;
        return (
          <group key={`dr-${i}`} position={[0, cy, halfD - INSET + FRONT_T / 2 + outset]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[width - 2 * GAP, drH, FRONT_T]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            {/* Puxador horizontal centralizado */}
            <mesh position={[0, 0, FRONT_T / 2 + 8]} castShadow>
              <boxGeometry args={[Math.min(320, (width - 2 * GAP) * 0.5), 12, 8]} />
              <meshStandardMaterial color="#c9cdd4" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        );
      })}

      {/* Contorno de seleção */}
      {selected ? (
        <mesh>
          <boxGeometry args={[width * 1.01, height * 1.01, depth * 1.01]} />
          <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.35} />
        </mesh>
      ) : null}
    </group>
  );
}