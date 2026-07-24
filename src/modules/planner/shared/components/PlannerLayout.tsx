import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, Boxes, Sparkles, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PlannerAIFab } from "@/modules/planner/domains/ia";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const NAV: readonly Item[] = [
  { to: "/planner", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/planner/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/planner/biblioteca", label: "Biblioteca", icon: Boxes },
  { to: "/planner/engenharia", label: "Engenharia", icon: Wrench },
  { to: "/planner/ia", label: "IA de Projeto", icon: Sparkles },
];

function isActive(pathname: string, item: Item): boolean {
  return item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

export function PlannerLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-full flex-col">
      <nav aria-label="Planner" className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-6 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="flex-1">{children ?? <Outlet />}</div>
      <PlannerAIFab />
    </div>
  );
}