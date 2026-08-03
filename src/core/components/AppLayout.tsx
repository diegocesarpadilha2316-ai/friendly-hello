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
  Search,
} from "lucide-react";
import {
  AppShell,
  Sidebar,
  Topbar,
  CompanySwitcher,
  type SidebarNavGroup,
} from "@/core/components/ui-kit";
import { CommandPalette, useCommandPalette } from "@/core/components/command-palette";
import { Button } from "@/components/ui/button";
import { app, modules } from "@/core/config";
import { useOptionalAuth } from "@/core/hooks";
import { useNavigate } from "@tanstack/react-router";
import diorisLogo from "@/assets/dioris-logo.png";

/**
 * AppLayout — composição padrão consumida pelo __root para páginas do hub.
 * Renderiza Sidebar + Topbar + slot de conteúdo.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const auth = useOptionalAuth();
  const navigate = useNavigate();
  const palette = useCommandPalette();
  const groups: SidebarNavGroup[] = [
    {
      label: "Visão geral",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "Workspace", url: "/workspace", icon: Rocket },
        { title: "Admin Center", url: "/admin", icon: Command },
        { title: "Planner V2 — Em desenvolvimento", url: "/planner-v2", icon: Rocket },
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
            <div className="flex flex-col items-center gap-2 py-2">
              <img
                src={diorisLogo}
                alt={`${app.name} — logotipo oficial`}
                className="h-20 w-auto object-contain drop-shadow-[0_0_24px_rgba(139,92,246,0.28)]"
              />
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground/80">
                Inteligência que conecta tudo
              </span>
            </div>
          }
          groups={groups}
        />
      }
      topbar={
        <Topbar
          left={
            <CompanySwitcher />
          }
          right={
            auth?.user ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={palette.toggle}
                  className="hidden gap-2 border-border/60 text-xs text-muted-foreground sm:inline-flex"
                  aria-label="Abrir busca global"
                >
                  <Search className="h-3.5 w-3.5" />
                  Buscar…
                  <kbd className="ml-2 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    ⌘K
                  </kbd>
                </Button>
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
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </AppShell>
  );
}