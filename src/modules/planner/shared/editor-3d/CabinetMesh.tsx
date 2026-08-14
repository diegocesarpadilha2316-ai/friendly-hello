/**
 * Modelos procedurais de marcenaria (armários, gaveteiros, torres, closets).
 *
 * Substitui o "box roxo" genérico por uma caixa de MDF com frentes reais
 * (portas ou gavetas) recuadas, sulcos entre peças e puxadores metálicos.
 * A cor principal vem do material da biblioteca (props do <meshStandardMaterial>
 * repassados via prop `bodyMaterialProps`); quando ausente, cai em freijó neutro.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCabinetStyle, type CabinetStyleSpec } from "./furniture-style";

export type CabinetSubtype =
  | "closet"
  | "roupeiro"
  | "armario"
  | "guarda-roupa"
  | "balcao"
  | "aereo"
  | "torre"
  | "gaveteiro"
  | "bancada"
  | "tampo"
  | "ilha"
  | "prateleira"
  | "nicho"
  | "painel"
  | "cristaleira";

/**
 * Caminho legado — mantido apenas para as famílias que AINDA não foram
 * convertidas para a Biblioteca Construtiva. Roupeiro e gaveteiro saíram
 * daqui: são roteados antes, no `Scene3D`, para `WardrobeMesh`/`DresserMesh`.
 */
const CABINET_SUBTYPES = new Set<CabinetSubtype>([
  "closet",
  "roupeiro",
  "armario",
  "guarda-roupa",
  "balcao",
  "aereo",
  "torre",
  "bancada",
  "tampo",
  "ilha",
  "prateleira",
  "nicho",
  "painel",
  "cristaleira",
]);

export function isCabinetSubtype(s: string | undefined): s is CabinetSubtype {
  return !!s && CABINET_SUBTYPES.has(s as CabinetSubtype);
}

/**
 * Wrapper que interpola suavemente rotação Y e deslocamento Z do grupo
 * até os valores alvo, dando feel de "abrir e fechar" real em portas
 * e gavetas (usa damp com dt real do frame — timing-independent).
 */
