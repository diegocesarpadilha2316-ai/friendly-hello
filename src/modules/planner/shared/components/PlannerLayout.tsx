import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Boxes,
  Sparkles,
  Wrench,
  ScanEye,
  Palette,
  Camera,
  Film,
  Factory,
  Menu,
  Store,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PlannerAIFab } from "@/modules/planner/domains/ia";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type Group = { label: string; items: readonly Item[] };

const GROUPS: readonly Group[] = [
  {
    label: "Projeto",
    items: [
      { to: "/planner", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/planner/projetos", label: "Projetos", icon: FolderKanban },
      { to: "/planner/biblioteca", label: "Catálogo", icon: Boxes },
    ],
  },
  {
    label: "Engenharia & Produção",
    items: [
      { to: "/planner/engenharia", label: "Engenharia", icon: Wrench },
      { to: "/planner/producao", label: "Produção", icon: Factory },
      { to: "/planner/marketplace", label: "Marketplace", icon: Store },
    ],
  },
  {
    label: "Renderização",
    items: [
      { to: "/planner/render", label: "Render", icon: Camera },
      { to: "/planner/video", label: "Vídeo", icon: Film },
    ],
  },
  {
    label: "IA Copiloto",
    items: [
      { to: "/planner/ia", label: "IA de Projeto", icon: Sparkles },
      { to: "/planner/visao", label: "IA Visão", icon: ScanEye },
      { to: "/planner/decoradora", label: "IA Decoradora", icon: Palette },
    ],
  },
];

function isActive(pathname: string, item: Item): boolean {
  return item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Planner" className="flex flex-col gap-5">
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function PlannerLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-full w-full">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/30 px-3 py-6 lg:block">
        <div className="mb-5 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Módulo
          </p>
          <p className="mt-1 text-sm font-semibold">Dioris Planner</p>
        </div>
        <SidebarNav pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu do Planner"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetHeader>
                <SheetTitle className="text-sm">Dioris Planner</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <SidebarNav
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">Dioris Planner</span>
        </header>

        <main className="min-w-0 flex-1">{children ?? <Outlet />}</main>
      </div>

      <PlannerAIFab />
    </div>
  );
}