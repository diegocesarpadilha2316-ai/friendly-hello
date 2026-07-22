import * as React from "react";
import { cn } from "@/lib/utils";
import type { WidgetSize } from "@/core/dashboard/types";

const SPAN: Record<WidgetSize, string> = {
  sm: "col-span-12 sm:col-span-6 lg:col-span-3",
  md: "col-span-12 sm:col-span-6 lg:col-span-4",
  lg: "col-span-12 lg:col-span-6",
  xl: "col-span-12",
};

export interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardGrid({ className, children, ...rest }: DashboardGridProps) {
  return (
    <div className={cn("grid grid-cols-12 gap-4", className)} {...rest}>
      {children}
    </div>
  );
}

export interface DashboardGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: WidgetSize;
}

export function DashboardGridItem({
  size = "md",
  className,
  children,
  ...rest
}: DashboardGridItemProps) {
  return (
    <div className={cn(SPAN[size], className)} {...rest}>
      {children}
    </div>
  );
}