function AnimatedOpen({
  position,
  baseZ,
  targetRotY = 0,
  targetOffsetZ = 0,
  lambda = 8,
  children,
}: {
  position: [number, number, number];
  baseZ?: number;
  targetRotY?: number;
  targetOffsetZ?: number;
  lambda?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRotY, lambda, dt);
    const targetZ = (baseZ ?? position[2]) + targetOffsetZ;
    g.position.z = THREE.MathUtils.damp(g.position.z, targetZ, lambda, dt);
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

interface CabinetMeshProps {
  subtype: CabinetSubtype;
  width: number; // mm em X (repassado como three units)
  height: number; // mm em Y
  depth: number; // mm em Z
  bodyProps: React.ComponentProps<"meshStandardMaterial">;
  frontProps?: React.ComponentProps<"meshStandardMaterial">;
  selected?: boolean;
  openDoors?: boolean;
  openDrawers?: boolean;
  drawersCount?: number;
  doorsCount?: number;
  shelvesCount?: number;
  led?: boolean;
  hasSink?: boolean;
  /** Estilo do projeto (moderno, clássico, luxo...). */
  style?: string | null;
  /** Overrides explícitos de linha de marcenaria. */
  handleStyle?: string | null;
  hardwareFinish?: string | null;
  frontStyle?: string | null;
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
  if (
    subtype === "prateleira" ||
    subtype === "nicho" ||
    subtype === "tampo" ||
    subtype === "bancada" ||
    subtype === "painel"
  ) {
    return { drawers: 0, doors: 0, bays: 1 };
  }
  // armários: portas verticais, 1 por ~500mm
  const doors = doorsCount ?? Math.max(1, Math.min(6, Math.round(width / 0.5)));
  return { drawers: 0, doors, bays: Math.max(1, doors) };
}

export function CabinetMesh(props: CabinetMeshProps) {
  const { width, height, depth, bodyProps, frontProps, selected, openDoors, openDrawers, led } =
    props;
  const comp = useMemo(() => inferComposition(props), [props]);

  // Ficha técnica de estilo (design spec) — define frente, puxador,
  // ferragem, junta-sombra, rodapé e cornija deste módulo.
  const spec: CabinetStyleSpec = useMemo(
    () =>
      resolveCabinetStyle({
        subtype: props.subtype,
        width: props.width,
        height: props.height,
        style: props.style,
        handle: props.handleStyle,
        hardware: props.hardwareFinish,
        front: props.frontStyle,
      }),
    [
      props.subtype,
      props.width,
      props.height,
      props.style,
      props.handleStyle,
      props.hardwareFinish,
      props.frontStyle,
    ],
  );

  // A cena 3D trabalha em metros; todos os valores abaixo são medidas reais de marcenaria.
  const T = 0.018; // chapa 18mm
  const GAP = spec.reveal;
  const FRONT_T = spec.frontThickness;
  const INSET = 0.006;
  const TOE_KICK_H = spec.plinth;
  const HAS_CORNICE = spec.cornice > 0;
  const CORNICE_H = spec.cornice;

  // Caixa (corpo) — meshes internos: fundo, laterais, tampo, base
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  const bodyColor = (bodyProps as { color?: string }).color ?? "#b78a5c";
  const frontMatProps = frontProps ?? bodyProps;
  // Cor levemente escurecida para as reentrâncias/shaker panel (sombreado real de marcenaria).
  const frontColor = (frontMatProps as { color?: string }).color ?? bodyColor;
  const hardwareProps = {
    color: spec.hardwareColor,
    metalness: spec.hardwareMetalness,
    roughness: spec.hardwareRoughness,
  };

  return (
    <group>
      {/* Rodapé/sapata técnica */}
      {TOE_KICK_H > 0 && height > 0.5 ? (
        <mesh
          position={[0, -halfH + TOE_KICK_H / 2, halfD - spec.plinthRecess]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[Math.max(0.05, width - T * 2), TOE_KICK_H, Math.max(0.04, depth * 0.12)]}
          />
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
          <meshStandardMaterial
            color="#fff6d8"
            emissive="#fff2c2"
            emissiveIntensity={2.4}
            toneMapped={false}
          />
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
      {/* Cuba/pia integrada — torna "balcão de pia" visualmente diferente de balcão genérico. */}
      {props.hasSink ? (
        <group position={[0, halfH + 0.004, halfD * 0.12]}>
          <mesh receiveShadow>
            <boxGeometry
              args={[Math.min(width * 0.42, 0.62), 0.018, Math.min(depth * 0.42, 0.42)]}
            />
            <meshStandardMaterial color="#b8bec8" metalness={0.75} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.006, 0]}>
            <boxGeometry
              args={[Math.min(width * 0.34, 0.5), 0.012, Math.min(depth * 0.32, 0.32)]}
            />
            <meshStandardMaterial color="#3f4652" metalness={0.35} roughness={0.3} />
          </mesh>
          <mesh
            position={[Math.min(width * 0.17, 0.26), 0.08, -Math.min(depth * 0.16, 0.16)]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <torusGeometry args={[0.045, 0.006, 10, 28, Math.PI]} />
            <meshStandardMaterial color="#cbd1d9" metalness={0.9} roughness={0.18} />
          </mesh>
          <mesh
            position={[Math.min(width * 0.17, 0.26), 0.025, -Math.min(depth * 0.16, 0.16)]}
            castShadow
          >
            <cylinderGeometry args={[0.012, 0.014, 0.055, 18]} />
            <meshStandardMaterial color="#cbd1d9" metalness={0.9} roughness={0.18} />
          </mesh>
        </group>
      ) : null}
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
                <boxGeometry
                  args={[T, Math.max(0.05, height - TOE_KICK_H), Math.max(0.05, depth - T)]}
                />
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
                  <boxGeometry
                    args={[Math.max(0.05, bayW - GAP), T, Math.max(0.05, depth - T * 1.4)]}
                  />
                  <meshStandardMaterial {...bodyProps} color={bodyColor} />
                </mesh>
                <mesh position={[x, midShelfY, 0]} castShadow receiveShadow>
                  <boxGeometry
                    args={[Math.max(0.05, bayW - GAP), T, Math.max(0.05, depth - T * 1.4)]}
                  />
                  <meshStandardMaterial {...bodyProps} color={bodyColor} />
                </mesh>
                <mesh position={[x, halfH - 0.62, halfD - 0.12]} castShadow>
                  <cylinderGeometry args={[0.012, 0.012, Math.max(0.08, bayW - 0.08), 16]} />
                  <meshStandardMaterial {...hardwareProps} />
                </mesh>
                {hasDrawers
                  ? Array.from({ length: 3 }).map((_, d) => (
                      <group
                        key={`closet-dr-${i}-${d}`}
                        position={[x, drawerStackY + d * 0.18, halfD - INSET]}
                      >
                        <mesh castShadow receiveShadow>
                          <boxGeometry args={[Math.max(0.05, bayW - 0.045), 0.16, FRONT_T]} />
                          <meshStandardMaterial {...frontMatProps} />
                        </mesh>
                        <mesh position={[0, 0, FRONT_T / 2 + 0.008]} castShadow>
                          <boxGeometry args={[Math.min(0.26, bayW * 0.55), 0.01, 0.008]} />
                          <meshStandardMaterial {...hardwareProps} />
                        </mesh>
                      </group>
                    ))
                  : null}
              </group>
            );
          })}
        </>
      ) : null}

      {/* Prateleiras internas (visíveis quando abre) */}
      {props.subtype === "closet" || (comp.doors > 0 && !openDoors)
        ? null
        : (() => {
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
          })()}

      {/* Frentes: portas — tratamento definido pela ficha de estilo */}
      {comp.doors > 0 &&
        Array.from({ length: comp.doors }).map((_, i) => {
          const doorW = (width - (comp.doors + 1) * GAP) / comp.doors;
          const doorH = height - 2 * GAP;
          const cx = -halfW + GAP + doorW / 2 + i * (doorW + GAP);
          const openAngle = openDoors ? (i % 2 === 0 ? -1.35 : 1.35) : 0;
          const hingeSide = i % 2 === 0 ? -1 : 1;
          return (
            <AnimatedOpen
              key={`door-${i}`}
              position={[cx + (hingeSide * doorW) / 2, 0, halfD - INSET]}
              targetRotY={openAngle}
              lambda={7}
            >
              <group position={[(-hingeSide * doorW) / 2, 0, 0]}>
                <FrontSurface
                  spec={spec}
                  width={doorW}
                  height={doorH}
                  thickness={FRONT_T}
                  matProps={frontMatProps}
                  color={frontColor}
                />
                <Handle
                  spec={spec}
                  orientation="vertical"
                  frontW={doorW}
                  frontH={doorH}
                  frontT={FRONT_T}
                  edge={hingeSide === -1 ? "right" : "left"}
                />
              </group>
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
            </AnimatedOpen>
          );
        })}

      {/* Frentes: gavetas — tratamento definido pela ficha de estilo */}
      {comp.drawers > 0 &&
        Array.from({ length: comp.drawers }).map((_, i) => {
          const drH = (height - (comp.drawers + 1) * GAP) / comp.drawers;
          const drW = width - 2 * GAP;
          const cy = halfH - GAP - drH / 2 - i * (drH + GAP);
          const outset = openDrawers ? 0.16 : 0;
          const baseZ = halfD - INSET;
          return (
            <AnimatedOpen
              key={`dr-${i}`}
              position={[0, cy, baseZ]}
              baseZ={baseZ}
              targetOffsetZ={outset}
              lambda={9}
            >
              <FrontSurface
                spec={spec}
                width={drW}
                height={drH}
                thickness={FRONT_T}
                matProps={frontMatProps}
                color={frontColor}
              />
              <Handle
                spec={spec}
                orientation="horizontal"
                frontW={drW}
                frontH={drH}
                frontT={FRONT_T}
                edge="top"
              />
              {/* Laterais internas visíveis quando gaveta aberta */}
              {openDrawers ? (
                <>
                  {/* Fundo da caixa da gaveta */}
                  <mesh position={[0, -drH / 2 + 0.01, -outset / 2 - FRONT_T / 2]} receiveShadow>
                    <boxGeometry
                      args={[Math.max(0.05, drW - 0.04), 0.012, Math.max(0.02, outset)]}
                    />
                    <meshStandardMaterial color="#8a8a8a" roughness={0.7} metalness={0.1} />
                  </mesh>
                  {/* Laterais da caixa */}
                  {[-1, 1].map((s) => (
                    <mesh
                      key={`box-side-${s}`}
                      position={[s * (drW / 2 - 0.02), 0, -outset / 2 - FRONT_T / 2]}
                      receiveShadow
                    >
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
            </AnimatedOpen>
          );
        })}

      {/* Contorno de seleção */}
      {selected ? <SelectionHalo width={width} height={height} depth={depth} /> : null}
    </group>
  );
}

type MatProps = React.ComponentProps<"meshStandardMaterial">;

/**
 * Superfície da frente — desenha o tratamento definido pela ficha:
 * liso (1 mesh), shaker (moldura de 4 réguas), ripado/canelado (ripas).
 */
function FrontSurface({
  spec,
  width,
  height,
  thickness,
  matProps,
  color,
}: {
  spec: CabinetStyleSpec;
  width: number;
  height: number;
  thickness: number;
  matProps: MatProps;
  color?: string;
}) {
  const baseRough = Math.min(1, ((matProps as { roughness?: number }).roughness ?? 0.55) + 0.08);
  const panel = (
    <mesh position={[0, 0, thickness / 2]} castShadow receiveShadow>
      <boxGeometry args={[width, height, thickness]} />
      <meshStandardMaterial {...matProps} color={color} roughness={baseRough} />
    </mesh>
  );

  if (spec.front === "liso") return panel;

  if (spec.front === "shaker") {
    const RAIL = Math.min(0.075, Math.min(width, height) * 0.14);
    const PROT = 0.004;
    const z = thickness + PROT / 2;
    return (
      <>
        {panel}
        <mesh position={[0, height / 2 - RAIL / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[width, RAIL, PROT]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
        <mesh position={[0, -height / 2 + RAIL / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[width, RAIL, PROT]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
        <mesh position={[-width / 2 + RAIL / 2, 0, z]} castShadow receiveShadow>
          <boxGeometry args={[RAIL, Math.max(0.02, height - RAIL * 2), PROT]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
        <mesh position={[width / 2 - RAIL / 2, 0, z]} castShadow receiveShadow>
          <boxGeometry args={[RAIL, Math.max(0.02, height - RAIL * 2), PROT]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </>
    );
  }

  // Ripado / canelado — ripas verticais com relevo real (sombra própria).
  const n = Math.max(3, Math.min(spec.slats, Math.floor(width / 0.014)));
  const pitch = width / n;
  const slatW = pitch * (spec.front === "canelado" ? 0.72 : 0.66);
  const relief = spec.front === "canelado" ? 0.005 : 0.008;
  return (
    <>
      {panel}
      {Array.from({ length: n }).map((_, i) => (
        <mesh
          key={`slat-${i}`}
          position={[-width / 2 + pitch * (i + 0.5), 0, thickness + relief / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[slatW, Math.max(0.02, height - 0.01), relief]} />
          <meshStandardMaterial {...matProps} color={color} roughness={baseRough} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Pega da frente — perfil gola, cava usinada, barra tubular, botão
 * ou nada (push-to-open). Cada tipo muda a leitura do móvel.
 */
function Handle({
  spec,
  orientation,
  frontW,
  frontH,
  frontT,
  edge,
}: {
  spec: CabinetStyleSpec;
  orientation: "vertical" | "horizontal";
  frontW: number;
  frontH: number;
  frontT: number;
  edge: "left" | "right" | "top";
}) {
  if (spec.handle === "none") return null;
  const mat = (
    <meshStandardMaterial
      color={spec.hardwareColor}
      metalness={spec.hardwareMetalness}
      roughness={spec.hardwareRoughness}
    />
  );
  const zFace = frontT + 0.001;

  if (spec.handle === "perfil-gola" || spec.handle === "cava") {
    // Perfil embutido: régua fina rente à frente (gola) ou rebaixo (cava).
    const inset = spec.handle === "cava" ? -0.006 : 0.002;
    if (orientation === "horizontal") {
      return (
        <mesh position={[0, frontH / 2 - 0.018, zFace + inset]} castShadow>
          <boxGeometry args={[Math.max(0.05, frontW - 0.02), 0.02, 0.008]} />
          {mat}
        </mesh>
      );
    }
    const sx = edge === "left" ? -1 : 1;
    return (
      <mesh position={[sx * (frontW / 2 - 0.018), 0, zFace + inset]} castShadow>
        <boxGeometry args={[0.02, Math.max(0.05, frontH - 0.02), 0.008]} />
        {mat}
      </mesh>
    );
  }

  if (spec.handle === "botao") {
    const px = orientation === "horizontal" ? 0 : (edge === "left" ? -1 : 1) * (frontW / 2 - 0.05);
    const py = orientation === "horizontal" ? 0 : 0;
    return (
      <mesh position={[px, py, zFace + 0.012]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.011, 0.026, 20]} />
        {mat}
      </mesh>
    );
  }

  // Tubular: barra + afastadores.
  const len =
    orientation === "horizontal" ? Math.min(0.3, frontW * 0.45) : Math.min(0.34, frontH * 0.55);
  const bx = orientation === "horizontal" ? 0 : (edge === "left" ? -1 : 1) * (frontW / 2 - 0.032);
  const rot: [number, number, number] =
    orientation === "horizontal" ? [0, 0, Math.PI / 2] : [0, 0, 0];
  return (
    <>
      <mesh position={[bx, 0, zFace + 0.016]} rotation={rot} castShadow>
        <cylinderGeometry args={[0.006, 0.006, len, 20]} />
        {mat}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={`hb-${s}`}
          position={[
            orientation === "horizontal" ? s * (len / 2 - 0.01) : bx,
            orientation === "horizontal" ? 0 : s * (len / 2 - 0.01),
            zFace + 0.008,
          ]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.009, 0.009, 0.014, 16]} />
          {mat}
        </mesh>
      ))}
    </>
  );
}

/**
 * Contorno pulsante para o móvel selecionado — dá feedback visual
 * imediato sem cobrir o mesh e desaparece ao clicar em outro item.
 */
function SelectionHalo({ width, height, depth }: { width: number; height: number; depth: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const pulse = 0.28 + Math.sin(t * 3) * 0.08;
    (m.material as THREE.MeshBasicMaterial).opacity = pulse;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[width * 1.015, height * 1.015, depth * 1.015]} />
      <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.32} />
    </mesh>
  );
}
