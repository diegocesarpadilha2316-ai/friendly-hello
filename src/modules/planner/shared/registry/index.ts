/**
 * Registry de contratos do Planner.
 *
 * Ponto único de composição — cada domínio se auto-registra através do
 * seu próprio `register(registry)` durante o bootstrap. Consumidores
 * (rotas, outros domínios, Core) apenas leem via `registry.get(...)`.
 *
 * Não instancia nada nesta fase; apenas provê a estrutura.
 */
import type { PlannerContracts } from "../contracts";
import type { PlannerDomain } from "../types";

type PartialContracts = { [K in PlannerDomain]?: PlannerContracts[K] };

export class PlannerRegistry {
  private readonly impls: PartialContracts = {};

  register<K extends PlannerDomain>(domain: K, impl: PlannerContracts[K]): void {
    if (this.impls[domain]) {
      throw new Error(`[planner] domínio já registrado: ${domain}`);
    }
    this.impls[domain] = impl;
  }

  get<K extends PlannerDomain>(domain: K): PlannerContracts[K] {
    const impl = this.impls[domain];
    if (!impl) throw new Error(`[planner] domínio não registrado: ${domain}`);
    return impl;
  }

  has(domain: PlannerDomain): boolean {
    return !!this.impls[domain];
  }
}

/** Singleton lazy — inicializado no bootstrap do módulo. */
let _registry: PlannerRegistry | null = null;
export function getPlannerRegistry(): PlannerRegistry {
  if (!_registry) _registry = new PlannerRegistry();
  return _registry;
}
