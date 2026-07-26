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
  shelvesCount?: number;
  led?: boolean;
}

interface CabinetComposition {
  drawers: number;
  doors: number;
  bays: number;
}

// -----------------------------------------------------------------------------
// Heurísticas de composição
// -----------------------------------------------------------------------------
function inferComposition(p: CabinetMeshProps): CabinetComposition {
  const { subtype, width, height, drawersCount, doorsCount } = p;
  // gaveteiros: só gavetas
  if (subtype === "gaveteiro") {
    const n = drawersCount ?? Math.max(2, Math.min(6, Math.round(height / 0.2)));
    return { drawers: n, doors: 0, bays: 1 };
  }
  if (subtype === "closet") {
    const bays = Math.max(2, Math.min(5, Math.round(width / 0.72)));
    return { drawers: 0, doors: 0, bays };
  }
  if (subtype === "prateleira" || subtype === "nicho" || subtype === "tampo" || subtype === "bancada" || subtype === "painel") {
    return { drawers: 0, doors: 0, bays: 1 };
  }
  // armários: portas verticais, 1 por ~500mm
  const doors = doorsCount ?? Math.max(1, Math.min(6, Math.round(width / 0.5)));
  return { drawers: 0, doors, bays: Math.max(1, doors) };
}

export function CabinetMesh(props: CabinetMeshProps) {
  const { width, height, depth, bodyProps, frontProps, selected, openDoors, openDrawers, led } = props;
  const comp = useMemo(() => inferComposition(props), [props]);

  // A cena 3D trabalha em metros; todos os valores abaixo são medidas reais de marcenaria.
  const T = 0.018; // chapa 18mm
  const GAP = 0.003;
  const FRONT_T = 0.018;
  const INSET = 0.006;
  // Rodapé/sapata: 100mm em balcões/torres, 80mm em closets, ausente em aéreos.
  const isUpper = props.subtype === "aereo" || props.subtype === "prateleira" || props.subtype === "nicho";
  const TOE_KICK_H = isUpper ? 0 : (props.subtype === "closet" || props.subtype === "roupeiro" ? 0.08 : 0.1);
  const HAS_CORNICE = isUpper || props.subtype === "torre";
  const CORNICE_H = 0.04;

  // Caixa (corpo) — meshes internos: fundo, laterais, tampo, base
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  const bodyColor = (bodyProps as { color?: string }).color ?? "#b78a5c";
  const frontMatProps = frontProps ?? bodyProps;
  // Cor levemente escurecida para as reentrâncias/shaker panel (sombreado real de marcenaria).
  const frontColor = (frontMatProps as { color?: string }).color ?? bodyColor;
  const HANDLE_COLOR = "#d4d7dc";

  return (
    <group>
      {/* Rodapé/sapata técnica */}
      {TOE_KICK_H > 0 && height > 0.5 ? (
        <mesh position={[0, -halfH + TOE_KICK_H / 2, halfD - depth * 0.08]} castShadow receiveShadow>
          <boxGeometry args={[Math.max(0.05, width - T * 2), TOE_KICK_H, Math.max(0.04, depth * 0.12)]} />
          <meshStandardMaterial {...bodyProps} color={bodyColor} roughness={0.8} />
        </mesh>
      ) : null}

      {/* Cornija superior (aéreos/torres) */}
      {HAS_CORNICE ? (
        <mesh position={[0, halfH + CORNICE_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + 0.01, CORNICE_H, depth + 0.008]} />
          <meshStandardMaterial {...bodyProps} color={bodyColor} roughness={0.7} />
        </mesh>
      ) : null}

      {/* LED emissivo — barra fininha no topo interno */}
      {led ? (
        <mesh position={[0, halfH - T - 0.006, -halfD + T + 0.02]}>
          <boxGeometry args={[Math.max(0.05, width - T * 2 - 0.02), 0.004, 0.01]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff2c2" emissiveIntensity={2.4} toneMapped={false} />
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
          {Array.from({ length: Math.max(1, comp.bays) - 1 }).map((_, i) => {
            const bayW = (width - T * 2) / Math.max(1, comp.bays);
            const x = -halfW + T + bayW * (i + 1);
            return (
              <mesh key={`divider-${i}`} position={[x, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[T, Math.max(0.05, height - TOE_KICK_H), Math.max(0.05, depth - T)]} />
                <meshStandardMaterial {...bodyProps} color={bodyColor} />
              </mesh>
            );
          })}
          {Array.from({ length: Math.max(1, comp.bays) }).map((_, i) => {
            const bays = Math.max(1, comp.bays);
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
        (() => {
          const auto = Math.max(0, Math.floor(height / 0.4) - 1);
          const n = Math.max(0, Math.min(12, props.shelvesCount ?? auto));
          return Array.from({ length: n }).map((_, i) => {
          const y = -halfH + ((i + 1) * height) / Math.max(1, n + 1);
          return (
            <mesh key={`shelf-${i}`} position={[0, y, 0]} castShadow receiveShadow>
              <boxGeometry args={[width - 2 * T, T * 0.9, depth - T]} />
              <meshStandardMaterial {...bodyProps} color={bodyColor} />
            </mesh>
          );
        });
        })()
      )}

      {/* Frentes: portas — shaker real com moldura de 4 réguas protruída (~4mm) */}
      {comp.doors > 0 && Array.from({ length: comp.doors }).map((_, i) => {
        const doorW = (width - (comp.doors + 1) * GAP) / comp.doors;
        const doorH = height - 2 * GAP;
        const cx = -halfW + GAP + doorW / 2 + i * (doorW + GAP);
        const openAngle = openDoors ? (i % 2 === 0 ? -1.35 : 1.35) : 0;
        const hingeSide = i % 2 === 0 ? -1 : 1;
        const RAIL = Math.min(0.075, Math.min(doorW, doorH) * 0.14); // largura da régua
        const PROT = 0.004; // 4mm de protrusão do frame
        const railZ = FRONT_T + PROT / 2;
        return (
          <group
            key={`door-${i}`}
            position={[cx + (hingeSide * doorW) / 2, 0, halfD - INSET]}
            rotation={[0, openAngle, 0]}
          >
            {/* Painel base da porta (recessed panel) — levemente mais escuro */}
            <mesh position={[(-hingeSide * doorW) / 2, 0, FRONT_T / 2]} castShadow receiveShadow>
              <boxGeometry args={[doorW, doorH, FRONT_T]} />
              <meshStandardMaterial
                {...frontMatProps}
                color={frontColor}
                roughness={Math.min(1, ((frontMatProps as { roughness?: number }).roughness ?? 0.55) + 0.08)}
              />
            </mesh>
            {/* Régua superior */}
            <mesh position={[(-hingeSide * doorW) / 2, doorH / 2 - RAIL / 2, railZ]} castShadow receiveShadow>
              <boxGeometry args={[doorW, RAIL, PROT]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            {/* Régua inferior */}
            <mesh position={[(-hingeSide * doorW) / 2, -doorH / 2 + RAIL / 2, railZ]} castShadow receiveShadow>
              <boxGeometry args={[doorW, RAIL, PROT]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            {/* Régua esquerda */}
            <mesh position={[(-hingeSide * doorW) / 2 - doorW / 2 + RAIL / 2, 0, railZ]} castShadow receiveShadow>
              <boxGeometry args={[RAIL, Math.max(0.02, doorH - RAIL * 2), PROT]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            {/* Régua direita */}
            <mesh position={[(-hingeSide * doorW) / 2 + doorW / 2 - RAIL / 2, 0, railZ]} castShadow receiveShadow>
              <boxGeometry args={[RAIL, Math.max(0.02, doorH - RAIL * 2), PROT]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            {/* Puxador tubular vertical (barra) */}
            <mesh
              position={[(-hingeSide * doorW) + hingeSide * 0.032, 0, FRONT_T + PROT + 0.012]}
              castShadow
            >
              <cylinderGeometry args={[0.006, 0.006, Math.min(0.34, doorH * 0.55), 24]} />
              <meshStandardMaterial color={HANDLE_COLOR} metalness={0.95} roughness={0.18} />
            </mesh>
            {/* Bases do puxador (afastadores cromados) */}
            {[-1, 1].map((s) => (
              <mesh
                key={`hbase-${s}`}
                position={[(-hingeSide * doorW) + hingeSide * 0.032, s * Math.min(0.15, doorH * 0.25), FRONT_T + PROT / 2 + 0.006]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.009, 0.009, 0.014, 20]} />
                <meshStandardMaterial color={HANDLE_COLOR} metalness={0.9} roughness={0.25} />
              </mesh>
            ))}
            {/* Dobradiças caneco (2 por porta) — visíveis quando a porta abre */}
            {[-1, 1].map((s) => (
              <mesh
                key={`hinge-${s}`}
                position={[0, s * Math.min(0.24, doorH * 0.36), -FRONT_T / 2 - 0.002]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.011, 0.011, 0.024, 20]} />
                <meshStandardMaterial color="#a8adb5" metalness={0.9} roughness={0.35} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Frentes: gavetas — shaker real com moldura protruída */}
      {comp.drawers > 0 && Array.from({ length: comp.drawers }).map((_, i) => {
        const drH = (height - (comp.drawers + 1) * GAP) / comp.drawers;
        const drW = width - 2 * GAP;
        const cy = halfH - GAP - drH / 2 - i * (drH + GAP);
        const outset = openDrawers ? 0.16 : 0;
        const RAIL = Math.min(0.06, Math.min(drW, drH) * 0.16);
        const PROT = 0.004;
        const railZ = FRONT_T + PROT / 2;
        return (
          <group key={`dr-${i}`} position={[0, cy, halfD - INSET + FRONT_T / 2 + outset]}>
            {/* Painel base (recessed) */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[drW, drH, FRONT_T]} />
              <meshStandardMaterial
                {...frontMatProps}
                color={frontColor}
                roughness={Math.min(1, ((frontMatProps as { roughness?: number }).roughness ?? 0.55) + 0.08)}
              />
            </mesh>
            {/* 4 réguas do frame */}
            <mesh position={[0, drH / 2 - RAIL / 2, railZ]} castShadow receiveShadow>
              <boxGeometry args={[drW, RAIL, PROT]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            <mesh position={[0, -drH / 2 + RAIL / 2, railZ]} castShadow receiveShadow>
              <boxGeometry args={[drW, RAIL, PROT]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            <mesh position={[-drW / 2 + RAIL / 2, 0, railZ]} castShadow receiveShadow>
              <boxGeometry args={[RAIL, Math.max(0.02, drH - RAIL * 2), PROT]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            <mesh position={[drW / 2 - RAIL / 2, 0, railZ]} castShadow receiveShadow>
              <boxGeometry args={[RAIL, Math.max(0.02, drH - RAIL * 2), PROT]} />
              <meshStandardMaterial {...frontMatProps} />
            </mesh>
            {/* Puxador horizontal centralizado */}
            <mesh position={[0, 0, FRONT_T + PROT + 0.012]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.006, 0.006, Math.min(0.30, drW * 0.45), 24]} />
              <meshStandardMaterial color={HANDLE_COLOR} metalness={0.95} roughness={0.18} />
            </mesh>
            {/* Bases do puxador */}
            {[-1, 1].map((s) => (
              <mesh
                key={`dhb-${s}`}
                position={[s * Math.min(0.14, drW * 0.22), 0, FRONT_T + PROT / 2 + 0.006]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.009, 0.009, 0.014, 20]} />
                <meshStandardMaterial color={HANDLE_COLOR} metalness={0.9} roughness={0.25} />
              </mesh>
            ))}
            {/* Laterais internas visíveis quando gaveta aberta */}
            {openDrawers ? (
              <>
                {/* Fundo da caixa da gaveta */}
                <mesh position={[0, -drH / 2 + 0.01, -outset / 2 - FRONT_T / 2]} receiveShadow>
                  <boxGeometry args={[Math.max(0.05, drW - 0.04), 0.012, Math.max(0.02, outset)]} />
                  <meshStandardMaterial color="#8a8a8a" roughness={0.7} metalness={0.1} />
                </mesh>
                {/* Laterais da caixa */}
                {[-1, 1].map((s) => (
                  <mesh key={`box-side-${s}`} position={[s * (drW / 2 - 0.02), 0, -outset / 2 - FRONT_T / 2]} receiveShadow>
                    <boxGeometry args={[0.012, drH * 0.85, Math.max(0.02, outset)]} />
                    <meshStandardMaterial color="#8a8a8a" roughness={0.7} />
                  </mesh>
                ))}
                {/* Corrediças telescópicas (Blum-like) visíveis nas laterais */}
                {[-1, 1].map((s) => (
                  <mesh
                    key={`slide-${s}`}
                    position={[s * (drW / 2 - 0.005), -drH / 2 + 0.03, -outset / 2 - FRONT_T / 2]}
                    receiveShadow
                  >
                    <boxGeometry args={[0.006, 0.02, Math.max(0.02, outset * 0.95)]} />
                    <meshStandardMaterial color="#c0c4cc" metalness={0.9} roughness={0.25} />
                  </mesh>
                ))}
              </>
            ) : null}
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