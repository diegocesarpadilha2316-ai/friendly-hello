import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
}

export function FormSection({
  title,
  description,
  aside,
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section
      className={cn("grid gap-6 border-b border-border py-6 lg:grid-cols-3", className)}
      {...props}
    >
      <div className="lg:col-span-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {aside ? <div className="mt-4">{aside}</div> : null}
      </div>
      <div className="space-y-4 lg:col-span-2">{children}</div>
    </section>
  );
}