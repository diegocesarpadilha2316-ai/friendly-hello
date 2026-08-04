import React from "react";
import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  loader: async () => {
    return { 
      supabaseConfig: { 
        url: "https://placeholder-project.supabase.co", 
        publishableKey: "placeholder-key" 
      } 
    };
  },
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div id="root-render-check" style={{ display: 'none' }}>RENDER_OK</div>
      <Outlet />
      <ScrollRestoration />
    </QueryClientProvider>
  );
}
