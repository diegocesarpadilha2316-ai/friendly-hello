import {
  createFileRoute,
  Outlet,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth, useOptionalTenant } from "@/core/hooks";
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
  const tenant = useOptionalTenant();
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
  // Sem empresa cadastrada → força onboarding (exceto na própria página).
  useEffect(() => {
    if (!user) return;
    if (tenant && !tenant.loading && tenant.companies.length === 0) {
      if (!href.startsWith("/onboarding")) {
        navigate({ to: "/onboarding/company", replace: true });
      }
    }
  }, [user, tenant, href, navigate]);

  if (loading || tenant?.loading) {
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