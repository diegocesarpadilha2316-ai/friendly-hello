import React from "react";
import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/core/providers/AuthProvider";
import { TenantProvider } from "@/core/providers/TenantProvider";
import { Toaster } from "@/components/ui/sonner";
import { ClientOnly } from "@/components/ui/client-only";
import { getPublicSupabaseConfig } from "@/core/lib/supabase/config.functions";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  loader: async () => {
    try {
      const config = await getPublicSupabaseConfig();
      return { supabaseConfig: config };
    } catch (err) {
      return { 
        supabaseConfig: { 
          url: "https://placeholder-project.supabase.co", 
          publishableKey: "placeholder-key" 
        } 
      };
    }
  },
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { supabaseConfig } = Route.useLoaderData();

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider config={supabaseConfig}>
          <TenantProvider>
            <Outlet />
            <ClientOnly>
              <Toaster position="top-right" />
            </ClientOnly>
          </TenantProvider>
        </AuthProvider>
        <ScrollRestoration />
      </QueryClientProvider>
    </React.StrictMode>
  );
}