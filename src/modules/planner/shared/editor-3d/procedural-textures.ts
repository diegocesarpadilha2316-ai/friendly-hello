/**
 * Texturas procedurais do Planner (realismo — camada aditiva).
 *
 * Objetivo: nenhum material do projeto deve renderizar como "cor chapada".
 * Quando a peça não tem textura da Biblioteca Dioris, geramos em canvas
 * um conjunto coerente de mapas (albedo + roughness + normal) que dão
 * micro-variação, veio de madeira, casca de laranja da pintura e reboco
 * das paredes. Tudo é gerado uma única vez e cacheado por chave.
 *
 * Sem dependências novas, sem assets remotos, sem provider novo.
 */
import * as THREE from "three";

export type SurfaceKind = "wood" | "paint" | "wall" | "floor" | "stone";

export interface ProceduralSurface {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  normalScale: number;
}

const cache = new Map<string, ProceduralSurface>();
const SIZE = 512;

function canvas2d(size = SIZE) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function toTexture(c: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Ruído fractal simples e determinístico (valor em 0..1). */
function makeNoise(seed: number) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const grid = 64;
  const values = new Float32Array(grid * grid);
  for (let i = 0; i < values.length; i++) values[i] = rnd();
  const at = (x: number, y: number) =>
    values[(((y % grid) + grid) % grid) * grid + (((x % grid) + grid) % grid)];
  const smooth = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };
  return (x: number, y: number, octaves = 4) => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += smooth(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  };
}

/** Converte um heightmap (0..1) em normal map tangencial. */
function heightToNormal(height: Float32Array, size: number, strength: number) {
  const { c, ctx } = canvas2d(size);
  const img = ctx.createImageData(size, size);
  const h = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function grayscaleCanvas(values: Float32Array, size: number) {
  const { c, ctx } = canvas2d(size);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < values.length; i++) {
    const v = Math.max(0, Math.min(1, values[i])) * 255;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [180, 150, 120];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Gera os três mapas de uma superfície. O albedo parte de cinza neutro
 * (a cor real vem do `color` do material, multiplicado pelo mapa), então
 * o mesmo conjunto serve para qualquer cor de MDF/pintura.
 */
function build(kind: SurfaceKind): ProceduralSurface {
  const size = SIZE;
  const noise = makeNoise(kind.length * 9176 + 31);
  const height = new Float32Array(size * size);
  const rough = new Float32Array(size * size);
  const { c: albedoCanvas, ctx } = canvas2d(size);
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const u = x / size;
      const v = y / size;
      let tint = 1;
      let h = 0.5;
      let r = 0.5;

      if (kind === "wood") {
        const warp = noise(u * 3, v * 22, 4) * 0.35;
        const rings = Math.sin((v * 26 + warp * 10) * Math.PI) * 0.5 + 0.5;
        const fiber = noise(u * 6, v * 180, 3);
        const grain = rings * 0.65 + fiber * 0.35;
        tint = 0.82 + grain * 0.26;
        h = grain;
        r = 0.62 + (1 - grain) * 0.22;
      } else if (kind === "paint") {
        const n = noise(u * 90, v * 90, 3);
        tint = 0.965 + n * 0.05;
        h = n;
        r = 0.28 + n * 0.12;
      } else if (kind === "wall") {
        const n = noise(u * 42, v * 42, 5);
        const fine = noise(u * 200, v * 200, 2);
        tint = 0.93 + n * 0.09 + fine * 0.02;
        h = n * 0.7 + fine * 0.3;
        r = 0.86 + n * 0.1;
      } else if (kind === "floor") {
        const plank = Math.floor(v * 6);
        const inPlank = v * 6 - plank;
        const jointV = inPlank < 0.02 || inPlank > 0.98 ? 1 : 0;
        const offset = (plank % 2) * 0.5;
        const along = (u + offset) % 1;
        const jointH = along < 0.008 || along > 0.992 ? 1 : 0;
        const joint = Math.max(jointV, jointH);
        const fiber = noise((u + offset) * 8 + plank * 13, v * 120, 4);
        const shade = 0.88 + ((plank * 37) % 11) / 90 + fiber * 0.16;
        tint = joint ? shade * 0.55 : shade;
        h = joint ? 0 : 0.4 + fiber * 0.6;
        r = joint ? 0.95 : 0.34 + fiber * 0.16;
      } else {
        const base = noise(u * 10, v * 10, 5);
        const vein = Math.abs(Math.sin((u * 4 + base * 3) * Math.PI * 1.5));
        const streak = Math.pow(1 - vein, 14);
        tint = 0.9 + base * 0.08 + streak * 0.18;
        h = base * 0.5 + streak * 0.5;
        r = 0.22 + base * 0.12 - streak * 0.06;
      }

      height[i] = h;
      rough[i] = Math.max(0.05, Math.min(1, r));
      const g = Math.max(0, Math.min(255, Math.round(255 * tint)));
      img.data[i * 4] = g;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = g;
      img.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const strength = kind === "wall" ? 3.2 : kind === "wood" ? 2.4 : kind === "floor" ? 4 : 1.4;
  return {
    map: toTexture(albedoCanvas, true),
    normalMap: toTexture(heightToNormal(height, size, strength), false),
    roughnessMap: toTexture(grayscaleCanvas(rough, size), false),
    normalScale: kind === "paint" ? 0.25 : kind === "wall" ? 0.55 : 0.7,
  };
}

/** Superfície procedural cacheada. Retorna `null` fora do browser (SSR). */
export function getProceduralSurface(kind: SurfaceKind): ProceduralSurface | null {
  if (typeof document === "undefined") return null;
  const hit = cache.get(kind);
  if (hit) return hit;
  const built = build(kind);
  cache.set(kind, built);
  return built;
}

/**
 * Deduz a superfície provável a partir do id/nome do material e do papel
 * da peça na cena. Heurística tolerante — nunca lança.
 */
export function inferSurfaceKind(
  role: "wall" | "floor" | "ceiling" | "furniture",
  materialId?: string,
  colorHex?: string,
): SurfaceKind {
  const id = (materialId ?? "").toLowerCase();
  if (/marmore|marble|granito|quartzo|quartz|silestone|pedra|stone/.test(id)) return "stone";
  if (/madeira|wood|carvalho|oak|freijo|nogueira|walnut|louro|amendoa|ipe|cedro|noce|teka/.test(id))
    return "wood";
  if (/laca|lacca|pintur|paint|gloss|fosco|matte|acetinad/.test(id)) return "paint";
  if (/porcelanato|piso|ceramic|tile|vinil|laminado/.test(id)) return "floor";
  if (role === "wall" || role === "ceiling") return "wall";
  if (role === "floor") return "floor";
  if (colorHex) {
    const [r, g, b] = hexToRgb(colorHex);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const isNeutral = max - min < 26;
    if (isNeutral && (max > 205 || max < 70)) return "paint";
  }
  return "wood";
}

/** Escala de repetição em metros por tipo de superfície. */
export function surfaceTileMeters(kind: SurfaceKind): number {
  switch (kind) {
    case "wall":
      return 2.2;
    case "floor":
      return 1.6;
    case "stone":
      return 1.8;
    case "paint":
      return 0.6;
    default:
      return 1.1;
  }
}
