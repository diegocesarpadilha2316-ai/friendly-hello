/**
 * resolvePaint — helper único que traduz um rótulo humano de cor/madeira
 * (ex.: "Preto Absoluto", "Louro Freijó", "carvalho", "off white") em um
 * material PBR real (`materialId`) + cor hex de fallback.
 *
 * A IA/tools chamam este helper sempre que o usuário pede uma cor/acabamento,
 * garantindo que o viewport 3D reflita exatamente o que foi pedido — o
 * Scene3D lê `materialId` (aplica textura PBR) OU `params.__color` (hex
 * bruto) como fallback.
 */
import { findPbrMaterialByLabel } from "@/modules/planner/shared/materials/pbr-catalog";

export interface ResolvedPaint {
  /** Rótulo canônico legível (ex.: "Preto Absoluto"). */
  label: string;
  /** ID do material PBR quando encontrado no catálogo, senão undefined. */
  materialId?: string;
  /** Cor hex sempre presente — usada como fallback pelo overrideColor. */
  colorHex: string;
}

// Cores custom não-catalogadas (aliases → hex) para casos que a IA pede
// sem que exista PBR correspondente. Complementa o findPbrMaterialByLabel.
const NAMED_HEX: Record<string, string> = {
  preto: "#181818",
  "preto absoluto": "#181818",
  branco: "#f4f2ee",
  "branco tx": "#f4f2ee",
  "off white": "#ece7dc",
  grafite: "#3a3d42",
  cinza: "#a8adb2",
  freijo: "#a67549",
  "louro freijo": "#b8895a",
  carvalho: "#c9a074",
  nogueira: "#5d3a1f",
  cumaru: "#7a4a24",
  imbuia: "#4a2c18",
  amendoa: "#c6a684",
  areia: "#d9c7a7",
  ipe: "#8a5a2b",
  fendi: "#8f8579",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Recebe um rótulo humano e devolve o par (materialId + colorHex) real.
 * Se nada bater, devolve um cinza neutro para não deixar o móvel invisível.
 */
export function resolvePaint(input: string | null | undefined): ResolvedPaint | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const key = normalize(raw);

  // 1) Match direto no catálogo PBR (mesma lógica usada por applyFinishing)
  const pbr = findPbrMaterialByLabel(raw);
  if (pbr) {
    return {
      label: (pbr.pattern ?? pbr.name) as string,
      materialId: pbr.id,
      colorHex: pbr.colorHex,
    };
  }

  // 2) Alias humano → hex (sem PBR)
  for (const [alias, hex] of Object.entries(NAMED_HEX)) {
    if (key === alias || key.includes(alias) || alias.includes(key)) {
      return { label: raw, colorHex: hex };
    }
  }

  // 3) Hex direto ("#abc" ou "#aabbcc")
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) {
    return { label: raw, colorHex: raw };
  }

  return null;
}