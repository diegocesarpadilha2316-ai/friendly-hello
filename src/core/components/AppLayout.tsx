import type { ReactNode } from "react";
import { Activity, Bell, HardDrive, LayoutDashboard, ListTodo, LogOut, Plug, Puzzle, Settings } from "lucide-react";
import {
  AppShell,
  Sidebar,
  Topbar,
  CompanySwitcher,
  type SidebarNavGroup,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import { app, modules } from "@/core/config";
import { useOptionalAuth } from "@/core/hooks";
import { useNavigate } from "@tanstack/react-router";

/**
 * AppLayout — composição padrão consumida pelo __root para páginas do hub.
 * Renderiza Sidebar + Topbar + slot de conteúdo.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const auth = useOptionalAuth();
  const navigate = useNavigate();
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
    {
      label: "Plataforma",
      items: [
        { title: "Notificações", url: "/notificacoes", icon: Bell },
        { title: "Storage", url: "/storage", icon: HardDrive },
        { title: "Observabilidade", url: "/observabilidade", icon: Activity },
        { title: "Integrações", url: "/integracoes", icon: Plug },
        { title: "SDK & Plugins", url: "/sdk", icon: Puzzle },
        { title: "Jobs & Workers", url: "/jobs", icon: ListTodo },
        { title: "Configurações", url: "/configuracoes", icon: Settings },
      ],
    },
  ];

  return (
    <AppShell
      sidebar={<Sidebar brand={app.name} groups={groups} />}
      topbar={
        <Topbar
          left={
            <CompanySwitcher
              onCreateNew={() => navigate({ to: "/onboarding/company" })}
            />
          }
          right={
            auth?.user ? (
              <>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {auth.user.email}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await auth.signOut();
                    navigate({ to: "/auth", replace: true });
                  }}
                >
                  <LogOut className="mr-1 h-4 w-4" /> Sair
                </Button>
              </>
            ) : null
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}