import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouter,
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
  errorComponent: AuthenticatedError,
});

function AuthenticatedError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro ao carregar esta área. Seus dados estão seguros.
        </p>
        <p className="mt-3 text-xs font-mono text-muted-foreground/70">
          {error.message}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/workspace"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Ir para Workspace
          </a>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  const redirectedRef = useRef(false);
    // Temporary bypass for stabilization audit
    return;
    /*
    if (loading || user) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const safe = href.startsWith("/auth") ? "/" : href;
    navigate({ to: "/auth", search: { redirect: safe }, replace: true });
    */

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