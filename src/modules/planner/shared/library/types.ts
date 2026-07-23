/**
 * Biblioteca Inteligente — Fase 3.4.
 *
 * Define os tipos do catálogo. Um `CatalogItem` é um *template* paramétrico:
 * quando inserido no editor gera um `PlannerParametricNode` (kind: "module",
 * role: "furniture") — o MESMO objeto paramétrico que alimenta o Editor 2D,
 * o Ambiente 3D e, futuramente, IA, Render, Produção e Lista de Corte.
 *
 * Não há novos providers/stores. Favoritos e recentes são estado local em
 * `localStorage` (hook client-only). Todo o restante do estado do documento
 * continua sob o `PlannerEditorProvider` das Fases 3.1/3.2.
 */

export type CatalogSubtype =
  | "armario"
  | "balcao"
  | "gaveteiro"
  | "nicho"
  | "torre"
  | "aereo"
  | "cristaleira"
  | "roupeiro"
  | "closet"
  | "painel"
  | "bancada"
  | "ilha"
  | "tampo"
  | "porta"
  | "gaveta"
  | "prateleira"
  | "divisoria"
  | "ferragem"
  | "rodape"
  | "pe"
  | "perfil"
  | "vidro"
  | "espelho"
  | "iluminacao";

export type CatalogCategoryId =
  | "modulos"
  | "tampos"
  | "portas-gavetas"
  | "prateleiras"
  | "acessorios"
  | "acabamentos"
  | "iluminacao";

export interface CatalogCategory {
  id: CatalogCategoryId;
  label: string;
  description: string;
}

/** Faixa mínima e máxima aceita por um parâmetro numérico (mm). */
export interface ParamRange {
  min: number;
  max: number;
  step?: number;
}

/** Parametrização exposta ao usuário — livre de acoplamento com Three.js. */
export interface CatalogParametricSpec {
  width: ParamRange;
  depth: ParamRange;
  height: ParamRange;
  /** dimensões default em mm */
  defaults: { width: number; depth: number; height: number };
  /** materiais/acabamentos oferecidos por padrão */
  materials?: readonly string[];
  colors?: readonly string[];
  finishes?: readonly string[];
  /** parâmetros extra livres (número/texto) já pré-tipados para a IA */
  extra?: Readonly<
    Record<
      string,
      | { kind: "number"; label: string; default: number; min?: number; max?: number; step?: number; unit?: string }
      | { kind: "select"; label: string; default: string; options: readonly string[] }
      | { kind: "boolean"; label: string; default: boolean }
      | { kind: "text"; label: string; default: string }
    >
  >;
}

/** Metadados de IA — descrevem a peça para geração/substituição/otimização. */
export interface CatalogAIMetadata {
  /** rótulos semânticos usados por embeddings/RAG */
  semanticTags: readonly string[];
  /** contexto típico de uso (ambientes ideais) */
  contexts: readonly string[];
  /** peças que podem substituir esta (mesmo papel funcional) */
  substitutes?: readonly CatalogSubtype[];
  /** peças que se combinam bem (composição) */
  combines?: readonly CatalogSubtype[];
  /** descrição curta em linguagem natural (pt-BR) */
  narrative: string;
}

export type CatalogStatus = "active" | "beta" | "deprecated";

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: CatalogCategoryId;
  subtype: CatalogSubtype;
  brand?: string;
  line?: string;
  code?: string;
  image?: string;
  thumbnail?: string;
  /** referência ao modelo 3D externo (opcional — hoje extrudimos boxes) */
  model3D?: string;
  /** referência ao símbolo 2D externo (opcional — hoje desenhamos retângulo rotulado) */
  model2D?: string;
  parametric: CatalogParametricSpec;
  material?: string;
  color?: string;
  texture?: string;
  weightKg?: number;
  priceBRL?: number;
  supplier?: string;
  version: string;
  status: CatalogStatus;
  tags: readonly string[];
  ai: CatalogAIMetadata;
}

export interface CatalogCollection {
  id: string;
  label: string;
  description: string;
  itemIds: readonly string[];
}