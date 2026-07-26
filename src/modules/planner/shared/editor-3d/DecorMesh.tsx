/**
 * Modelos procedurais de decoração (Parte 3 — viewport fotorrealista).
 *
 * Renderização enxuta em primitivas Three.js, sem GLB externo. Cada subtipo
 * conhecido produz uma silhueta reconhecível (sofá com almofadas, planta em
 * vaso, luminária com abajur, etc.), ancorada em y=0 e centrada em X/Z. O
 * componente <Furniture> do Scene3D delega para cá quando o descritor casa
 * com um `subtype` decorativo.
 */
import { useMemo } from "react";
import * as THREE from "three";

export type DecorSubtype =
  | "sofa" | "cama" | "mesa" | "cadeira" | "poltrona"
  | "estante" | "aparador"
  | "tapete" | "cortina" | "persiana"
  | "quadro" | "espelho"
  | "vaso-planta" | "planta"
  | "luminaria" | "pendente" | "arandela" | "spot"
  | "livro" | "objeto-deco";

const DECOR_SUBTYPES = new Set<DecorSubtype>([
  "sofa", "cama", "mesa", "cadeira", "poltrona",
  "estante", "aparador",
  "tapete", "cortina", "persiana",
  "quadro", "espelho",
  "vaso-planta", "planta",
  "luminaria", "pendente", "arandela", "spot",
  "livro", "objeto-deco",
]);

export function isDecorSubtype(s: string | undefined): s is DecorSubtype {
  return !!s && DECOR_SUBTYPES.has(s as DecorSubtype);
}

interface DecorProps {
  subtype: DecorSubtype;
  width: number;   // X (m)
  height: number;  // Y (m)
  depth: number;   // Z (m)
  color?: string;  // cor principal (tecido/madeira)
  selected?: boolean;
}

// -----------------------------------------------------------------------------
// Paletas padrão por subtipo (usadas quando não há overrideColor)
// -----------------------------------------------------------------------------
const PALETTE: Record<DecorSubtype, { primary: string; secondary: string; accent: string }> = {
  sofa:        { primary: "#4a5568", secondary: "#2d3748", accent: "#718096" },
  cama:        { primary: "#e5e7eb", secondary: "#7c6f5f", accent: "#f3f4f6" },
  mesa:        { primary: "#8b6f4b", secondary: "#3b2f24", accent: "#8b6f4b" },
  cadeira:     { primary: "#8b6f4b", secondary: "#3b2f24", accent: "#8b6f4b" },
  poltrona:    { primary: "#6b7280", secondary: "#374151", accent: "#9ca3af" },
  estante:     { primary: "#5b4636", secondary: "#3b2f24", accent: "#5b4636" },
  aparador:    { primary: "#5b4636", secondary: "#3b2f24", accent: "#5b4636" },
  tapete:      { primary: "#8b7355", secondary: "#6b5744", accent: "#a89078" },
  cortina:     { primary: "#d6d3c7", secondary: "#a8a498", accent: "#d6d3c7" },
  persiana:    { primary: "#e5e7eb", secondary: "#9ca3af", accent: "#e5e7eb" },
  quadro:      { primary: "#8b6f4b", secondary: "#c9d1e0", accent: "#8b6f4b" },
  espelho:     { primary: "#e5e7eb", secondary: "#8b6f4b", accent: "#e5e7eb" },
  "vaso-planta":{primary: "#c9b39a", secondary: "#3d6b3a", accent: "#3d6b3a" },
  planta:      { primary: "#3d6b3a", secondary: "#2d4a2a", accent: "#4a7d47" },
  luminaria:   { primary: "#f5f0e5", secondary: "#2d2d2d", accent: "#ffe8a3" },
  pendente:    { primary: "#2d2d2d", secondary: "#f5f0e5", accent: "#ffe8a3" },
  arandela:    { primary: "#f5f0e5", secondary: "#2d2d2d", accent: "#ffe8a3" },
  spot:        { primary: "#e5e7eb", secondary: "#2d2d2d", accent: "#ffe8a3" },
  livro:       { primary: "#8b1e3f", secondary: "#1e3a8a", accent: "#c89b3c" },
  "objeto-deco":{primary: "#c89b3c", secondary: "#3d3d3d", accent: "#c89b3c" },
};

