/**
 * Registry central de widgets do Dashboard.
 * Módulos registram seus widgets via `registerWidgets(...)` durante o
 * bootstrap. A ordem final respeita `order` e preferências futuras do
 * usuário (favoritos/personalização) sem exigir refactor.
 */
import type { WidgetDescriptor } from "./types";
import type { Permission } from "@/core/types/rbac";

class DashboardRegistryImpl {
  private readonly widgets = new Map<string, WidgetDescriptor>();

  register(widget: WidgetDescriptor): void {
    if (this.widgets.has(widget.id)) {
      throw new Error(`[dashboard] widget duplicado: ${widget.id}`);
    }
    this.widgets.set(widget.id, widget);
  }

  registerMany(widgets: ReadonlyArray<WidgetDescriptor>): void {
    for (const w of widgets) this.register(w);
  }

  unregister(id: string): void {
    this.widgets.delete(id);
  }

  list(filter?: {
    can?: (p: Permission) => boolean;
    owner?: string;
    hidden?: ReadonlySet<string>;
  }): ReadonlyArray<WidgetDescriptor> {
    const arr = Array.from(this.widgets.values());
    const filtered = arr.filter((w) => {
      if (filter?.hidden?.has(w.id)) return false;
      if (filter?.owner && w.owner !== filter.owner) return false;
      if (w.permission && filter?.can && !filter.can(w.permission)) return false;
      return true;
    });
    return filtered.sort(
      (a, b) => (a.order ?? 1_000) - (b.order ?? 1_000) || a.id.localeCompare(b.id),
    );
  }

  clear(): void {
    this.widgets.clear();
  }
}

let _instance: DashboardRegistryImpl | null = null;
export function getDashboardRegistry(): DashboardRegistryImpl {
  if (!_instance) _instance = new DashboardRegistryImpl();
  return _instance;
}
export type DashboardRegistry = DashboardRegistryImpl;
