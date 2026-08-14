const KEY = "dioris.planner.library.recents.v1";
const LIMIT = 30;
interface State {
  materials: string[];
  hardware: string[];
}
function read(): State {
  if (typeof window === "undefined") return { materials: [], hardware: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { materials: [], hardware: [] };
    const p = JSON.parse(raw) as Partial<State>;
    return {
      materials: Array.isArray(p.materials) ? p.materials.slice(0, LIMIT) : [],
      hardware: Array.isArray(p.hardware) ? p.hardware.slice(0, LIMIT) : [],
    };
  } catch {
    return { materials: [], hardware: [] };
  }
}
function write(s: State) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* */
    }
  }
}
export function readRecents(): State {
  return read();
}
export function pushRecentMaterial(id: string): State {
  const s = read();
  const next: State = {
    ...s,
    materials: [id, ...s.materials.filter((x) => x !== id)].slice(0, LIMIT),
  };
  write(next);
  return next;
}
export function pushRecentHardware(id: string): State {
  const s = read();
  const next: State = {
    ...s,
    hardware: [id, ...s.hardware.filter((x) => x !== id)].slice(0, LIMIT),
  };
  write(next);
  return next;
}
export function clearRecents(): State {
  const e: State = { materials: [], hardware: [] };
  write(e);
  return e;
}
