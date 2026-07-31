/**
 * TAMPOS DE COZINHA — catálogo declarativo.
 *
 * Só metadados: material, espessura, saliência e acabamento. A chapa em si
 * é sempre o componente `tampo` da Biblioteca Construtiva.
 */
export type CountertopMaterial =
  | "granito"
  | "quartzo"
  | "porcelanato"
  | "marmore"
  | "pedra-sinterizada"
  | "madeira"
  | "inox"
  | "laminado"
  | "vidro"
  | "nenhum";

export interface CountertopProfileDef {
  readonly id: CountertopMaterial;
  readonly label: string;
  /** Espessura típica do tampo acabado (mm). */
  readonly thicknessMm: number;
  /** Saliência frontal padrão (mm). */
  readonly overhangFrontMm: number;
  /** Acabamento usado no render/produção. */
  readonly finishId: string;
  /** Aceita cuba/cooktop embutidos. */
  readonly acceptsCutout: boolean;
}

export const COUNTERTOPS: Readonly<Record<CountertopMaterial, CountertopProfileDef>> = {
  granito: { id: "granito", label: "Granito", thicknessMm: 20, overhangFrontMm: 20, finishId: "granito-preto-sg", acceptsCutout: true },
  quartzo: { id: "quartzo", label: "Quartzo", thicknessMm: 20, overhangFrontMm: 20, finishId: "quartzo-branco", acceptsCutout: true },
  porcelanato: { id: "porcelanato", label: "Porcelanato", thicknessMm: 12, overhangFrontMm: 15, finishId: "porcelanato-calacata", acceptsCutout: true },
  marmore: { id: "marmore", label: "Mármore", thicknessMm: 20, overhangFrontMm: 20, finishId: "marmore-carrara", acceptsCutout: true },
  "pedra-sinterizada": { id: "pedra-sinterizada", label: "Pedra sinterizada", thicknessMm: 12, overhangFrontMm: 15, finishId: "dekton-cinza", acceptsCutout: true },
  madeira: { id: "madeira", label: "Madeira maciça", thicknessMm: 30, overhangFrontMm: 25, finishId: "freijo-natural", acceptsCutout: true },
  inox: { id: "inox", label: "Inox", thicknessMm: 15, overhangFrontMm: 10, finishId: "inox-escovado", acceptsCutout: true },
  laminado: { id: "laminado", label: "Laminado pós-formado", thicknessMm: 38, overhangFrontMm: 20, finishId: "laminado-branco", acceptsCutout: false },
  vidro: { id: "vidro", label: "Vidro temperado", thicknessMm: 10, overhangFrontMm: 10, finishId: "vidro-incolor", acceptsCutout: true },
  nenhum: { id: "nenhum", label: "Sem tampo", thicknessMm: 0, overhangFrontMm: 0, finishId: "", acceptsCutout: false },
};

export interface KitchenCountertop {
  readonly material: CountertopMaterial;
  readonly thicknessMm: number;
  readonly overhangFrontMm: number;
  readonly overhangSideMm: number;
  /** Rodabanca (frontão) atrás do tampo. */
  readonly backsplashMm: number;
  readonly finishId: string;
  /** Recorte de cuba/cooktop no tampo deste módulo. */
  readonly cutout: "nenhum" | "cuba" | "cooktop";
}

function material(value: unknown): CountertopMaterial {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (k in COUNTERTOPS) return k as CountertopMaterial;
  if (/silestone|quartz/.test(k)) return "quartzo";
  if (/dekton|sinteriz/.test(k)) return "pedra-sinterizada";
  if (/marmore|carrara/.test(k)) return "marmore";
  if (/porcelan/.test(k)) return "porcelanato";
  if (/madeira|freijo|carvalho/.test(k)) return "madeira";
  if (/inox|aco/.test(k)) return "inox";
  if (/laminad|formica|postform/.test(k)) return "laminado";
  if (/vidro|temperad|cristal/.test(k)) return "vidro";
  if (/sem|nenhum|none/.test(k)) return "nenhum";
  return "granito";
}

function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Preenche o tampo. `enabled=false` devolve explicitamente "nenhum". */
export function normalizeCountertop(
  input: Partial<KitchenCountertop> | undefined,
  enabled = true,
): KitchenCountertop {
  const mat = enabled ? material(input?.material) : "nenhum";
  const def = COUNTERTOPS[mat];
  return {
    material: mat,
    thicknessMm: mat === "nenhum" ? 0 : clampNum(input?.thicknessMm, def.thicknessMm, 8, 60),
    overhangFrontMm: mat === "nenhum" ? 0 : clampNum(input?.overhangFrontMm, def.overhangFrontMm, 0, 120),
    overhangSideMm: mat === "nenhum" ? 0 : clampNum(input?.overhangSideMm, 0, 0, 120),
    backsplashMm: mat === "nenhum" ? 0 : clampNum(input?.backsplashMm, 0, 0, 600),
    finishId: input?.finishId ?? def.finishId,
    cutout: input?.cutout ?? "nenhum",
  };
}

export function listCountertops(): readonly CountertopProfileDef[] {
  return Object.values(COUNTERTOPS).filter((c) => c.id !== "nenhum");
}