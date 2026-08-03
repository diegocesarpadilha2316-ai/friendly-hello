/**
 * CONTRATO DE FAMÍLIA DE MÓVEL.
 *
 * Uma "família" é apenas uma função pura que traduz uma ficha técnica em
 * uma lista declarativa de componentes da Biblioteca Construtiva. Ela NUNCA
 * declara geometria própria, nunca calcula folga de corrediça, dobradiça ou
 * furação — isso pertence exclusivamente aos componentes.
 */
import type { AssemblyResult } from "../construction";

/** Papel de cada peça dentro do móvel — usado pelo render e pela produção. */
export type FamilyPieceRole =
  | "estrutura"
  | "frente"
  | "interno"
  | "acessorio"
  | "rodape"
  | "espelho"
  | "tecnico";

export interface FamilyRequirementSpec {
  readonly mandatory: readonly string[];
  readonly important: readonly string[];
  readonly optional: readonly string[];
}


export interface FamilyBuildResult<TSpec> {
  /** Ficha normalizada efetivamente usada (auditável). */
  readonly spec: TSpec;
  /** Composição resolvida pela biblioteca construtiva. */
  readonly assembly: AssemblyResult;
  /** Medidas derivadas úteis ao render e à IA. */
  readonly layout: Readonly<Record<string, number>>;
}

export interface FurnitureFamily<TSpec> {
  readonly id: string;
  readonly label: string;
  /** Subtipos do editor que esta família atende. */
  readonly subtypes: readonly string[];
  readonly normalize: (input: Partial<TSpec>) => TSpec;
  readonly build: (spec: Partial<TSpec>) => FamilyBuildResult<TSpec>;
}
