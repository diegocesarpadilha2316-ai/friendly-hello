import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusTone } from "./status-badge";

export interface ModuleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  status?: { label: React.ReactNode; tone?: StatusTone };
  href?: string;
  disabled?: boolean;
  onOpen?: () => void;
}

export function ModuleCard({
  name,
  description,
  icon,
  status,
  href,
  disabled,
  onOpen,
  className,
  ...props
}: ModuleCardProps) {
  const interactive = !disabled && (href || onOpen);
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.();
              }
            }
          : undefined
      }
      aria-disabled={disabled}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors",
        interactive && "cursor-pointer hover:border-primary/40 hover:bg-accent/40",
        disabled && "opacity-60",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
          ) : null}
          <div className="text-base font-semibold">{name}</div>
        </div>
        {status ? <StatusBadge tone={status.tone}>{status.label}</StatusBadge> : null}
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      {interactive ? (
        <div className="mt-auto flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Abrir módulo <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      ) : null}
    </div>
  );
}