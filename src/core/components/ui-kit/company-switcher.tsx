import * as React from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./status-badge";
import { useOptionalTenant } from "@/core/providers/TenantProvider";

export interface CompanySwitcherProps {
  onCreateNew?: () => void;
  className?: string;
}

export function CompanySwitcher({ onCreateNew, className }: CompanySwitcherProps) {
  const tenant = useOptionalTenant();
  if (!tenant) return null;
  const { companies, activeCompany, setActive, loading } = tenant;

  if (loading && !activeCompany) {
    return <div className={cn("h-9 w-56 animate-pulse rounded-md bg-muted", className)} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent/40",
          className,
        )}
      >
        {activeCompany?.logo_url ? (
          <img src={activeCompany.logo_url} alt="" className="h-5 w-5 rounded-sm object-cover" />
        ) : (
          <Building2 className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="max-w-[10rem] truncate font-medium">
          {activeCompany?.name ?? "Selecionar empresa"}
        </span>
        {activeCompany ? (
          <StatusBadge tone="info" dot={false} className="hidden sm:inline-flex">
            {activeCompany.plan}
          </StatusBadge>
        ) : null}
        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Empresas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">Nenhuma empresa disponível.</div>
        ) : (
          companies.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onSelect={() => setActive(c.id)}
              className="flex items-center gap-2"
            >
              {c.logo_url ? (
                <img src={c.logo_url} alt="" className="h-5 w-5 rounded-sm object-cover" />
              ) : (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {c.role} · {c.plan}
                </div>
              </div>
              {activeCompany?.id === c.id ? <Check className="h-4 w-4 text-primary" /> : null}
            </DropdownMenuItem>
          ))
        )}
        {onCreateNew ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onCreateNew}>+ Nova empresa</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
