/**
 * Tick autenticado do worker de render/vídeo — usado pelo painel
 * `/planner/render` para avançar jobs quando o usuário está online.
 * Reutiliza a lógica compartilhada em `render-worker.server.ts`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireTenant } from "@/core/middleware/require-tenant";

export const tickRenderJobs = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .handler(async () => {
    const { tickRenderWorkers } = await import("@/core/workers/render-worker.server");
    const result = await tickRenderWorkers({ maxJobs: 12 });
    return result;
  });
