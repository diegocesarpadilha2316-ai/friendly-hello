import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/core/providers/AuthProvider";
import { TenantProvider } from "@/core/providers/TenantProvider";
import { getPublicSupabaseConfig } from "@/core/lib/supabase/config.functions";
// Toaster e ClientOnly movidos para importação dinâmica ou isolados
import { ClientOnly } from "@/components/ui/client-only";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dioris Hub — Inteligência que conecta tudo" },
      { name: "description", content: "Plataforma enterprise Dioris — Planner, Sites, Sistemas, CRM, Financeiro, Marketplace, Automação e IA em um único hub." },
      { name: "author", content: "Dioris" },
      { name: "theme-color", content: "#6D28D9" },
      { property: "og:title", content: "Dioris Hub — Inteligência que conecta tudo" },
      { property: "og:description", content: "Plataforma enterprise Dioris — Planner, Sites, Sistemas, CRM, Financeiro, Marketplace, Automação e IA em um único hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Dioris" },
      { name: "twitter:title", content: "Dioris Hub — Inteligência que conecta tudo" },
      { name: "twitter:description", content: "Plataforma enterprise Dioris — Planner, Sites, Sistemas, CRM, Financeiro, Marketplace, Automação e IA em um único hub." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6e8837a-b0e3-4e2f-8598-88254f91154e/id-preview-7ad1afce--50509ef7-e326-4f32-878a-6b18a7c7ea39.lovable.app-1784834740481.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6e8837a-b0e3-4e2f-8598-88254f91154e/id-preview-7ad1afce--50509ef7-e326-4f32-878a-6b18a7c7ea39.lovable.app-1784834740481.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/dioris-favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/dioris-favicon.png" },
    ],
  loader: async () => ({ supabaseConfig: { url: "https://placeholder.supabase.co", publishableKey: "key" } }),
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { supabaseConfig } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider config={supabaseConfig}>
        <TenantProvider>
          {/* Required: nested routes render here. Layout (AppShell) lives under _authenticated. */}
          <Outlet />
          <ClientOnly>
            <Toaster position="top-right" />
          </ClientOnly>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
