import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  label?: React.ReactNode;
  /** Se true, cobre apenas o pai relativo; se false, cobre a viewport. */
  absolute?: boolean;
}

export function LoadingOverlay({
  visible = true,
  label = "Carregando…",
  absolute = true,
  className,
  ...props
}: LoadingOverlayProps) {
  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "z-50 flex items-center justify-center gap-3 bg-background/70 backdrop-blur-sm",
        absolute ? "absolute inset-0" : "fixed inset-0",
        className,
      )}
      {...props}
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}
