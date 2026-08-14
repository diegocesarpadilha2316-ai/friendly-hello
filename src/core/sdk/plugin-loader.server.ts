import type { PluginManifest } from "./types";
import { PluginRegistry } from "./registry";

export function loadManifest(raw: unknown): PluginManifest {
  const m = raw as PluginManifest;
  if (!m?.slug || !m.name || !m.version || !m.category) {
    throw new Error("Invalid plugin manifest");
  }
  PluginRegistry.register(m);
  return m;
}

export function unloadPlugin(slug: string): void {
  PluginRegistry.unregister(slug);
}
