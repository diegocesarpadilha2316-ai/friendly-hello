import { useEffect, useState } from "react";
import { useAuth } from "@/core/providers/AuthProvider";
import { checkIsPlatformAdmin } from "@/modules/planner/domains/catalog/library.admin.functions";

/**
 * useIsPlatformAdmin — verifica no servidor se o usuário logado é
 * administrador da plataforma Dioris (tabela `platform_admins`).
 *
 * Nunca confie apenas neste hook para bloquear operações destrutivas:
 * o servidor revalida via `is_platform_admin(uid)` + RLS. O hook serve
 * apenas para renderização condicional (esconder/exibir botões).
 */
export function useIsPlatformAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<{ isAdmin: boolean; loading: boolean }>({
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setState({ isAdmin: false, loading: false });
      return;
    }
    checkIsPlatformAdmin()
      .then((r) => {
        if (!cancelled) setState({ isAdmin: !!r?.isAdmin, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ isAdmin: false, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return state;
}