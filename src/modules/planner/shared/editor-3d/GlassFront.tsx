/**
 * Frente de vidro PBR para móveis do Planner (Parte 5).
 *
 * Renderiza um painel fino de vidro (transmission + IOR) grudado na face
 * frontal (+Z) do móvel. Quando o `variant` é "reeded", aplica um normal
 * map procedural (canaletas verticais) para o efeito canelado clássico.
 *
 * Componente puro — nada persiste, tudo memoizado. Reutiliza os
 * descritores paramétricos existentes (`FurnitureDescriptor`).
 */
import { useMemo } from "react";
import * as THREE from "three";

/** Gera (uma única vez) um normal map de canaletas verticais. */
function useReededNormalMap(): THREE.Texture {
  return useMemo(() => {
    const w = 256;
    const h = 8;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.Texture();
    const img = ctx.createImageData(w, h);
    // Perfil senoidal em X → deriva do vidro canelado real.
    // Normal.x = -dY/dX (derivada da altura), Y = 0, Z ≈ 1 (fora do sulco).
    const ridges = 32; // ranhuras no wrap horizontal
    for (let x = 0; x < w; x++) {
      const t = (x / w) * ridges * Math.PI * 2;
      // derivada normalizada em [-1, 1]
      const nx = Math.cos(t);
      const nz = Math.max(0.15, 1 - Math.abs(nx) * 0.65);
      // codifica normal em RGB (0.5 = 0, 1 = +1, 0 = -1)
      const r = Math.round((nx * 0.5 + 0.5) * 255);
      const g = 128; // Y neutro
      const b = Math.round(nz * 255);
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

interface GlassFrontProps {
  /** Largura do móvel (m) — largura da porta de vidro. */
  width: number;
  /** Altura do móvel (m) — altura da porta. */
  height: number;
  /** Profundidade — usada só para posicionar a frente em Z. */
  depth: number;
  variant: "vidro" | "reeded";
  tint?: string;
}

export function GlassFront({ width, height, depth, variant, tint }: GlassFrontProps) {
  const normalMap = useReededNormalMap();
  // Escala do wrap: quanto maior a porta, mais ranhuras — mantém pitch
  // real ~15mm por canalete, típico do vidro reeded comercial.
  const repeatX = useMemo(() => Math.max(8, Math.round(width / 0.015 / 32)), [width]);

  return (
    <mesh position={[0, 0, depth / 2 + 0.005]} castShadow receiveShadow>
      <boxGeometry args={[width * 0.98, height * 0.98, 0.004]} />
      <meshPhysicalMaterial
        color={tint ?? (variant === "reeded" ? "#dceaf0" : "#e8f2ff")}
        roughness={variant === "reeded" ? 0.25 : 0.03}
        metalness={0}
        transmission={variant === "reeded" ? 0.75 : 0.95}
        thickness={0.02}
        ior={1.52}
        attenuationDistance={0.6}
        clearcoat={0.4}
        clearcoatRoughness={0.05}
        transparent
        opacity={0.98}
        side={THREE.DoubleSide}
        {...(variant === "reeded"
          ? {
              normalMap,
              normalScale: new THREE.Vector2(1.4, 1.4),
              "normalMap-repeat-x": repeatX,
              "normalMap-repeat-y": 1,
              "normalMap-wrapS": THREE.RepeatWrapping,
              "normalMap-wrapT": THREE.RepeatWrapping,
            }
          : {})}
      />
    </mesh>
  );
}

export default GlassFront;