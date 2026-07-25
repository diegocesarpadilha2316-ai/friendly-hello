import type { ImporterEntity, ImporterEntityRole, ImporterLayer } from "../types";

function classify(name: string): ImporterEntityRole {
  const n = name.toLowerCase();
  if (/pared|wall|muro/.test(n)) return "wall";
  if (/porta|door/.test(n)) return "door";
  if (/janela|window/.test(n)) return "window";
  if (/piso|floor/.test(n)) return "floor";
  if (/teto|ceiling/.test(n)) return "ceiling";
  if (/ambient|room|comodo/.test(n)) return "room";
  if (/mob|furni|movel/.test(n)) return "furniture";
  if (/cota|dim/.test(n)) return "dimension";
  if (/text|label/.test(n)) return "text";
  if (/bloco|block/.test(n)) return "block";
  return "unknown";
}

export function summarizeLayers(entities: readonly ImporterEntity[], rawLayerNames: readonly string[] = []): readonly ImporterLayer[] {
  const map = new Map<string, ImporterLayer>();
  for (const name of rawLayerNames) {
    map.set(name, { id: name, name, visible: true, locked: false, count: 0, role: classify(name) });
  }
  for (const e of entities) {
    const cur = map.get(e.layerId) ?? { id: e.layerId, name: e.layerId, visible: true, locked: false, count: 0, role: classify(e.layerId) };
    map.set(e.layerId, { ...cur, count: cur.count + 1 });
  }
  return Array.from(map.values());
}

export function toggleLayerVisibility(layers: readonly ImporterLayer[], id: string): readonly ImporterLayer[] {
  return layers.map((l) => l.id === id ? { ...l, visible: !l.visible } : l);
}

export function toggleLayerLock(layers: readonly ImporterLayer[], id: string): readonly ImporterLayer[] {
  return layers.map((l) => l.id === id ? { ...l, locked: !l.locked } : l);
}

export function reassignLayerRole(layers: readonly ImporterLayer[], id: string, role: ImporterEntityRole): readonly ImporterLayer[] {
  return layers.map((l) => l.id === id ? { ...l, role } : l);
}