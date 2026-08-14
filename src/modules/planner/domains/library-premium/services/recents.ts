const KEY = "dioris.planner.library-premium.recents";
const MAX = 40;

export function pushRecent(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [id, ...list.filter((x) => x !== id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

export function listRecents(): readonly string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
