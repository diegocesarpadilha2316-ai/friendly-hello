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
import diorisMark from "@/assets/dioris-logo-mark.png";

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
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent ring-1 ring-primary/20">
                <img
                  src={diorisMark}
                  alt="Dioris"
                  width={40}
                  height={40}
                  className="h-8 w-8 object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="bg-gradient-to-r from-[hsl(262_83%_65%)] via-[hsl(230_85%_60%)] to-[hsl(190_90%_55%)] bg-clip-text text-base font-bold tracking-[0.02em] text-transparent">
                  {app.name}
                </span>
                <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground/80">
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