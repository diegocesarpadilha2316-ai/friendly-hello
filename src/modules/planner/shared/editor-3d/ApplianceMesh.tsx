/**
 * Modelos procedurais para eletrodomésticos e hidráulica.
 * Cobre o gap identificado na auditoria: geladeira, fogão, cooktop, forno,
 * microondas, coifa, lava-louças, lava-roupas, cuba e torneira — que antes
 * caíam no fallback de caixa lisa. Cada modelo é uma silhueta reconhecível
 * em primitivas Three.js, com materiais PBR (inox escovado, vidro fosco).
 */
import * as THREE from "three";

export type ApplianceSubtype =
  | "geladeira"
  | "frigobar"
  | "fogao"
  | "cooktop"
  | "forno"
  | "microondas"
  | "coifa"
  | "depurador"
  | "exaustor"
  | "lava-loucas"
  | "lava-roupas"
  | "lavadora"
  | "cuba"
  | "pia"
  | "torneira"
  | "misturador";

const APPLIANCE_SUBTYPES = new Set<ApplianceSubtype>([
  "geladeira",
  "frigobar",
  "fogao",
  "cooktop",
  "forno",
  "microondas",
  "coifa",
  "depurador",
  "exaustor",
  "lava-loucas",
  "lava-roupas",
  "lavadora",
  "cuba",
  "pia",
  "torneira",
  "misturador",
]);

export function isApplianceSubtype(s: string | undefined): s is ApplianceSubtype {
  return !!s && APPLIANCE_SUBTYPES.has(s as ApplianceSubtype);
}

interface ApplianceProps {
  subtype: ApplianceSubtype;
  width: number;
  height: number;
  depth: number;
  color?: string;
  selected?: boolean;
}

// Materiais base
const INOX = { color: "#c8ccd1", roughness: 0.35, metalness: 0.85 } as const;
const INOX_DARK = { color: "#6b7280", roughness: 0.4, metalness: 0.75 } as const;
const GLASS_BLACK = { color: "#111318", roughness: 0.15, metalness: 0.4 } as const;
const RUBBER = { color: "#1a1c22", roughness: 0.85, metalness: 0.05 } as const;
const CERAMIC = { color: "#f4f5f7", roughness: 0.25, metalness: 0.05 } as const;
const CHROME = { color: "#e8ecef", roughness: 0.1, metalness: 0.95 } as const;

export function ApplianceMesh({
  subtype,
  width: w,
  height: h,
  depth: d,
  color,
  selected,
}: ApplianceProps) {
  const outline = selected ? "#7c3aed" : undefined;

  switch (subtype) {
    case "geladeira":
    case "frigobar":
      return <Fridge w={w} h={h} d={d} color={color} outline={outline} />;
    case "fogao":
      return <Range w={w} h={h} d={d} outline={outline} />;
    case "cooktop":
      return <Cooktop w={w} h={h} d={d} outline={outline} />;
    case "forno":
    case "microondas":
      return <Oven w={w} h={h} d={d} outline={outline} />;
    case "coifa":
    case "depurador":
    case "exaustor":
      return <Hood w={w} h={h} d={d} outline={outline} />;
    case "lava-loucas":
    case "lava-roupas":
    case "lavadora":
      return <Washer w={w} h={h} d={d} outline={outline} />;
    case "cuba":
    case "pia":
      return <Sink w={w} h={h} d={d} outline={outline} />;
    case "torneira":
    case "misturador":
      return <Faucet h={h} outline={outline} />;
    default:
      return null;
  }
}

