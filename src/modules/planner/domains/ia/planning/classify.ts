/**
 * Etapa 11 — Parte 2: classificação do pedido.
 *
 * Heurística determinística pt-BR (sem custo, sem rede). Só pedidos
 * realmente amplos viram plano; conversa/consulta/alteração pequena
 * continuam no fluxo direto da Etapa 9.
 */
import type { PlanRequestKind } from "./types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const DESTRUCTIVE =
  /\b(remova|remover|apague|apagar|exclu\w*|delet\w*|limpe|zerar|refaz|refazer|comece do zero|do zero)\b/;
const DESTRUCTIVE_WIDE = /\b(tudo|todo|toda|todos|todas|geral|inteir\w+)\b/;

const FULL_PROJECT =
  /\b(cozinha|closet|quarto|dormitorio|escritorio|home ?office|sala|banheiro|lavabo|area gourmet|varanda|painel de tv|home theater)\b/;
const FULL_HINT =
  /\b(complet\w+|inteir\w+|projet\w+|monte|montar|criar?|crie|faca|fazer|planeje|planejar|reforme|do inicio)\b/;

const INTERMEDIATE =
  /\b(monte|montar|organize|organizar|reorganize|distribua|planeje|proponha|layout|marcenaria|conjunto|bancada com|parede)\b/;

/** Pedido genérico ("crie um ambiente bonito") — falta o tipo de ambiente. */
const VAGUE_AMBIENT = /\b(ambiente|espaco|comodo|projeto)\b/;

const QUERY =
  /\b(qual|quais|quanto|quantos|como esta|esta aplicado|me diga|mostre|liste|existe|tem )\b/;

const SMALL_CHANGE =
  /\b(troque|trocar|mude|mudar|altere|alterar|ajuste|ajustar|pinte|pintar|aumente|diminua|renomeie)\b/;

const SINGLE_OP =
  /\b(adicione|adicionar|inclua|incluir|coloque|colocar|insira|inserir|duplique|espelhe|gire)\b/;

const CONSULTIVE_CHAIN = /\b(orcamento|orcar|producao|lista de corte|render|renderiza\w*)\b/;

export interface RequestClassification {
  readonly kind: PlanRequestKind;
  /** Deve gerar um plano estruturado com preview? */
  readonly needsPlan: boolean;
  readonly reason: string;
}

/** Tipo de ambiente citado explicitamente na mensagem, se houver. */
export function detectRoomType(message: string): string | null {
  return norm(message).match(FULL_PROJECT)?.[0] ?? null;
}

export function classifyRequest(message: string): RequestClassification {
  const t = norm(message);
  if (!t) return { kind: "conversa", needsPlan: false, reason: "mensagem vazia" };

  if (DESTRUCTIVE.test(t) && DESTRUCTIVE_WIDE.test(t)) {
    return { kind: "destrutivo", needsPlan: true, reason: "remoção ampla solicitada" };
  }

  const mentionsRoom = FULL_PROJECT.test(t);
  if (mentionsRoom && FULL_HINT.test(t)) {
    return { kind: "projeto_completo", needsPlan: true, reason: "criação de ambiente completo" };
  }

  // "Crie um ambiente bonito": intenção clara de projetar, ambiente ausente.
  if (!mentionsRoom && FULL_HINT.test(t) && VAGUE_AMBIENT.test(t)) {
    return {
      kind: "projeto_completo",
      needsPlan: true,
      reason: "criação de ambiente sem tipo definido",
    };
  }

  if (QUERY.test(t) && !SMALL_CHANGE.test(t) && !SINGLE_OP.test(t)) {
    return { kind: "consulta", needsPlan: false, reason: "pergunta consultiva" };
  }

  // "Gere orçamento, produção e render" — cadeia consultiva encadeada.
  const consultiveHits = (t.match(new RegExp(CONSULTIVE_CHAIN, "g")) ?? []).length;
  if (consultiveHits >= 2) {
    return {
      kind: "plano_intermediario",
      needsPlan: true,
      reason: "sequência consultiva (orçamento/produção/render)",
    };
  }

  if (SMALL_CHANGE.test(t) && t.length <= 140 && !mentionsRoom) {
    return { kind: "alteracao_pequena", needsPlan: false, reason: "alteração localizada" };
  }

  if (SINGLE_OP.test(t) && !INTERMEDIATE.test(t)) {
    return { kind: "operacao_unica", needsPlan: false, reason: "operação única" };
  }

  if (INTERMEDIATE.test(t) || mentionsRoom) {
    return { kind: "plano_intermediario", needsPlan: true, reason: "conjunto de módulos" };
  }

  return { kind: "conversa", needsPlan: false, reason: "conversa livre" };
}
