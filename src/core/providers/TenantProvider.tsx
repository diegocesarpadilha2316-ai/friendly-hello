import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/core/hooks";
import { ensureDefaultCompany, listMyCompanies } from "@/core/services/tenant.functions";
import type { CompanyId, CompanyWithRole, TenantRole } from "@/core/types/tenant";
import { can as canPermission, type Permission } from "@/core/types/rbac";

const STORAGE_KEY = "dioris.hub.active-tenant";

export interface TenantState {
  loading: boolean;
  companies: readonly CompanyWithRole[];
  activeCompany: CompanyWithRole | null;
  activeId: CompanyId | null;
  role: TenantRole | null;
  setActive: (id: CompanyId) => void;
  refresh: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const TenantCtx = React.createContext<TenantState | null>(null);

function readStoredId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Store singleton exposto para middleware client-side (attach header). */
export function getActiveTenantIdFromStorage(): string | null {
  return readStoredId();
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = React.useState<CompanyId | null>(
    () => readStoredId() as CompanyId | null,
  );

  const query = useQuery({
    queryKey: ["core", "tenant", "my-companies", user?.id ?? null],
    queryFn: () => listMyCompanies(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const companies = React.useMemo(
    () => (Array.isArray(query.data) ? query.data : []),
    [query.data],
  );

  // Auto-provisiona empresa "Espaço {nick}" no primeiro login — o cliente
  // entra direto na plataforma sem passar por qualquer onboarding.
  const provisionedRef = React.useRef(false);
  React.useEffect(() => {
    if (!user) {
      provisionedRef.current = false;
      return;
    }
    if (query.isLoading || query.isFetching) return;
    if (companies.length > 0) return;
    if (provisionedRef.current) return;
    provisionedRef.current = true;
    ensureDefaultCompany()
      .then(() => query.refetch())
      .catch(() => {
        provisionedRef.current = false;
      });
  }, [user, query.isLoading, query.isFetching, companies.length, query]);

  // Resolve empresa ativa: preferência do storage → primeira disponível.
  const activeCompany = React.useMemo(() => {
    if (!companies.length) return null;
    const stored = companies.find((c) => c.id === activeId);
    return stored ?? companies[0] ?? null;
  }, [companies, activeId]);

  React.useEffect(() => {
    if (activeCompany && activeCompany.id !== activeId) {
      setActiveId(activeCompany.id as CompanyId);
      writeStoredId(activeCompany.id);
    }
    if (!companies.length && activeId) {
      setActiveId(null);
      writeStoredId(null);
    }
  }, [activeCompany, activeId, companies.length]);

  // Limpa storage no logout.
  React.useEffect(() => {
    if (!user) {
      setActiveId(null);
      writeStoredId(null);
    }
  }, [user]);

  const setActive = React.useCallback(
    (id: CompanyId) => {
      setActiveId(id);
      writeStoredId(id);
      // Invalida qualquer query dependente do tenant.
      queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey?.[0];
          return typeof key === "string" && key.startsWith("tenant:");
        },
      });
    },
    [queryClient],
  );

  const refresh = React.useCallback(async () => {
    await query.refetch();
  }, [query]);

  const role = activeCompany?.role ?? null;

  const value = React.useMemo<TenantState>(
    () => ({
      loading: query.isLoading,
      companies,
      activeCompany,
      activeId: (activeCompany?.id as CompanyId | undefined) ?? null,
      role,
      setActive,
      refresh,
      can: (permission) => canPermission(role, permission),
    }),
    [query.isLoading, companies, activeCompany, role, setActive, refresh],
  );

  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>;
}

export function useTenant(): TenantState {
  const ctx = React.useContext(TenantCtx);
  if (!ctx) throw new Error("useTenant deve ser usado dentro de <TenantProvider>.");
  return ctx;
}

export function useOptionalTenant(): TenantState | null {
  return React.useContext(TenantCtx);
}