// --- Geladeira: duas portas + puxadores verticais + rodapé ---------------
function Fridge({
  w,
  h,
  d,
  color,
  outline,
}: {
  w: number;
  h: number;
  d: number;
  color?: string;
  outline?: string;
}) {
  const body = color ?? INOX.color;
  const doorGap = 0.008;
  const doorH = h * 0.55;
  const freezerH = h * 0.4;
  return (
    <group position={[0, h / 2, 0]}>
      {/* Corpo */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={body} roughness={INOX.roughness} metalness={INOX.metalness} />
      </mesh>
      {/* Porta refrigerador */}
      <mesh position={[0, freezerH / 2 + doorGap, d / 2 + 0.005]} castShadow>
        <boxGeometry args={[w - 0.02, doorH, 0.01]} />
        <meshStandardMaterial color={body} roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Porta freezer */}
      <mesh position={[0, -h / 2 + freezerH / 2, d / 2 + 0.005]} castShadow>
        <boxGeometry args={[w - 0.02, freezerH - doorGap, 0.01]} />
        <meshStandardMaterial color={body} roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Puxadores cromados */}
      <mesh position={[w / 2 - 0.05, freezerH / 2 + doorH / 2 - 0.05, d / 2 + 0.02]}>
        <cylinderGeometry args={[0.012, 0.012, doorH * 0.6, 16]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <mesh position={[w / 2 - 0.05, -h / 2 + freezerH * 0.5, d / 2 + 0.02]}>
        <cylinderGeometry args={[0.012, 0.012, freezerH * 0.5, 16]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {outline && <BoxOutline w={w} h={h} d={d} color={outline} />}
    </group>
  );
}

// --- Fogão: base + boca dupla vidro + forno com visor -----------------------
function Range({ w, h, d, outline }: { w: number; h: number; d: number; outline?: string }) {
  return (
    <group position={[0, h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...INOX} />
      </mesh>
      {/* Mesa vidro preto (topo) */}
      <mesh position={[0, h / 2 + 0.001, 0]} castShadow>
        <boxGeometry args={[w - 0.02, 0.005, d - 0.02]} />
        <meshStandardMaterial {...GLASS_BLACK} />
      </mesh>
      {/* Bocas (4 discos) */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * w * 0.22, h / 2 + 0.004, sz * d * 0.22]}>
          <cylinderGeometry args={[Math.min(w, d) * 0.08, Math.min(w, d) * 0.08, 0.003, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
      {/* Porta forno com visor */}
      <mesh position={[0, -h * 0.15, d / 2 + 0.006]} castShadow>
        <boxGeometry args={[w - 0.04, h * 0.55, 0.008]} />
        <meshStandardMaterial {...INOX} />
      </mesh>
      <mesh position={[0, -h * 0.15, d / 2 + 0.012]}>
        <boxGeometry args={[w * 0.7, h * 0.35, 0.002]} />
        <meshStandardMaterial {...GLASS_BLACK} />
      </mesh>
      {/* Puxador */}
      <mesh position={[0, h * 0.12, d / 2 + 0.03]}>
        <cylinderGeometry args={[0.01, 0.01, w * 0.5, 16]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {outline && <BoxOutline w={w} h={h} d={d} color={outline} />}
    </group>
  );
}

// --- Cooktop: chapa vidro preto embutida ------------------------------------
function Cooktop({ w, h, d, outline }: { w: number; h: number; d: number; outline?: string }) {
  return (
    <group position={[0, h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...GLASS_BLACK} />
      </mesh>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * w * 0.25, h / 2 + 0.001, sz * d * 0.22]}>
          <cylinderGeometry args={[Math.min(w, d) * 0.09, Math.min(w, d) * 0.09, 0.002, 32]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {outline && <BoxOutline w={w} h={h} d={d} color={outline} />}
    </group>
  );
}

// --- Forno / microondas embutido -------------------------------------------
function Oven({ w, h, d, outline }: { w: number; h: number; d: number; outline?: string }) {
  return (
    <group position={[0, h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...INOX} />
      </mesh>
      {/* Visor grande */}
      <mesh position={[0, 0, d / 2 + 0.006]} castShadow>
        <boxGeometry args={[w * 0.75, h * 0.6, 0.005]} />
        <meshStandardMaterial {...GLASS_BLACK} />
      </mesh>
      {/* Painel controle */}
      <mesh position={[0, h * 0.4, d / 2 + 0.006]}>
        <boxGeometry args={[w * 0.9, h * 0.12, 0.004]} />
        <meshStandardMaterial color="#0f1115" roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Puxador */}
      <mesh position={[0, -h * 0.35, d / 2 + 0.03]}>
        <cylinderGeometry args={[0.01, 0.01, w * 0.6, 16]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {outline && <BoxOutline w={w} h={h} d={d} color={outline} />}
    </group>
  );
}

// --- Coifa: campânula trapezoidal + duto ------------------------------------
function Hood({ w, h, d, outline }: { w: number; h: number; d: number; outline?: string }) {
  const bodyH = h * 0.45;
  const ductH = h * 0.55;
  return (
    <group position={[0, h / 2, 0]}>
      {/* Campânula */}
      <mesh position={[0, -h / 2 + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, d]} />
        <meshStandardMaterial {...INOX} />
      </mesh>
      {/* Duto */}
      <mesh position={[0, -h / 2 + bodyH + ductH / 2, 0]} castShadow>
        <boxGeometry args={[w * 0.4, ductH, d * 0.4]} />
        <meshStandardMaterial {...INOX} />
      </mesh>
      {/* Filtro inferior (grade) */}
      <mesh position={[0, -h / 2 + 0.008, 0]}>
        <boxGeometry args={[w * 0.9, 0.008, d * 0.85]} />
        <meshStandardMaterial {...INOX_DARK} />
      </mesh>
      {outline && <BoxOutline w={w} h={h} d={d} color={outline} />}
    </group>
  );
}

// --- Lava-louças / Lava-roupas ---------------------------------------------
function Washer({ w, h, d, outline }: { w: number; h: number; d: number; outline?: string }) {
  return (
    <group position={[0, h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...INOX} />
      </mesh>
      {/* Painel superior */}
      <mesh position={[0, h * 0.42, d / 2 + 0.006]}>
        <boxGeometry args={[w * 0.95, h * 0.12, 0.005]} />
        <meshStandardMaterial color="#0f1115" roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Porta com visor circular */}
      <mesh position={[0, -h * 0.08, d / 2 + 0.005]} castShadow>
        <boxGeometry args={[w - 0.02, h * 0.75, 0.01]} />
        <meshStandardMaterial {...INOX} />
      </mesh>
      <mesh position={[0, -h * 0.08, d / 2 + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[Math.min(w, h) * 0.28, Math.min(w, h) * 0.28, 0.004, 32]} />
        <meshStandardMaterial {...GLASS_BLACK} />
      </mesh>
      {outline && <BoxOutline w={w} h={h} d={d} color={outline} />}
    </group>
  );
}

// --- Cuba/pia ---------------------------------------------------------------
function Sink({ w, h, d, outline }: { w: number; h: number; d: number; outline?: string }) {
  const rim = 0.02;
  const wall = 0.015;
  const basinH = Math.max(0.08, h * 0.7);
  return (
    <group position={[0, h / 2, 0]}>
      {/* Aba superior */}
      <mesh position={[0, h / 2 - rim / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, rim, d]} />
        <meshStandardMaterial {...INOX} />
      </mesh>
      {/* Paredes da cuba */}
      {[
        { p: [0, -basinH / 2 + rim / 2, d / 2 - wall / 2], s: [w - 2 * wall, basinH, wall] },
        { p: [0, -basinH / 2 + rim / 2, -d / 2 + wall / 2], s: [w - 2 * wall, basinH, wall] },
        { p: [w / 2 - wall / 2, -basinH / 2 + rim / 2, 0], s: [wall, basinH, d] },
        { p: [-w / 2 + wall / 2, -basinH / 2 + rim / 2, 0], s: [wall, basinH, d] },
      ].map((seg, i) => (
        <mesh key={i} position={seg.p as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={seg.s as [number, number, number]} />
          <meshStandardMaterial {...INOX} />
        </mesh>
      ))}
      {/* Fundo */}
      <mesh position={[0, -basinH + rim / 2 + 0.005, 0]} receiveShadow>
        <boxGeometry args={[w - 2 * wall, 0.005, d - 2 * wall]} />
        <meshStandardMaterial color="#a8adb3" roughness={0.4} metalness={0.7} />
      </mesh>
      {outline && <BoxOutline w={w} h={h} d={d} color={outline} />}
    </group>
  );
}

// --- Torneira/misturador (gooseneck) ---------------------------------------
function Faucet({ h, outline }: { h: number; outline?: string }) {
  const base = 0.04;
  const shaftH = Math.max(0.15, h * 0.7);
  const armLen = Math.max(0.12, h * 0.55);
  return (
    <group>
      {/* Base */}
      <mesh position={[0, base / 2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, base, 24]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* Haste vertical */}
      <mesh position={[0, base + shaftH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, shaftH, 24]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* Braço curvo (gooseneck) — arco em torus */}
      <mesh position={[armLen / 2, base + shaftH, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[armLen / 2, 0.012, 12, 24, Math.PI]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* Bico */}
      <mesh position={[armLen, base + shaftH * 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.02, 0.04, 20]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* Alavanca */}
      <mesh position={[0, base + shaftH * 0.5, 0.03]} rotation={[Math.PI / 4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 16]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {outline && (
        <mesh position={[armLen / 2, base + shaftH / 2, 0]}>
          <boxGeometry args={[armLen + 0.06, shaftH + base, 0.06]} />
          <meshBasicMaterial color={outline} wireframe />
        </mesh>
      )}
    </group>
  );
}

// --- Utilitário: contorno de seleção ---------------------------------------
function BoxOutline({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  return (
    <mesh>
      <boxGeometry args={[w * 1.01, h * 1.01, d * 1.01]} />
      <meshBasicMaterial color={color} wireframe />
    </mesh>
  );
}

void THREE;
