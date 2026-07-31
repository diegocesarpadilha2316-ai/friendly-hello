/**
 * RODAPÉS DE COZINHA — catálogo declarativo.
 * A chapa/perfil é sempre o componente `rodape` da Biblioteca Construtiva.
 */
export type PlinthKind = "pvc" | "aluminio" | "madeira" | "recuado" | "espelhado" | "nenhum";

export interface PlinthProfileDef {
  readonly id: PlinthKind;
  readonly label: string;
  readonly heightMm: number;
  /** Recuo em relação à frente (pé-palito visual). */
  readonly recessMm: number;
  readonly finishId: string;
  readonly removable: boolean;
}

export const PLINTHS: Readonly<Record<PlinthKind, PlinthProfileDef>> = {
  pvc: { id: "pvc", label: "Rodapé PVC", heightMm: 100, recessMm: 50, finishId: "pvc-preto", removable: true },
  aluminio: { id: "aluminio", label: "Rodapé alumínio", heightMm: 100, recessMm: 50, finishId: "aluminio-anodizado", removable: true },
  madeira: { id: "madeira", label: "Rodapé em MDF", heightMm: 150, recessMm: 40, finishId: "branco-tx", removable: true },
  recuado: { id: "recuado", label: "Recuado (pé-palito)", heightMm: 150, recessMm: 90, finishId: "preto-tx", removable: false },
  espelhado: { id: "espelhado", label: "Rodapé espelhado", heightMm: 100, recessMm: 50, finishId: "espelho-prata", removable: true },
  nenhum: { id: "nenhum", label: "Sem rodapé", heightMm: 0, recessMm: 0, finishId: "", removable: false },
};

export interface KitchenPlinth {
  readonly kind: PlinthKind;
  readonly heightMm: number;
  readonly recessMm: number;
  readonly finishId: string;
  readonly removable: boolean;
}

function kindOf(value: unknown): PlinthKind {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (k in PLINTHS) return k as PlinthKind;
  if (/aluminio|metal/.test(k)) return "aluminio";
  if (/mdf|madeira/.test(k)) return "madeira";
  if (/recuad|palito|flutuant/.test(k)) return "recuado";
  if (/espelh/.test(k)) return "espelhado";
  if (/sem|nenhum|none/.test(k)) return "nenhum";
  return "pvc";
}

function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function normalizePlinth(
  input: Partial<KitchenPlinth> | undefined,
  enabled = true,
): KitchenPlinth {
  const kind = enabled ? kindOf(input?.kind) : "nenhum";
  const def = PLINTHS[kind];
  return {
    kind,
    heightMm: kind === "nenhum" ? 0 : clampNum(input?.heightMm, def.heightMm, 40, 300),
    recessMm: kind === "nenhum" ? 0 : clampNum(input?.recessMm, def.recessMm, 0, 150),
    finishId: input?.finishId ?? def.finishId,
    removable: input?.removable ?? def.removable,
  };
}

export function listPlinths(): readonly PlinthProfileDef[] {
  return Object.values(PLINTHS).filter((p) => p.id !== "nenhum");
}