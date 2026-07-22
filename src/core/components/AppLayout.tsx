import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  Database,
  Globe2,
  HardDrive,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plug,
  Puzzle,
  ShieldCheck,
  Settings,
  Gauge,
  Rocket,
  LifeBuoy,
  Command,
} from "lucide-react";
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
import diorisMark from "@/assets/dioris-mark.png";

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
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "Admin Center", url: "/admin", icon: Command },
      ],
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
        { title: "API Gateway", url: "/api-gateway", icon: Globe2 },
        { title: "Cache", url: "/cache", icon: Database },
        { title: "Segurança", url: "/security", icon: ShieldCheck },
        { title: "Qualidade", url: "/quality", icon: Gauge },
        { title: "CI/CD", url: "/cicd", icon: Rocket },
        { title: "Recovery", url: "/recovery", icon: LifeBuoy },
        { title: "Configurações", url: "/configuracoes", icon: Settings },
      ],
    },
  ];

  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={
            <div className="flex items-center gap-2">
              <img
                src={diorisMark}
                alt="Dioris"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">{app.name}</span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Inteligência que conecta
                </span>
              </div>
            </div>
          }
          groups={groups}
        />
      }
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