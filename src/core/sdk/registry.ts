import type { PluginHookName, PluginManifest } from "./types";

type HookFn = (payload: unknown, ctx: unknown) => unknown | Promise<unknown>;

const manifests = new Map<string, PluginManifest>();
const hooks = new Map<PluginHookName, Set<HookFn>>();

export const PluginRegistry = {
  register(manifest: PluginManifest): void {
    manifests.set(manifest.slug, manifest);
  },
  get(slug: string): PluginManifest | undefined {
    return manifests.get(slug);
  },
  list(): readonly PluginManifest[] {
    return Array.from(manifests.values());
  },
  unregister(slug: string): void {
    manifests.delete(slug);
  },
};

export const HookRegistry = {
  on(name: PluginHookName, fn: HookFn): () => void {
    const set = hooks.get(name) ?? new Set<HookFn>();
    set.add(fn);
    hooks.set(name, set);
    return () => set.delete(fn);
  },
  async run(name: PluginHookName, payload: unknown, ctx: unknown): Promise<unknown> {
    let value = payload;
    for (const fn of hooks.get(name) ?? []) {
      value = await fn(value, ctx);
    }
    return value;
  },
  list(name: PluginHookName): number {
    return hooks.get(name)?.size ?? 0;
  },
};