// -----------------------------------------------------------------------------
// Fabricantes de silhueta
// -----------------------------------------------------------------------------

function Sofa({ width, height, depth, color }: DecorProps & { color: string }) {
  const p = PALETTE.sofa;
  const seatH = Math.min(0.42, height * 0.5);
  const backH = height - seatH;
  const armW = Math.min(0.15, width * 0.08);
  const seats = Math.max(1, Math.round(width / 0.8));
  const cushW = (width - armW * 2) / seats;
  return (
    <group>
      {/* base */}
      <mesh position={[0, seatH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, seatH, depth]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* encosto */}
      <mesh position={[0, seatH + backH / 2, -depth / 2 + 0.08]} castShadow>
        <boxGeometry args={[width, backH, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* braços */}
      <mesh position={[-width / 2 + armW / 2, seatH + backH * 0.35, 0]} castShadow>
        <boxGeometry args={[armW, backH * 0.7, depth]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[width / 2 - armW / 2, seatH + backH * 0.35, 0]} castShadow>
        <boxGeometry args={[armW, backH * 0.7, depth]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* almofadas */}
      {Array.from({ length: seats }).map((_, i) => (
        <mesh
          key={i}
          position={[-width / 2 + armW + cushW * (i + 0.5), seatH + 0.06, 0.02]}
          castShadow
        >
          <boxGeometry args={[cushW * 0.92, 0.12, depth * 0.85]} />
          <meshStandardMaterial color={p.accent} roughness={1} />
        </mesh>
      ))}
      {/* pés discretos */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (width / 2 - 0.05), 0.04, sz * (depth / 2 - 0.05)]}>
          <cylinderGeometry args={[0.02, 0.02, 0.08, 12]} />
          <meshStandardMaterial color={p.secondary} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Bed({ width, height, depth, color }: DecorProps & { color: string }) {
  const p = PALETTE.cama;
  const mattressH = Math.min(0.28, height * 0.7);
  const headH = Math.max(0.5, height * 1.6);
  return (
    <group>
      {/* colchão */}
      <mesh position={[0, mattressH / 2 + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.98, mattressH, depth * 0.98]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {/* base/box */}
      <mesh position={[0, 0.075, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.15, depth]} />
        <meshStandardMaterial color={p.secondary} roughness={0.9} />
      </mesh>
      {/* cabeceira */}
      <mesh position={[0, headH / 2, -depth / 2 + 0.03]} castShadow>
        <boxGeometry args={[width, headH, 0.06]} />
        <meshStandardMaterial color={p.secondary} roughness={0.85} />
      </mesh>
      {/* travesseiros */}
      <mesh position={[-width * 0.22, mattressH + 0.18, -depth * 0.32]} castShadow>
        <boxGeometry args={[width * 0.36, 0.1, depth * 0.22]} />
        <meshStandardMaterial color={p.accent} roughness={1} />
      </mesh>
      <mesh position={[width * 0.22, mattressH + 0.18, -depth * 0.32]} castShadow>
        <boxGeometry args={[width * 0.36, 0.1, depth * 0.22]} />
        <meshStandardMaterial color={p.accent} roughness={1} />
      </mesh>
    </group>
  );
}

function Table({ width, height, depth, color }: DecorProps & { color: string }) {
  const p = PALETTE.mesa;
  const topT = Math.min(0.04, height * 0.08);
  return (
    <group>
      <mesh position={[0, height - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, topT, depth]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (width / 2 - 0.06), (height - topT) / 2, sz * (depth / 2 - 0.06)]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, height - topT, 16]} />
          <meshStandardMaterial color={p.secondary} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Chair({ width, height, depth, color }: DecorProps & { color: string }) {
  const p = PALETTE.cadeira;
  const seatY = Math.min(0.45, height * 0.5);
  const backH = height - seatY;
  return (
    <group>
      <mesh position={[0, seatY, 0]} castShadow>
        <boxGeometry args={[width, 0.04, depth]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, seatY + backH / 2, -depth / 2 + 0.03]} castShadow>
        <boxGeometry args={[width * 0.9, backH, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (width / 2 - 0.04), seatY / 2, sz * (depth / 2 - 0.04)]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, seatY, 12]} />
          <meshStandardMaterial color={p.secondary} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Armchair(props: DecorProps & { color: string }) {
  // Poltrona = sofá de 1 lugar, com carcaça mais volumosa
  return <Sofa {...props} />;
}

function Shelf({ width, height, depth, color }: DecorProps & { color: string }) {
  const shelves = Math.max(2, Math.floor(height / 0.4));
  const sideT = 0.025;
  return (
    <group>
      {/* laterais + topo + base */}
      <mesh position={[-width / 2 + sideT / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[sideT, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[width / 2 - sideT / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[sideT, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, height - sideT / 2, 0]} castShadow>
        <boxGeometry args={[width, sideT, depth]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, sideT / 2, 0]} castShadow>
        <boxGeometry args={[width, sideT, depth]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* fundo */}
      <mesh position={[0, height / 2, -depth / 2 + 0.005]}>
        <boxGeometry args={[width - sideT * 2, height - sideT * 2, 0.01]} />
        <meshStandardMaterial color={PALETTE.estante.secondary} roughness={0.9} />
      </mesh>
      {/* prateleiras intermediárias */}
      {Array.from({ length: shelves - 1 }).map((_, i) => (
        <mesh key={i} position={[0, ((i + 1) * height) / shelves, 0]} castShadow>
          <boxGeometry args={[width - sideT * 2, 0.02, depth * 0.95]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Sideboard({ width, height, depth, color }: DecorProps & { color: string }) {
  const legH = Math.min(0.12, height * 0.18);
  const bodyH = height - legH;
  return (
    <group>
      <mesh position={[0, legH + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, bodyH, depth]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* fenda das portas */}
      <mesh position={[0, legH + bodyH / 2, depth / 2 + 0.001]}>
        <boxGeometry args={[width * 0.98, bodyH * 0.9, 0.002]} />
        <meshStandardMaterial color={PALETTE.aparador.secondary} roughness={0.5} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (width / 2 - 0.05), legH / 2, sz * (depth / 2 - 0.05)]}>
          <cylinderGeometry args={[0.02, 0.02, legH, 12]} />
          <meshStandardMaterial color={PALETTE.aparador.secondary} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Rug({ width, height, depth, color }: DecorProps & { color: string }) {
  return (
    <mesh position={[0, Math.max(height / 2, 0.005), 0]} receiveShadow>
      <boxGeometry args={[width, Math.max(height, 0.008), depth]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function Curtain({ width, height, depth, color }: DecorProps & { color: string }) {
  // Cortina "ondulada" via 12 pregas cilíndricas encostadas
  const pleats = 14;
  const step = width / pleats;
  return (
    <group>
      {Array.from({ length: pleats }).map((_, i) => (
        <mesh key={i} position={[-width / 2 + step * (i + 0.5), height / 2, 0]} castShadow>
          <cylinderGeometry args={[step * 0.55, step * 0.55, height, 12, 1, false]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
      {/* varão */}
      <mesh position={[0, height + 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, width + 0.2, 12]} />
        <meshStandardMaterial color="#3d3d3d" metalness={0.7} roughness={0.3} />
      </mesh>
      <_ignored depth={depth} />
    </group>
  );
}

function Blind({ width, height, depth, color }: DecorProps & { color: string }) {
  const slats = Math.max(6, Math.floor(height / 0.06));
  const gap = height / slats;
  return (
    <group>
      {Array.from({ length: slats }).map((_, i) => (
        <mesh key={i} position={[0, gap * (i + 0.5), 0]}>
          <boxGeometry args={[width, gap * 0.7, Math.max(depth, 0.015)]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Picture({ width, height, depth, color }: DecorProps & { color: string }) {
  const frame = 0.04;
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, Math.max(depth, 0.03)]} />
        <meshStandardMaterial color={PALETTE.quadro.primary} roughness={0.4} />
      </mesh>
      <mesh position={[0, height / 2, Math.max(depth, 0.03) / 2 + 0.002]}>
        <boxGeometry args={[width - frame * 2, height - frame * 2, 0.002]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Mirror({ width, height, depth, color }: DecorProps & { color: string }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, Math.max(depth, 0.02)]} />
        <meshStandardMaterial color={PALETTE.espelho.secondary} roughness={0.6} />
      </mesh>
      <mesh position={[0, height / 2, Math.max(depth, 0.02) / 2 + 0.002]}>
        <boxGeometry args={[width - 0.06, height - 0.06, 0.003]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0.02} envMapIntensity={1.5} />
      </mesh>
    </group>
  );
}

function PottedPlant({ width, height, depth, color }: DecorProps & { color: string }) {
  const potH = Math.min(0.35, height * 0.28);
  const potR = Math.min(width, depth) / 2 * 0.75;
  const foliageR = Math.min(width, depth) / 2;
  const foliageY = potH + (height - potH) / 2;
  return (
    <group>
      <mesh position={[0, potH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[potR, potR * 0.85, potH, 24]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* folhas — 5 esferas alastradas */}
      {[
        [0, 0, 0],
        [foliageR * 0.4, -foliageR * 0.2, 0],
        [-foliageR * 0.4, -foliageR * 0.1, 0],
        [0, -foliageR * 0.15, foliageR * 0.4],
        [0, foliageR * 0.2, -foliageR * 0.3],
      ].map(([dx, dy, dz], i) => (
        <mesh key={i} position={[dx, foliageY + dy, dz]} castShadow>
          <icosahedronGeometry args={[foliageR * (0.7 + (i % 3) * 0.08), 1]} />
          <meshStandardMaterial color={PALETTE.planta.primary} roughness={0.9} />
        </mesh>
      ))}
      {/* caule sutil */}
      <mesh position={[0, potH + (height - potH) * 0.25, 0]}>
        <cylinderGeometry args={[0.015, 0.02, (height - potH) * 0.5, 8]} />
        <meshStandardMaterial color="#5b4636" roughness={1} />
      </mesh>
    </group>
  );
}

function Plant({ width, height, depth }: DecorProps & { color: string }) {
  const r = Math.min(width, depth) / 2;
  return (
    <group>
      {[
        [0, height * 0.5, 0, 1],
        [r * 0.35, height * 0.62, 0, 0.85],
        [-r * 0.35, height * 0.62, 0, 0.85],
        [0, height * 0.75, r * 0.3, 0.75],
        [0, height * 0.35, -r * 0.3, 0.9],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r * (s as number), 1]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? PALETTE.planta.primary : PALETTE.planta.accent}
            roughness={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloorLamp({ width, height, depth, color }: DecorProps & { color: string }) {
  const baseR = Math.min(width, depth) / 2 * 0.55;
  const shadeH = Math.min(0.35, height * 0.22);
  const shadeR = Math.min(width, depth) / 2 * 0.9;
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[baseR, baseR, 0.04, 24]} />
        <meshStandardMaterial color={PALETTE.luminaria.secondary} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, (height - shadeH) / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, height - shadeH, 12]} />
        <meshStandardMaterial color={PALETTE.luminaria.secondary} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, height - shadeH / 2, 0]} castShadow>
        <cylinderGeometry args={[shadeR * 0.7, shadeR, shadeH, 24, 1, true]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          side={THREE.DoubleSide}
          emissive={PALETTE.luminaria.accent}
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* halo emissivo interno */}
      <mesh position={[0, height - shadeH * 0.6, 0]}>
        <sphereGeometry args={[shadeR * 0.4, 12, 12]} />
        <meshBasicMaterial color={PALETTE.luminaria.accent} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Pendant({ width, height, depth, color }: DecorProps & { color: string }) {
  const r = Math.min(width, depth) / 2;
  const shadeH = Math.min(0.3, height * 0.55);
  return (
    <group>
      {/* fio */}
      <mesh position={[0, height - shadeH / 2 + (height - shadeH) / 2, 0]}>
        <cylinderGeometry args={[0.005, 0.005, height - shadeH, 8]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>
      <mesh position={[0, shadeH / 2 + 0.02, 0]} castShadow>
        <coneGeometry args={[r, shadeH, 24, 1, true]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.2}
          side={THREE.DoubleSide}
          emissive={PALETTE.pendente.accent}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <sphereGeometry args={[r * 0.5, 12, 12]} />
        <meshBasicMaterial color={PALETTE.pendente.accent} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function WallLamp({ width, height, depth, color }: DecorProps & { color: string }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width * 0.3, height * 0.6, Math.max(depth, 0.04)]} />
        <meshStandardMaterial color={PALETTE.arandela.secondary} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2]}>
        <sphereGeometry args={[Math.min(width, height) * 0.3, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          emissive={PALETTE.arandela.accent}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

function Spot({ width, height, depth, color }: DecorProps & { color: string }) {
  const r = Math.min(width, depth) / 2;
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[r, r * 0.9, height, 24]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.002, 0]}>
        <cylinderGeometry args={[r * 0.8, r * 0.8, 0.004, 24]} />
        <meshStandardMaterial
          color={PALETTE.spot.accent}
          emissive={PALETTE.spot.accent}
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

function Books({ width, height, depth, color }: DecorProps & { color: string }) {
  const n = Math.max(2, Math.floor(height / 0.05));
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const palette = [color, PALETTE.livro.secondary, PALETTE.livro.accent, "#274c43"];
        const c = palette[i % palette.length];
        const w = width * (0.85 + (i % 3) * 0.05);
        const d = depth * (0.85 + ((i + 1) % 3) * 0.05);
        return (
          <mesh key={i} position={[0, 0.025 + i * 0.05, 0]} castShadow>
            <boxGeometry args={[w, 0.05, d]} />
            <meshStandardMaterial color={c} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function DecoObject({ width, height, depth, color }: DecorProps & { color: string }) {
  const r = Math.min(width, depth) / 2;
  return (
    <group>
      <mesh position={[0, height * 0.15, 0]} castShadow>
        <cylinderGeometry args={[r * 0.9, r * 0.6, height * 0.3, 24]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, height * 0.65, 0]} castShadow>
        <sphereGeometry args={[r * 0.75, 24, 24]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Marcador consumido só para silenciar TS quando um argumento não é usado.
function _ignored(_: { depth: number }) { return null; }

// -----------------------------------------------------------------------------
// Dispatcher
// -----------------------------------------------------------------------------

export function DecorMesh(props: DecorProps) {
  const color = useMemo(() => props.color ?? PALETTE[props.subtype].primary, [props.color, props.subtype]);
  const full = { ...props, color };
  switch (props.subtype) {
    case "sofa":         return <Sofa {...full} />;
    case "cama":         return <Bed {...full} />;
    case "mesa":         return <Table {...full} />;
    case "cadeira":      return <Chair {...full} />;
    case "poltrona":     return <Armchair {...full} />;
    case "estante":      return <Shelf {...full} />;
    case "aparador":     return <Sideboard {...full} />;
    case "tapete":       return <Rug {...full} />;
    case "cortina":      return <Curtain {...full} />;
    case "persiana":     return <Blind {...full} />;
    case "quadro":       return <Picture {...full} />;
    case "espelho":      return <Mirror {...full} />;
    case "vaso-planta":  return <PottedPlant {...full} />;
    case "planta":       return <Plant {...full} />;
    case "luminaria":    return <FloorLamp {...full} />;
    case "pendente":     return <Pendant {...full} />;
    case "arandela":     return <WallLamp {...full} />;
    case "spot":         return <Spot {...full} />;
    case "livro":        return <Books {...full} />;
    case "objeto-deco":  return <DecoObject {...full} />;
    default:             return null;
  }
}