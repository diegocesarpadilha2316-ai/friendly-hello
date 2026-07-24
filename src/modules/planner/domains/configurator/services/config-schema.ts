import type { PlannerParametricNode } from "@/modules/planner/shared";
import type { ConfiguratorField, ConfiguratorSchema } from "../types";

const MATERIALS = [
  "MDF Branco",
  "MDF Preto",
  "MDF Cinza",
  "MDF Carvalho",
  "MDF Freijó",
  "MDF Nogal",
  "Compensado Naval",
  "Melamínico",
] as const;

const FINISHES = ["Fosco", "Acetinado", "Semi-brilho", "Alto brilho", "Texturizado"] as const;
const HARDWARE_BRANDS = ["Blum", "Hettich", "Häfele", "FGV", "Salice"] as const;
const HANDLE_TYPES = ["Sem puxador", "Cava", "Barra", "Perfil Gola", "Push"] as const;
const HINGE_TYPES = ["Comum", "Soft-close", "Blumotion", "Push-to-open"] as const;
const SLIDE_TYPES = ["Telescópica", "Soft-close", "Servo-drive", "Tandem"] as const;

function num(
  key: string,
  label: string,
  value: number,
  group: ConfiguratorField["group"],
  opts?: { min?: number; max?: number; step?: number; unit?: string; hint?: string },
): ConfiguratorField {
  return { key, label, kind: "number", value, group, ...(opts ?? {}) };
}
function bool(key: string, label: string, value: boolean, group: ConfiguratorField["group"], hint?: string): ConfiguratorField {
  return { key, label, kind: "boolean", value, group, hint };
}
function sel(key: string, label: string, value: string, options: readonly string[], group: ConfiguratorField["group"]): ConfiguratorField {
  return { key, label, kind: "select", value, options, group };
}

function toNum(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}
function toBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function toStr(v: unknown, fallback: string): string {
  return typeof v === "string" && v ? v : fallback;
}

/**
 * Deriva o schema completo do configurador a partir de qualquer módulo.
 * Todos os defaults são lidos dos params atuais — nada é escrito.
 */
export function buildConfiguratorSchema(node: PlannerParametricNode): ConfiguratorSchema {
  const p = node.params;
  const fields: ConfiguratorField[] = [
    // Medidas
    num("width", "Largura", toNum(p.width, 800), "medidas", { min: 100, max: 5000, step: 10, unit: "mm" }),
    num("height", "Altura", toNum(p.height, 2100), "medidas", { min: 100, max: 3200, step: 10, unit: "mm" }),
    num("depth", "Profundidade", toNum(p.depth, 600), "medidas", { min: 100, max: 1200, step: 10, unit: "mm" }),
    num("thickness", "Espessura", toNum(p.thickness, 18), "medidas", { min: 3, max: 40, step: 1, unit: "mm" }),

    // Estrutura
    num("dividers", "Divisórias", toNum(p.dividers, 1), "estrutura", { min: 0, max: 10, step: 1 }),
    num("shelves", "Prateleiras", toNum(p.shelves, 3), "estrutura", { min: 0, max: 20, step: 1 }),
    num("niches", "Nichos", toNum(p.niches, 0), "estrutura", { min: 0, max: 20, step: 1 }),
    bool("plinth", "Rodapé", toBool(p.plinth, true), "estrutura"),
    bool("feet", "Pés", toBool(p.feet, false), "estrutura"),
    bool("base", "Base fechada", toBool(p.base, true), "estrutura"),
    bool("back", "Fundo", toBool(p.back, true), "estrutura"),
    bool("panel", "Painel", toBool(p.panel, false), "estrutura"),
    bool("slatted", "Ripado", toBool(p.slatted, false), "estrutura"),

    // Portas
    num("doors", "Quantidade de portas", toNum(p.doors, 2), "portas", { min: 0, max: 12, step: 1 }),
    num("doorsOpenPct", "Abertura (%)", toNum(p.doorsOpenPct, 0), "portas", { min: 0, max: 100, step: 5, unit: "%" }),
    sel("handle", "Puxador", toStr(p.handle, "Cava"), HANDLE_TYPES, "portas"),
    sel("hinges", "Dobradiça", toStr(p.hinges, "Soft-close"), HINGE_TYPES, "portas"),

    // Gavetas
    num("drawers", "Quantidade de gavetas", toNum(p.drawers, 0), "gavetas", { min: 0, max: 12, step: 1 }),
    num("drawersOpenPct", "Abertura (%)", toNum(p.drawersOpenPct, 0), "gavetas", { min: 0, max: 100, step: 5, unit: "%" }),
    sel("slides", "Corrediça", toStr(p.slides, "Soft-close"), SLIDE_TYPES, "gavetas"),
    bool("dampers", "Amortecedores", toBool(p.dampers, true), "gavetas"),

    // Ferragens
    sel("hardwareBrand", "Marca", toStr(p.hardwareBrand, "Blum"), HARDWARE_BRANDS, "ferragens"),

    // Iluminação
    bool("led", "LED integrado", toBool(p.led, false), "iluminacao"),
    num("ledTempK", "Temperatura de cor", toNum(p.ledTempK, 3000), "iluminacao", { min: 2700, max: 6500, step: 100, unit: "K" }),
    num("ledLumens", "Fluxo luminoso", toNum(p.ledLumens, 800), "iluminacao", { min: 100, max: 5000, step: 50, unit: "lm" }),

    // Material
    sel("material", "Material", toStr(p.material, "MDF Branco"), MATERIALS, "material"),
    sel("finish", "Acabamento", toStr(p.finish, "Fosco"), FINISHES, "acabamento"),
    bool("glass", "Vidro", toBool(p.glass, false), "material"),
    bool("mirror", "Espelho", toBool(p.mirror, false), "material"),
  ];
  return { nodeId: node.id, label: node.label, fields };
}

export const CONFIGURATOR_MATERIALS = MATERIALS;
export const CONFIGURATOR_FINISHES = FINISHES;
export const CONFIGURATOR_HARDWARE_BRANDS = HARDWARE_BRANDS;