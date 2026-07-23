import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/core/hooks";
import { AppLayout } from "@/core/components/AppLayout";

/**
 * Gate de rotas autenticadas.
 * `ssr: false` porque a sessão Supabase vive no localStorage do browser.
 * Redirecionamento acontece no efeito client-side, evitando corrida com o
 * bootstrap do client Supabase (feito por <AuthProvider>).
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (loading || user) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const safe = href.startsWith("/auth") ? "/" : href;
    navigate({ to: "/auth", search: { redirect: safe }, replace: true });
  }, [loading, user, navigate, href]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }
  if (!user) return null;

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}