/**
 * RENDER GENÉRICO DE MONTAGEM — consome a saída da Biblioteca Construtiva.
 *
 * Este componente NÃO decide marcenaria. Ele apenas desenha as peças
 * (`ConstructionPiece`), aplica os rigs (`ConstructionMotion`) e orquestra
 * o intertravamento (`resolveInterlock`). QUALQUER família convertida
 * (roupeiro, gaveteiro, e as próximas) usa exatamente este renderizador —
 * não existe pipeline paralelo.
 */
import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  motionGroupOfPiece,
  openStateForGroup,
  resolveInterlock,
  resolveMotion,
  type AssemblyResult,
  type ConstructionMotion,
  type ConstructionPiece,
  type InterlockBlock,
} from "../construction";

export const MM = 0.001;

export interface AssemblyMeshProps {
  /** Montagem já resolvida pela família. */
  assembly: AssemblyResult;
  /** Dimensões externas (mm) usadas para recentrar o móvel na cena. */
  sizeMm: { widthMm: number; heightMm: number; depthMm: number };
  bodyProps?: Record<string, unknown>;
  selected?: boolean;
  openDoors?: boolean;
  openDrawers?: boolean;
  onInterlock?: (blocked: readonly InterlockBlock[]) => void;
}

/** Peça animada: interpola o estado 0→1 do rig com dt real do frame. */
function MotionPiece({
  motion,
  pieceId,
  targets,
  states,
  children,
}: {
  motion?: ConstructionMotion;
  pieceId: string;
  /** Estado PERMITIDO (0→1) por peça, já filtrado pelo intertravamento. */
  targets: React.MutableRefObject<Record<string, number>>;
  /** Estado real da animação, devolvido ao intertravamento a cada frame. */
  states: React.MutableRefObject<Record<string, number>>;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const state = useRef(0);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g || !motion) return;
    state.current = THREE.MathUtils.damp(state.current, targets.current[pieceId] ?? 0, 8, dt);
    states.current[pieceId] = state.current;
    const t = resolveMotion(motion, state.current);
    g.position.set(t.translate[0] * MM, t.translate[1] * MM, t.translate[2] * MM);
    g.rotation.set(
      THREE.MathUtils.degToRad(t.rotateDeg[0]),
      THREE.MathUtils.degToRad(t.rotateDeg[1]),
      THREE.MathUtils.degToRad(t.rotateDeg[2]),
    );
  });

  if (!motion) return <>{children}</>;
  // Grupo externo posiciona o pivô; o interno devolve a peça ao lugar.
  const p = motion.pivot ?? [0, 0, 0];
  return (
    <group position={[p[0] * MM, p[1] * MM, p[2] * MM]}>
      <group ref={ref}>
        <group position={[-p[0] * MM, -p[1] * MM, -p[2] * MM]}>{children}</group>
      </group>
    </group>
  );
}

function PieceMesh({
  piece,
  bodyProps,
  selected,
}: {
  piece: ConstructionPiece;
  bodyProps?: Record<string, unknown>;
  selected?: boolean;
}) {
  const { box } = piece;
  const w = Math.max(0.002, box.width * MM);
  const h = Math.max(0.002, box.height * MM);
  const d = Math.max(0.002, box.depth * MM);

  const material = useMemo(() => {
    if (piece.substrate === "espelho") {
      return { color: "#cfd8dc", metalness: 1, roughness: 0.04, envMapIntensity: 2.2 };
    }
    if (piece.substrate === "vidro") {
      return {
        color: "#e8f1f2",
        metalness: 0.1,
        roughness: 0.08,
        transparent: true,
        opacity: 0.35,
      };
    }
    if (piece.substrate === "metal" || piece.substrate === "perfil") {
      return { color: "#9aa1a6", metalness: 0.9, roughness: 0.28 };
    }
    return bodyProps ?? { color: "#b08d5e", roughness: 0.55, metalness: 0.05 };
  }, [piece.substrate, bodyProps]);

  return (
    <mesh
      name={`piece:${piece.id}:${piece.partKind}`}
      position={[
        (box.x + box.width / 2) * MM,
        (box.y + box.height / 2) * MM,
        (box.z + box.depth / 2) * MM,
      ]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        {...(material as Record<string, never>)}
        {...(selected ? { emissive: "#3b82f6", emissiveIntensity: 0.12 } : {})}
      />
    </mesh>
  );
}

function AssemblyMeshComponent(props: AssemblyMeshProps) {
  const { assembly } = props;

  /** Estado real da animação (escrito pelas peças a cada frame). */
  const states = useRef<Record<string, number>>({});
  /** Estado permitido, recalculado antes das peças animarem. */
  const targets = useRef<Record<string, number>>({});
  const lastNotice = useRef("");
  const lastControls = useRef("");

  const motionByPiece = useMemo(() => {
    const map = new Map<string, ConstructionMotion>();
    for (const m of assembly.motions) if (m.kind !== "static") map.set(m.pieceId, m);
    return map;
  }, [assembly.motions]);

  /**
   * Controlador do intertravamento: roda ANTES das peças (priority -1),
   * lê o estado real da animação e devolve o estado permitido de cada
   * mecanismo. Nenhuma regra construtiva vive aqui — só a orquestração.
   */
  useFrame(() => {
    const controls = `${Boolean(props.openDoors)}:${Boolean(props.openDrawers)}`;
    const moving = Object.entries(targets.current).some(
      ([id, target]) => Math.abs((states.current[id] ?? 0) - target) > 0.001,
    );
    if (!moving && lastControls.current === controls) return;
    lastControls.current = controls;
    const desired: Record<string, number> = {};
    for (const piece of assembly.pieces) {
      desired[piece.id] = openStateForGroup(motionGroupOfPiece(piece), {
        openDoors: props.openDoors,
        openDrawers: props.openDrawers,
      });
    }
    const result = resolveInterlock({
      pieces: assembly.pieces,
      motions: assembly.motions,
      desired,
      current: states.current,
    });
    targets.current = result.allowed as Record<string, number>;

    const notice = result.blocked.map((b) => b.groupId).join("|");
    if (notice !== lastNotice.current) {
      lastNotice.current = notice;
      if (result.blocked.length > 0) props.onInterlock?.(result.blocked);
    }
  }, -1);

  // O móvel é montado com origem no canto inferior-esquerdo-fundo;
  // a cena posiciona o grupo pelo CENTRO. Aqui recentramos.
  const offset: [number, number, number] = [
    -(props.sizeMm.widthMm * MM) / 2,
    -(props.sizeMm.heightMm * MM) / 2,
    -(props.sizeMm.depthMm * MM) / 2,
  ];

  return (
    <group position={offset}>
      {assembly.pieces.map((piece) => (
        <MotionPiece
          key={piece.id}
          pieceId={piece.id}
          motion={motionByPiece.get(piece.id)}
          targets={targets}
          states={states}
        >
          <PieceMesh piece={piece} bodyProps={props.bodyProps} selected={props.selected} />
        </MotionPiece>
      ))}
    </group>
  );
}

export const AssemblyMesh = memo(AssemblyMeshComponent);
