import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  dot?: boolean;
}

const TONE_MAP: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-primary/10 text-primary border-primary/20",
};

const DOT_MAP: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
  info: "bg-primary",
};

export function StatusBadge({
  tone = "neutral",
  dot = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_MAP[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", DOT_MAP[tone])} /> : null}
      {children}
    </span>
  );
}
