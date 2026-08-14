const KEY = "dioris.planner.library.favorites.v1";
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
      materials: Array.isArray(p.materials) ? p.materials : [],
      hardware: Array.isArray(p.hardware) ? p.hardware : [],
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

export function readFavorites(): State {
  return read();
}
export function toggleFavoriteMaterial(id: string): State {
  const s = read();
  const next: State = {
    ...s,
    materials: s.materials.includes(id)
      ? s.materials.filter((x) => x !== id)
      : [...s.materials, id],
  };
  write(next);
  return next;
}
export function toggleFavoriteHardware(id: string): State {
  const s = read();
  const next: State = {
    ...s,
    hardware: s.hardware.includes(id) ? s.hardware.filter((x) => x !== id) : [...s.hardware, id],
  };
  write(next);
  return next;
}
export function clearFavorites(): State {
  const e: State = { materials: [], hardware: [] };
  write(e);
  return e;
}
