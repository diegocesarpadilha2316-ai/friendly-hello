/**
 * Sistema de extensões (plugins/hooks) do Planner.
 *
 * Permite que futuros módulos, o Marketplace ou a API pública adicionem
 * comportamentos a pontos de extensão bem definidos sem alterar o núcleo.
 *
 * Nesta fase apenas o contrato — nenhum ponto ativo.
 */
export type PlannerExtensionPoint =
  | "catalog.item.beforeCreate"
  | "budget.compute.afterTotals"
  | "render.job.beforeEnqueue"
  | "production.bom.afterBuild"
  | "cnc.plan.beforeExport";

export interface PlannerExtension<TInput = unknown, TOutput = TInput> {
  readonly point: PlannerExtensionPoint;
  readonly name: string;
  /** Determinística: mesma entrada → mesma saída. Ordena por `priority` asc. */
  readonly priority?: number;
  run(input: TInput): TOutput | Promise<TOutput>;
}

export class PlannerExtensionHost {
  private readonly byPoint = new Map<PlannerExtensionPoint, PlannerExtension[]>();

  register(ext: PlannerExtension): void {
    const list = this.byPoint.get(ext.point) ?? [];
    list.push(ext);
    list.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    this.byPoint.set(ext.point, list);
  }

  async runPoint<T>(point: PlannerExtensionPoint, input: T): Promise<T> {
    const list = this.byPoint.get(point);
    if (!list?.length) return input;
    let acc: unknown = input;
    for (const ext of list) acc = await ext.run(acc);
    return acc as T;
  }
}

let _host: PlannerExtensionHost | null = null;
export function getPlannerExtensionHost(): PlannerExtensionHost {
  if (!_host) _host = new PlannerExtensionHost();
  return _host;
}
