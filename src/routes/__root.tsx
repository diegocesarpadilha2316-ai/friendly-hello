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
import { AuthProvider } from "@/core/providers/AuthProvider";
import { TenantProvider } from "@/core/providers/TenantProvider";
// getPublicSupabaseConfig is not imported here to avoid server-side crash during SSR
// We'text define it in loader as a fallback or move to a safe client-side fetch if possible.
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dioris Hub — Inteligência que conecta tudo" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/dioris-favicon.png" },
    ],
  }),
  loader: async () => {
    // Return environment variables or placeholders directly if possible.
    // We try to avoid a server function call in the root loader during SSR if it's causing 502s.
    return { 
      supabaseConfig: {
        url: import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co",
        publishableKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key"
      } 
    };
  },
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { supabaseConfig } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider config={supabaseConfig}>
        <TenantProvider>
          <Outlet />
          <Toaster position="top-right" />
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
