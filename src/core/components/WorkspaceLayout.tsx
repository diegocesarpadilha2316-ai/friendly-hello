import type { ReactNode } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

export const WORKSPACE_NAV: readonly NavItem[] = [
  { to: "/workspace", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/workspace/empresa", label: "Minha Empresa", icon: Building2 },
  { to: "/workspace/equipe", label: "Equipe", icon: Users },
  { to: "/workspace/creditos", label: "Créditos", icon: Coins },
  { to: "/workspace/assinatura", label: "Assinatura", icon: CreditCard },
  { to: "/workspace/perfil", label: "Perfil", icon: UserCircle },
  { to: "/workspace/configuracoes", label: "Configurações", icon: Settings },
  { to: "/workspace/notificacoes", label: "Notificações", icon: Bell },
  { to: "/workspace/assets", label: "Assets", icon: HardDrive },
  { to: "/workspace/ia", label: "IA", icon: Sparkles },
  { to: "/workspace/atividades", label: "Atividades", icon: Activity },
  { to: "/workspace/historico", label: "Histórico", icon: History },
  { to: "/workspace/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/workspace/integracoes", label: "Integrações", icon: Plug },
  { to: "/workspace/ajuda", label: "Central de Ajuda", icon: LifeBuoy },
];

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-full w-full">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/30 px-3 py-6 lg:block">
        <div className="mb-4 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Workspace
          </p>
          <p className="mt-1 text-sm font-medium">Área do Cliente</p>
        </div>
        <nav className="flex flex-col gap-0.5">
          {WORKSPACE_NAV.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as never}
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
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}