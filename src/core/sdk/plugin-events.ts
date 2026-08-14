/** PluginEventBus — barramento pub/sub interno para plugins. */
type Listener = (payload: unknown) => void;

const bus = new Map<string, Set<Listener>>();

export const PluginEventBus = {
  on(event: string, fn: Listener): () => void {
    const set = bus.get(event) ?? new Set<Listener>();
    set.add(fn);
    bus.set(event, set);
    return () => set.delete(fn);
  },
  emit(event: string, payload: unknown): void {
    for (const fn of bus.get(event) ?? []) fn(payload);
  },
  clear(event?: string): void {
    if (event) bus.delete(event);
    else bus.clear();
  },
};
