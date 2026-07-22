/**
 * Contratos públicos entre domínios do Planner.
 *
 * Cada domínio expõe uma interface `<Domain>Contract` estável — outros
 * domínios só se comunicam através dela, nunca importando implementações
 * internas. Isso permite substituir a implementação sem quebrar consumidores.
 *
 * A implementação concreta é registrada em runtime via
 * `PlannerRegistry` (ver ../registry). Consumidores fazem
 * `registry.get("catalog")` e recebem um objeto que satisfaz este contrato.
 */
import type {
  PlannerContext,
  PlannerCatalogItemId,
  PlannerProjectId,
} from "../types";

export interface CatalogContract {
  readonly domain: "catalog";
  listItems(ctx: PlannerContext, query?: { kind?: string }): Promise<ReadonlyArray<{ id: PlannerCatalogItemId; name: string }>>;
}

export interface RenderContract {
  readonly domain: "render";
  enqueueRender(ctx: PlannerContext, input: { projectId: PlannerProjectId; kind: "viewport" | "photo" | "final" | "panorama" | "video" | "tour" | "compare" }): Promise<{ jobId: string }>;
}

export interface IAContract {
  readonly domain: "ia";
  invoke(ctx: PlannerContext, input: { capability: "assistant" | "generate" | "optimize" | "budget" | "production" | "render"; payload: unknown }): Promise<{ ok: true; result: unknown }>;
}

export interface ProductionContract {
  readonly domain: "production";
  buildBOM(ctx: PlannerContext, projectId: PlannerProjectId): Promise<{ items: ReadonlyArray<{ sku: string; qty: number }> }>;
}

export interface CNCContract {
  readonly domain: "cnc";
  planCutting(ctx: PlannerContext, projectId: PlannerProjectId): Promise<{ jobId: string }>;
}

export interface ExecutiveContract {
  readonly domain: "executive";
  exportDrawings(ctx: PlannerContext, projectId: PlannerProjectId, format: "pdf" | "dwg" | "svg"): Promise<{ url: string }>;
}

export interface BudgetContract {
  readonly domain: "budget";
  computeQuote(ctx: PlannerContext, projectId: PlannerProjectId): Promise<{ total: number; currency: string }>;
}

export interface LibraryContract {
  readonly domain: "library";
  listCollections(ctx: PlannerContext): Promise<ReadonlyArray<{ id: string; name: string }>>;
}

export interface RoomsContract {
  readonly domain: "rooms";
  listRoomTypes(): ReadonlyArray<{ key: string; label: string }>;
}

export interface MaterialsContract {
  readonly domain: "materials";
  listMaterials(ctx: PlannerContext, filter?: { kind?: string }): Promise<ReadonlyArray<{ id: string; name: string }>>;
}

export interface HardwareContract {
  readonly domain: "hardware";
  listBrands(): ReadonlyArray<{ key: string; label: string }>;
}

export interface MarketplaceContract {
  readonly domain: "marketplace";
  /** Preparado — implementação futura. */
  readonly enabled: boolean;
}

export interface PublicApiContract {
  readonly domain: "api";
  /** Preparado — implementação futura. */
  readonly enabled: boolean;
}

export interface PlannerContracts {
  ia: IAContract;
  render: RenderContract;
  catalog: CatalogContract;
  production: ProductionContract;
  cnc: CNCContract;
  executive: ExecutiveContract;
  budget: BudgetContract;
  library: LibraryContract;
  rooms: RoomsContract;
  materials: MaterialsContract;
  hardware: HardwareContract;
  marketplace: MarketplaceContract;
  api: PublicApiContract;
}
