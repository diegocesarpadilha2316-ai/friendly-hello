import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/core/hooks";
import { AppLayout } from "@/core/components/AppLayout";

/**
 * Gate de rotas autenticadas.
 * `ssr: false` porque a sessão Supabase vive no localStorage do browser.
 * `beforeLoad` (client-only) redireciona anônimos para /auth.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { getSupabaseBrowser } = await import("@/core/lib/supabase/client");
    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw redirect({ to: "/auth", search: { redirect: location.href } });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      // Client ainda não inicializado — deixa o componente lidar (loading).
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.navigate({ to: "/auth", replace: true });
    }
  }, [loading, user, router]);

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