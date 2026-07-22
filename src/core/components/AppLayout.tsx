import type { ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
import {
  AppShell,
  Sidebar,
  Topbar,
  type SidebarNavGroup,
} from "@/core/components/ui-kit";
import { app, modules } from "@/core/config";

/**
 * AppLayout — composição padrão consumida pelo __root para páginas do hub.
 * Renderiza Sidebar + Topbar + slot de conteúdo.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const groups: SidebarNavGroup[] = [
    {
      label: "Visão geral",
      items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
    },
    {
      label: "Módulos",
      items: modules.map((m) => ({
        title: m.label,
        url: m.path,
        icon: m.icon,
      })),
    },
  ];

  return (
    <AppShell
      sidebar={<Sidebar brand={app.name} groups={groups} />}
      topbar={<Topbar />}
    >
      {children}
    </AppShell>
  );
}