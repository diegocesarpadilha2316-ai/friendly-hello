import { useMemo, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  Coins,
  CreditCard,
  UserCircle,
  Settings,
  Bell,
  HardDrive,
  Sparkles,
  LifeBuoy,
  History,
  Activity,
  KeyRound,
  Plug,
  Puzzle,
  Search,
  Menu,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  CommandPalette,
  useCommandPalette,
} from "@/core/components/command-palette";
import { useTenant } from "@/core/providers/TenantProvider";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

type NavGroup = { label: string; items: readonly NavItem[] };

export const WORKSPACE_NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { to: "/workspace", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/workspace/modulos", label: "Módulos", icon: Puzzle },
      { to: "/workspace/atividades", label: "Atividades", icon: Activity },
    ],
  },
  {
    label: "Empresa",
    items: [
      { to: "/workspace/empresa", label: "Minha Empresa", icon: Building2 },
      { to: "/workspace/equipe", label: "Equipe", icon: Users },
      { to: "/workspace/perfil", label: "Perfil", icon: UserCircle },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { to: "/workspace/creditos", label: "Créditos", icon: Coins },
      { to: "/workspace/assinatura", label: "Assinatura", icon: CreditCard },
      { to: "/workspace/historico", label: "Histórico", icon: History },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { to: "/workspace/ia", label: "IA", icon: Sparkles },
      { to: "/workspace/assets", label: "Assets", icon: HardDrive },
      { to: "/workspace/integracoes", label: "Integrações", icon: Plug },
      { to: "/workspace/api-keys", label: "API Keys", icon: KeyRound },
      { to: "/workspace/notificacoes", label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/workspace/configuracoes", label: "Configurações", icon: Settings },
      { to: "/workspace/ajuda", label: "Central de Ajuda", icon: LifeBuoy },
    ],
  },
];

/** Lista plana (compatibilidade) de todos os itens do Workspace. */
export const WORKSPACE_NAV: readonly NavItem[] = WORKSPACE_NAV_GROUPS.flatMap(
  (g) => g.items,
);

function NavList({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-4">
      {WORKSPACE_NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = item.exact
              ? path === item.to
              : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as never}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                  active && "bg-primary/10 text-foreground font-medium",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function useBreadcrumb(path: string) {
  return useMemo(() => {
    const match = WORKSPACE_NAV.find((item) =>
      item.exact ? path === item.to : path.startsWith(item.to),
    );
    return match?.label ?? "Workspace";
  }, [path]);
}

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { activeCompany } = useTenant();
  const palette = useCommandPalette();
  const currentLabel = useBreadcrumb(path);

  return (
    <div className="flex min-h-full w-full">
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/30 px-3 py-6 lg:block">
        <div className="mb-4 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Workspace
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            {activeCompany?.name ?? "Área do Cliente"}
          </p>
        </div>
        <NavList path={path} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu do Workspace"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetHeader>
                <SheetTitle className="text-sm">
                  {activeCompany?.name ?? "Workspace"}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <NavList path={path} />
              </div>
            </SheetContent>
          </Sheet>

          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground"
          >
            <Link to="/workspace" className="hover:text-foreground">
              Workspace
            </Link>
            {currentLabel !== "Dashboard" && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="truncate text-foreground">{currentLabel}</span>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={palette.toggle}
              className="hidden gap-2 text-muted-foreground sm:flex"
              aria-label="Abrir pesquisa global"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Pesquisar…</span>
              <kbd className="ml-2 rounded border border-border/60 bg-muted px-1.5 text-[10px] font-mono">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={palette.toggle}
              className="sm:hidden"
              aria-label="Abrir pesquisa global"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
}