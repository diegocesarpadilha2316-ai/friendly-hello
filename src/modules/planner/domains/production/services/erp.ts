import type { ErpProvider } from "../types";

export const ERP_PROVIDERS: readonly ErpProvider[] = [
  {
    id: "tiny",
    label: "Tiny ERP",
    category: "nacional",
    status: "planejado",
    scopes: ["produtos", "pedidos", "estoque"],
  },
  {
    id: "bling",
    label: "Bling",
    category: "nacional",
    status: "planejado",
    scopes: ["produtos", "pedidos", "nfe"],
  },
  {
    id: "omie",
    label: "Omie",
    category: "nacional",
    status: "planejado",
    scopes: ["financeiro", "produtos", "pedidos"],
  },
  {
    id: "conta-azul",
    label: "Conta Azul",
    category: "nacional",
    status: "planejado",
    scopes: ["financeiro", "clientes"],
  },
  {
    id: "sap",
    label: "SAP Business One",
    category: "enterprise",
    status: "planejado",
    scopes: ["mrp", "financeiro", "estoque"],
  },
  {
    id: "totvs",
    label: "TOTVS Protheus",
    category: "enterprise",
    status: "planejado",
    scopes: ["mrp", "chao-fabrica", "financeiro"],
  },
];

export function erpConnectionUrl(providerId: string): string {
  return `/planner/producao/erp/${providerId}`;
}
