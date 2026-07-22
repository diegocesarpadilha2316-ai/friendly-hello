import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultSidebarOpen?: boolean;
}

/**
 * AppShell — layout base autenticado (Sidebar + Topbar + conteúdo).
 * Consome `SidebarProvider` do shadcn para permitir colapso e responsividade.
 */
export function AppShell({
  sidebar,
  topbar,
  children,
  className,
  defaultSidebarOpen = true,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className={cn("flex min-h-screen w-full bg-background text-foreground", className)}>
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col">
          {topbar}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}