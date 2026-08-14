import { listPrimitives, upsertPrimitive, findCatalogItem } from "@/modules/planner/shared";
import { findPbrMaterialByLabel } from "@/modules/planner/shared/materials/pbr-catalog";
export const FINISHING_PRESETS = [
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
export function findFinishingPreset(id) {
  const norm = id.toLowerCase().replace(/\s+/g, "-");
  return (
    FINISHING_PRESETS.find((p) => p.id === norm) ??
    FINISHING_PRESETS.find((p) => p.label.toLowerCase().includes(id.toLowerCase())) ??
    null
  );
}
// ────────── escopo ──────────
const SCOPE_SUBTYPES = {
  all: "all",
  aereos: ["aereo"],
  balcoes: ["balcao", "gaveteiro"],
  torre: ["torre"],
  painel: ["painel"],
  tampos: ["tampo", "bancada", "ilha"],
};
function inScope(f, scope) {
  const wanted = SCOPE_SUBTYPES[scope];
  if (wanted === "all") return true;
  const it = f.catalogItemId ? findCatalogItem(f.catalogItemId) : null;
  const st = it?.subtype ?? f.subtype;
  return wanted.includes(st);
}
export function applyFinishing(project, target, args) {
  const preset = findFinishingPreset(args.presetId);
  if (!preset) return { error: `Preset "${args.presetId}" não encontrado.` };
  const scope = args.scope ?? "all";
  let applied = 0;
  const environments = project.environments.map((env) => {
    if (env.id !== target.environmentId) return env;
    return {
      ...env,
      rooms: env.rooms.map((room) =>
        room.id !== target.roomId
          ? room
          : applyToRoom(room, preset, scope, (n) => {
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
function applyToRoom(room, preset, scope, count) {
  const targets = listPrimitives(room).filter((p) => p.kind === "furniture" && inScope(p, scope));
  if (targets.length === 0) return room;
  let out = room;
  for (const f of targets) {
    const it = f.catalogItemId ? findCatalogItem(f.catalogItemId) : null;
    const st = it?.subtype ?? f.subtype;
    const isTop = st === "tampo" || st === "bancada" || st === "ilha";
    const color = isTop ? preset.topColor : preset.bodyColor;
    const params = {
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
    // Amarra o material PBR real (Parte 6) — resolve por rótulo humano.
    const pbr = findPbrMaterialByLabel(color);
    const next = pbr ? { ...f, params, materialId: pbr.id } : { ...f, params };
    out = upsertPrimitive(out, next);
  }
  count(targets.length);
  return out;
}
