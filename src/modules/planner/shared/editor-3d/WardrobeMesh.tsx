/**
 * RENDER DO ROUPEIRO — consome a saída da Biblioteca Construtiva.
 *
 * Este componente NÃO decide marcenaria. Ele apenas desenha as peças
 * (`ConstructionPiece`) e aplica os rigs (`ConstructionMotion`) que a
 * família roupeiro produziu. Nenhuma regra construtiva vive aqui.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  motionGroupOfPiece,
  openStateForGroup,
  resolveInterlock,
  resolveMotion,
  type ConstructionMotion,
  type ConstructionPiece,
  type InterlockBlock,
} from "../construction";
import { buildWardrobe, wardrobeSpecFromLegacy, type LegacyParams } from "../families/wardrobe";

const MM = 0.001;

export interface WardrobeMeshProps {
  /** Dimensões em metros, vindas do descritor da cena. */
  width: number;
  height: number;
  depth: number;
  /** Params soltos do móvel (formato antigo e novo convivem). */
  params?: LegacyParams;
  bodyProps?: Record<string, unknown>;
  selected?: boolean;
  openDoors?: boolean;
  openDrawers?: boolean;
  /** Avisos discretos do intertravamento (ex.: "abra a porta desta coluna"). */
  onInterlock?: (blocked: readonly InterlockBlock[]) => void;
  doorsCount?: number;
  drawersCount?: number;
  shelvesCount?: number;
  style?: string;
  handleStyle?: string;
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
      return { color: "#e8f1f2", metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.35 };
    }
    if (piece.substrate === "metal" || piece.substrate === "perfil") {
      return { color: "#9aa1a6", metalness: 0.9, roughness: 0.28 };
    }
    return bodyProps ?? { color: "#b08d5e", roughness: 0.55, metalness: 0.05 };
  }, [piece.substrate, bodyProps]);

  return (
    <mesh
      position={[(box.x + box.width / 2) * MM, (box.y + box.height / 2) * MM, (box.z + box.depth / 2) * MM]}
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

export function WardrobeMesh(props: WardrobeMeshProps) {
  const { assembly, spec } = useMemo(() => {
    const base = wardrobeSpecFromLegacy({
      widthMm: props.width / MM,
      heightMm: props.height / MM,
      depthMm: props.depth / MM,
      params: props.params,
    });
    return buildWardrobe({
      ...base,
      doors: props.doorsCount ?? base.doors,
      drawers: props.drawersCount ?? base.drawers,
      shelvesPerColumn: props.shelvesCount ?? base.shelvesPerColumn,
      style: props.style ?? base.style,
      handle: props.handleStyle ?? base.handle,
    });
  }, [
    props.width,
    props.height,
    props.depth,
    props.params,
    props.doorsCount,
    props.drawersCount,
    props.shelvesCount,
    props.style,
    props.handleStyle,
  ]);

  /** Estado real da animação (escrito pelas peças a cada frame). */
  const states = useRef<Record<string, number>>({});
  /** Estado permitido, recalculado antes das peças animarem. */
  const targets = useRef<Record<string, number>>({});
  const lastNotice = useRef("");

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
    -(spec.widthMm * MM) / 2,
    -(spec.heightMm * MM) / 2,
    -(spec.depthMm * MM) / 2,
  ];

  return (
    <group position={offset}>
      {assembly.pieces.map((piece) => {
        const motion = motionByPiece.get(piece.id);
        return (
          <MotionPiece
            key={piece.id}
            pieceId={piece.id}
            motion={motion}
            targets={targets}
            states={states}
          >
            <PieceMesh piece={piece} bodyProps={props.bodyProps} selected={props.selected} />
          </MotionPiece>
        );
      })}
    </group>
  );
}
