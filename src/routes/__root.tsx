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
import { getPublicSupabaseConfig } from "@/core/lib/supabase/config.functions";
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
    const config = await getPublicSupabaseConfig();
    return { supabaseConfig: config };
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
