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
    const n = drawersCount ?? Math.max(2, Math.min(6, Math.round(height / 0.2)));
    return { drawers: n, doors: 0 };
  }
  if (subtype === "closet") {
    const bays = Math.max(2, Math.min(5, Math.round(width / 0.72)));
    return { drawers: 0, doors: 0, bays };
  }
  if (subtype === "prateleira" || subtype === "nicho" || subtype === "tampo" || subtype === "bancada" || subtype === "painel") {
    return { drawers: 0, doors: 0 };
  }
  // armários: portas verticais, 1 por ~500mm
  const doors = doorsCount ?? Math.max(1, Math.min(6, Math.round(width / 0.5)));
  return { drawers: 0, doors };
}

export function CabinetMesh(props: CabinetMeshProps) {
  const { width, height, depth, bodyProps, frontProps, selected, openDoors, openDrawers } = props;
  const comp = useMemo(() => inferComposition(props), [props]);

  // A cena 3D trabalha em metros; todos os valores abaixo são medidas reais de marcenaria.
  const T = 0.018; // chapa 18mm
  const GAP = 0.003;
  const FRONT_T = 0.018;
  const INSET = 0.006;
  const TOE_KICK_H = props.subtype === "closet" || props.subtype === "roupeiro" ? 0.08 : 0.1;

  // Caixa (corpo) — meshes internos: fundo, laterais, tampo, base
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  const bodyColor = (bodyProps as { color?: string }).color ?? "#b78a5c";
  const frontMatProps = frontProps ?? bodyProps;

  return (
    <group>
      {/* Rodapé/sapata técnica */}
      {height > 0.5 ? (
        <mesh position={[0, -halfH + TOE_KICK_H / 2, halfD - depth * 0.08]} castShadow receiveShadow>
          <boxGeometry args={[Math.max(0.05, width - T * 2), TOE_KICK_H, Math.max(0.04, depth * 0.12)]} />
          <meshStandardMaterial {...bodyProps} color={bodyColor} roughness={0.8} />
        </mesh>
      ) : null}

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

      {/* Closet aberto: módulos verticais, prateleiras, cabideiro e gavetas baixas. */}
      {props.subtype === "closet" ? (
        <>
          {Array.from({ length: Math.max(1, comp.bays ?? 2) - 1 }).map((_, i) => {
            const bayW = (width - T * 2) / Math.max(1, comp.bays ?? 2);
            const x = -halfW + T + bayW * (i + 1);
            return (
              <mesh key={`divider-${i}`} position={[x, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[T, Math.max(0.05, height - TOE_KICK_H), Math.max(0.05, depth - T)]} />
                <meshStandardMaterial {...bodyProps} color={bodyColor} />
              </mesh>
            );
          })}
          {Array.from({ length: Math.max(1, comp.bays ?? 2) }).map((_, i) => {
            const bays = Math.max(1, comp.bays ?? 2);
            const bayW = (width - T * 2) / bays;
            const x = -halfW + T + bayW * i + bayW / 2;
            const topShelfY = halfH - 0.42;
            const midShelfY = halfH - 0.92;
            const drawerStackY = -halfH + TOE_KICK_H + 0.27;
            const hasDrawers = i % 2 === 1;
            return (
              <group key={`bay-${i}`}>
                <mesh position={[x, topShelfY, 0]} castShadow receiveShadow>
                  <boxGeometry args={[Math.max(0.05, bayW - GAP), T, Math.max(0.05, depth - T * 1.4)]} />
                  <meshStandardMaterial {...bodyProps} color={bodyColor} />
                </mesh>
                <mesh position={[x, midShelfY, 0]} castShadow receiveShadow>
                  <boxGeometry args={[Math.max(0.05, bayW - GAP), T, Math.max(0.05, depth - T * 1.4)]} />
                  <meshStandardMaterial {...bodyProps} color={bodyColor} />
                </mesh>
                <mesh position={[x, halfH - 0.62, halfD - 0.12]} castShadow>
                  <cylinderGeometry args={[0.012, 0.012, Math.max(0.08, bayW - 0.08), 16]} />
                  <meshStandardMaterial color="#c9cdd4" metalness={0.85} roughness={0.2} />
                </mesh>
                {hasDrawers ? Array.from({ length: 3 }).map((_, d) => (
                  <group key={`closet-dr-${i}-${d}`} position={[x, drawerStackY + d * 0.18, halfD - INSET]}>
                    <mesh castShadow receiveShadow>
                      <boxGeometry args={[Math.max(0.05, bayW - 0.045), 0.16, FRONT_T]} />
                      <meshStandardMaterial {...frontMatProps} />
                    </mesh>
                    <mesh position={[0, 0, FRONT_T / 2 + 0.008]} castShadow>
                      <boxGeometry args={[Math.min(0.26, bayW * 0.55), 0.01, 0.008]} />
                      <meshStandardMaterial color="#c9cdd4" metalness={0.9} roughness={0.25} />
                    </mesh>
                  </group>
                )) : null}
              </group>
            );
          })}
        </>
      ) : null}

      {/* Prateleiras internas (visíveis quando abre) */}
      {props.subtype === "closet" || (comp.doors > 0 && !openDoors) ? null : (
        Array.from({ length: Math.max(0, Math.floor(height / 0.4) - 1) }).map((_, i) => {
          const y = -halfH + ((i + 1) * height) / Math.max(1, Math.floor(height / 0.4));
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
              position={[(-hingeSide * doorW) + hingeSide * 0.03, 0, FRONT_T + 0.008]}
              castShadow
            >
              <boxGeometry args={[0.012, Math.min(0.36, doorH * 0.6), 0.008]} />
              <meshStandardMaterial color="#c9cdd4" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        );
      })}

      {/* Frentes: gavetas */}
      {comp.drawers > 0 && Array.from({ length: comp.drawers }).map((_, i) => {
        const drH = (height - (comp.drawers + 1) * GAP) / comp.drawers;
        const cy = halfH - GAP - drH / 2 - i * (drH + GAP);
        const outset = openDrawers ? 0.16 : 0;
        return (
          <group key={`dr-${i}`} position={[0, cy, halfD - INSET + FRONT_T / 2 + outset]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[width - 2 * GAP, drH, FRONT_T]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            {/* Puxador horizontal centralizado */}
            <mesh position={[0, 0, FRONT_T / 2 + 0.008]} castShadow>
              <boxGeometry args={[Math.min(0.32, (width - 2 * GAP) * 0.5), 0.012, 0.008]} />
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