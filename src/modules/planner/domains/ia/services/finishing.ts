/**
 * Acabamento automático — Parte 4 do Copiloto.
 *
 * Presets coordenados que aplicam, em uma passada só:
 *   • cor/madeira do corpo
 *   • material das chapas
 *   • cor do tampo
 *   • tipo de frente (vidro, reeded, sólido, aberto)
 *   • ferragem (puxador padrão)
 *   • LED de ambiente
 *
 * Reutiliza `mutateFurniture` do runtime de tools e não introduz stores
 * novas — toda mutação passa pelo `updateProject` do PlannerEditorProvider.
 */
import type { PlannerProject, PlannerRoom } from "@/modules/planner/shared";
import {
  listPrimitives,
  upsertPrimitive,
  findCatalogItem,
  type Editor2DPrimitive,
  type CatalogSubtype,
} from "@/modules/planner/shared";

export type FinishingScope = "all" | "aereos" | "balcoes" | "torre" | "painel" | "tampos";
export type FinishingFront = "vidro" | "reeded" | "solid" | "aberto";

export interface FinishingPreset {
  id: string;
  label: string;
  bodyColor: string;
  material: string;
  topColor: string;
  front: FinishingFront;
  puxador: string;
  led: boolean;
  style: string;
}

export const FINISHING_PRESETS: readonly FinishingPreset[] = [
  {
    id: "louro-freijo-reeded",
    label: "Louro Freijó + Vidro Reeded",
    bodyColor: "Louro Freijó",
    material: "MDF 18mm",
    topColor: "Preto Absoluto",
    front: "reeded",
    puxador: "Perfil J embutido",
    led: true,
    style: "moderno",
  },
  {
    id: "off-white-minimalista",
    label: "Off White Minimalista",
    bodyColor: "Off White",
    material: "MDF 18mm",
    topColor: "Branco Absoluto",
    front: "solid",
    puxador: "Cava",
    led: true,
    style: "minimalista",
  },
  {
    id: "carvalho-grafite-industrial",
    label: "Carvalho + Grafite Industrial",
    bodyColor: "Carvalho Naturale",
    material: "MDF 18mm",
    topColor: "Grafite",
    front: "solid",
    puxador: "Barra 320mm inox",
    led: false,
    style: "industrial",
  },
  {
    id: "nogueira-luxo",
    label: "Nogueira Luxo",
    bodyColor: "Nogueira",
    material: "MDF 18mm",
    topColor: "Nero Marquina",
    front: "vidro",
    puxador: "Perfil J embutido",
    led: true,
    style: "luxo",
  },
  {
    id: "freijo-cumaru",
    label: "Freijó + Cumaru",
    bodyColor: "Freijó",
    material: "MDF 18mm",
    topColor: "Cumaru",
    front: "solid",
    puxador: "Alça 128mm",
    led: true,
    style: "classico",
  },
];

export function findFinishingPreset(id: string): FinishingPreset | null {
  const norm = id.toLowerCase().replace(/\s+/g, "-");
  return (
    FINISHING_PRESETS.find((p) => p.id === norm) ??
    FINISHING_PRESETS.find((p) => p.label.toLowerCase().includes(id.toLowerCase())) ??
    null
  );
}

// ────────── escopo ──────────

const SCOPE_SUBTYPES: Record<FinishingScope, CatalogSubtype[] | "all"> = {
  all: "all",
  aereos: ["aereo"],
  balcoes: ["balcao", "gaveteiro"],
  torre: ["torre"],
  painel: ["painel"],
  tampos: ["tampo", "bancada", "ilha"],
};

type FurniturePrim = Extract<Editor2DPrimitive, { kind: "furniture" }>;

function inScope(f: FurniturePrim, scope: FinishingScope): boolean {
  const wanted = SCOPE_SUBTYPES[scope];
  if (wanted === "all") return true;
  const it = f.catalogItemId ? findCatalogItem(f.catalogItemId) : null;
  const st = it?.subtype ?? (f.subtype as CatalogSubtype);
  return wanted.includes(st);
}

// ────────── aplicação ──────────

export interface ApplyFinishingResult {
  project: PlannerProject;
  applied: number;
  preset: FinishingPreset;
}

export function applyFinishing(
  project: PlannerProject,
  target: { environmentId: string; roomId: string },
  args: { presetId: string; scope?: FinishingScope },
): { result?: ApplyFinishingResult; error?: string } {
  const preset = findFinishingPreset(args.presetId);
  if (!preset) return { error: `Preset "${args.presetId}" não encontrado.` };

  const scope = args.scope ?? "all";
  let applied = 0;

  const environments = project.environments.map((env) => {
    if (env.id !== target.environmentId) return env;
    return {
      ...env,
      rooms: env.rooms.map((room) =>
        room.id !== target.roomId ? room : applyToRoom(room, preset, scope, (n) => {
          applied += n;
        }),
      ),
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    result: { project: { ...project, environments }, applied, preset },
  };
}

function applyToRoom(
  room: PlannerRoom,
  preset: FinishingPreset,
  scope: FinishingScope,
  count: (n: number) => void,
): PlannerRoom {
  const targets = listPrimitives(room).filter(
    (p): p is FurniturePrim => p.kind === "furniture" && inScope(p, scope),
  );
  if (targets.length === 0) return room;

  let out = room;
  for (const f of targets) {
    const it = f.catalogItemId ? findCatalogItem(f.catalogItemId) : null;
    const st = it?.subtype ?? (f.subtype as CatalogSubtype);
    const isTop = st === "tampo" || st === "bancada" || st === "ilha";
    const color = isTop ? preset.topColor : preset.bodyColor;

    const params: Record<string, string | number | boolean | null> = {
      ...f.params,
      color,
      material: preset.material,
      "eng:style": preset.style,
      "eng:hardware:puxador": preset.puxador,
    };
    // frente só faz sentido para módulos com portas
    if (!isTop && st !== "prateleira" && st !== "nicho") {
      params.frontType = preset.front;
      params["eng:front"] = preset.front;
    }
    if (preset.led && (st === "aereo" || st === "torre" || st === "painel")) {
      params["led:on"] = true;
      params["led:kelvin"] = 3000;
    }
    out = upsertPrimitive(out, { ...f, params });
  }
  count(targets.length);
  return out;
}
