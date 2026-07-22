/**
 * Server function do Dashboard.
 * Passa por requireTenant → garante que o snapshot é sempre escopado ao
 * tenant ativo. Nesta fase, retorna snapshot vazio (warming=true).
 *
 * Contratos de dados são estáveis: quando cada módulo tiver seu serviço,
 * este arquivo agrega parcialmente sem quebrar consumidores.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireTenant } from "@/core/middleware/require-tenant";
import type { DashboardSnapshot } from "./types";
import { emptySnapshot } from "./snapshot";

export const getDashboardSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<DashboardSnapshot> => {
    return emptySnapshot({ tenantId: context.tenantId });
  });
