import * as React from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {
  left?: React.ReactNode;
  right?: React.ReactNode;
  showSidebarTrigger?: boolean;
}

export function Topbar({
  left,
  right,
  showSidebarTrigger = true,
  className,
  children,
  ...props
}: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 w-full items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur",
        className,
      )}
      {...props}
    >
      {showSidebarTrigger ? <SidebarTrigger /> : null}
      {left}
      <div className="flex-1">{children}</div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </header>
  );
}
