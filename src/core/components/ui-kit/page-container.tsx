import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const SIZE_MAP: Record<NonNullable<PageContainerProps["size"]>, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[96rem]",
  full: "max-w-none",
};

export function PageContainer({ className, size = "lg", ...props }: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-8", SIZE_MAP[size], className)}
      {...props}
    />
  );
}