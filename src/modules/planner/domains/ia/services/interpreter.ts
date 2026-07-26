/**
 * Interpretador pt-BR — heurístico, offline, determinístico.
 *
 * Traduz linguagem natural em uma sequência de chamadas a ferramentas do
 * Planner. Serve como fallback local (sem custo, sem rede) e como
 * "roteador rápido" antes de acionar um LLM. A saída — `ParsedIntent[]` —
 * é a mesma consumida pelo executor para qualquer provedor futuro
 * (GPT, Gemini, Claude, Open Source), garantindo a "interface comum de
 * execução" exigida pela fase.
 */
import type { ToolName } from "./tools";

export interface ParsedIntent {
  tool: ToolName;
  args: Readonly<Record<string, unknown>>;
  answerHint?: string;
}

export interface QuestionIntent {
  kind:
    | "measurements"
    | "materials"
    | "part_count"
    | "door_count"
    | "drawer_count"
    | "hardware"
    | "board_area"
    | "budget"
    | "help";
}

export type PlannerIntent =
  | { type: "command"; intents: readonly ParsedIntent[] }
  | { type: "question"; question: QuestionIntent }
  | { type: "smalltalk"; reply: string }
  | { type: "unknown"; reply: string };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function has(text: string, ...words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function parseNumber(text: string, fallback?: number): number | undefined {
  const m = text.match(/(-?\d+(?:[.,]\d+)?)/);
  if (!m) return fallback;
  return Number(m[1].replace(",", "."));
}

// mapa de palavras-chave → subtype/preset
const PRESET_KEYWORDS: Array<{ preset: string; words: string[] }> = [
  { preset: "cozinha", words: ["cozinha"] },
  { preset: "closet", words: ["closet"] },
  { preset: "dormitorio", words: ["dormitorio", "quarto"] },
  { preset: "sala", words: ["sala", "estar", "living"] },
  { preset: "escritorio", words: ["escritorio", "home office"] },
  { preset: "banheiro", words: ["banheiro", "lavabo"] },
];

const SUBTYPE_KEYWORDS: Array<{ subtype: string; words: string[] }> = [
  { subtype: "armario", words: ["armario"] },
  { subtype: "aereo", words: ["aereo"] },
  { subtype: "balcao", words: ["balcao"] },
  { subtype: "gaveteiro", words: ["gaveteiro"] },
  { subtype: "nicho", words: ["nicho"] },
  { subtype: "torre", words: ["torre"] },
  { subtype: "cristaleira", words: ["cristaleira"] },
  { subtype: "roupeiro", words: ["roupeiro"] },
  { subtype: "painel", words: ["painel"] },
  { subtype: "ilha", words: ["ilha"] },
  { subtype: "tampo", words: ["tampo"] },
  { subtype: "bancada", words: ["bancada"] },
  { subtype: "prateleira", words: ["prateleira"] },
  { subtype: "porta", words: ["porta"] },
  { subtype: "gaveta", words: ["gaveta"] },
  { subtype: "espelho", words: ["espelho"] },
  { subtype: "vidro", words: ["vidro"] },
  { subtype: "iluminacao", words: ["led", "fita"] },
];

const STYLES = ["minimalista", "classico", "clássico", "industrial", "luxo", "moderno"];

const MATERIALS = [
  { key: "MDF Freijó", words: ["freijo"] },
  { key: "MDF Louro Freijó", words: ["louro freijo", "louro-freijo"] },
  { key: "MDF Nogueira", words: ["nogueira"] },
  { key: "MDF Carvalho", words: ["carvalho"] },
  { key: "MDF Branco TX", words: ["branco tx", "branco"] },
  { key: "MDF 18mm", words: ["mdf"] },
  { key: "MDP 18mm", words: ["mdp"] },
  { key: "Quartzo", words: ["quartzo"] },
  { key: "Madeira maciça", words: ["madeira macica", "madeira maciça"] },
];

export function interpret(input: string): PlannerIntent {
  const raw = input.trim();
  if (!raw) return { type: "smalltalk", reply: "Como posso te ajudar no Planner?" };
  const t = norm(raw);

  // ── Perguntas ──
  if (t.startsWith("qual") || t.startsWith("quanto") || t.startsWith("quantas") || t.startsWith("quantos") || t.endsWith("?")) {
    if (has(t, "mede", "metragem", "tamanho", "dimensao", "medida")) return { type: "question", question: { kind: "measurements" } };
    if (has(t, "mdf", "material", "chapa")) {
      if (has(t, "quanto de chapa", "quanto de mdf")) return { type: "question", question: { kind: "board_area" } };
      return { type: "question", question: { kind: "materials" } };
    }
    if (has(t, "porta")) return { type: "question", question: { kind: "door_count" } };
    if (has(t, "gaveta")) return { type: "question", question: { kind: "drawer_count" } };
    if (has(t, "ferragem", "puxador", "dobradica", "corredica")) return { type: "question", question: { kind: "hardware" } };
    if (has(t, "peca", "pecas")) return { type: "question", question: { kind: "part_count" } };
    if (has(t, "valor", "preco", "custo", "orcamento")) return { type: "question", question: { kind: "budget" } };
  }

  if (has(t, "ajuda", "help", "o que voce faz", "o que vc faz")) {
    return { type: "question", question: { kind: "help" } };
  }

  const intents: ParsedIntent[] = [];

  // ── Criação de ambiente completo ──
  if (has(t, "cria", "crie", "criar", "faca", "faz", "monta", "montar")) {
    for (const { preset, words } of PRESET_KEYWORDS) {
      if (words.some((w) => t.includes(w))) {
        const styleMatch = STYLES.find((s) => t.includes(norm(s)));
        intents.push({ tool: "create_room_preset", args: { preset, style: styleMatch } });
        if (styleMatch) intents.push({ tool: "set_style", args: { style: styleMatch === "clássico" ? "classico" : styleMatch } });
        // Qualificadores na MESMA frase: material/cor e tipo de frente.
        for (const { key, words: mw } of MATERIALS) {
          if (mw.some((w) => t.includes(w))) {
            intents.push({ tool: "change_material", args: { material: key } });
            const color = key.replace(/^MDF\s+/, "");
            intents.push({ tool: "change_color", args: { color } });
            break;
          }
        }
        if (has(t, "porta de vidro", "portas de vidro", "com vidro", "frente de vidro")) {
          const reeded = has(t, "reeded", "canelado", "canelada");
          intents.push({
            tool: "set_front_type",
            args: { type: reeded ? "reeded" : "vidro", subtype: "aereo" },
          });
        }
        return { type: "command", intents };
      }
    }
  }

  // ── Painel ripado / ilha ──
  if (has(t, "painel ripado", "ripado")) {
    intents.push({ tool: "panel_ripado", args: {} });
  }
  if (has(t, "cria uma ilha", "crie uma ilha", "adiciona ilha", "adicione ilha", "faca uma ilha")) {
    intents.push({ tool: "insert_item", args: { subtype: "ilha" } });
  }

  // ── Trocar material ──
  if (has(t, "troque", "trocar", "muda", "mude", "mudar")) {
    for (const { key, words } of MATERIALS) {
      if (words.some((w) => t.includes(w))) {
        if (key.includes("MDF") || key.includes("MDP") || key === "Quartzo" || key === "Madeira maciça") {
          intents.push({ tool: "change_material", args: { material: key } });
          // freijó/nogueira/carvalho/branco também são cores/acabamentos → aplicar cor
          if (["Freijó", "Nogueira", "Carvalho", "Branco TX"].some((c) => key.includes(c))) {
            const color = key.replace(/^MDF\s+/, "");
            intents.push({ tool: "change_color", args: { color } });
          }
        }
      }
    }
  }

  // ── Estilo ──
  for (const style of STYLES) {
    if (has(t, `deixe ${style}`, `deixa ${style}`, `estilo ${style}`, `faca ${style}`, `faz ${style}`)) {
      intents.push({ tool: "set_style", args: { style: style === "clássico" ? "classico" : style } });
    }
  }

  // ── Abrir/fechar portas e gavetas ──
  if (has(t, "abra todas as portas", "abrir portas", "abre as portas")) intents.push({ tool: "open_all", args: { target: "doors", open: true } });
  if (has(t, "feche todas as portas", "fechar portas")) intents.push({ tool: "open_all", args: { target: "doors", open: false } });
  if (has(t, "abra todas as gavetas", "abrir gavetas", "abre as gavetas")) intents.push({ tool: "open_all", args: { target: "drawers", open: true } });
  if (has(t, "feche todas as gavetas", "fechar gavetas")) intents.push({ tool: "open_all", args: { target: "drawers", open: false } });

  // ── LED ──
  if (has(t, "adicione led", "adicionar led", "liga led", "ligue led", "ligar led")) {
    intents.push({ tool: "toggle_led", args: { on: true } });
  }
  if (has(t, "desligar led", "desligue led", "apagar led", "apague led")) {
    intents.push({ tool: "toggle_led", args: { on: false } });
  }

  // ── Ferragens ──
  if (has(t, "troque puxadores", "trocar puxador", "muda puxador")) intents.push({ tool: "change_hardware", args: { kind: "puxador", value: "dioris-perfil-linha" } });
  if (has(t, "troque ferragem", "troque ferragens", "trocar ferragem")) intents.push({ tool: "change_hardware", args: { kind: "dobradica", value: "blum-clip-top" } });

  // ── Aumentar / diminuir / dimensionar ──
  if (has(t, "aumente", "aumentar", "cresca", "maior")) {
    const factor = parseNumber(t, 1.2) ?? 1.2;
    intents.push({ tool: "resize", args: { factor: factor > 5 ? 1.2 : factor } });
  }
  if (has(t, "diminua", "diminuir", "reduza", "menor")) {
    intents.push({ tool: "resize", args: { factor: 0.8 } });
  }
  if (has(t, "ate o teto", "até o teto")) {
    intents.push({ tool: "resize", args: { height: 2600 } });
  }

  // ── Ações unitárias ──
  if (has(t, "duplique", "duplicar", "duplica")) intents.push({ tool: "duplicate", args: {} });
  if (has(t, "espelhe", "espelhar", "espelha")) intents.push({ tool: "mirror", args: {} });
  if (has(t, "gire", "girar", "gira", "rotacione", "rotacionar")) {
    const deg = parseNumber(t, 90) ?? 90;
    intents.push({ tool: "rotate", args: { degrees: deg } });
  }
  if (has(t, "remova", "remover", "delete", "excluir", "apague")) intents.push({ tool: "remove", args: {} });
  if (has(t, "centralize", "centralizar", "centraliza")) intents.push({ tool: "center", args: {} });

  // ── Bancada / tampo ──
  if (has(t, "altere a bancada", "trocar bancada", "mude a bancada")) {
    intents.push({ tool: "change_material", args: { material: "Quartzo" } });
  }

  // ── Acabamento automático (preset coordenado) ──
  const FINISHING_MATCHERS: Array<{ id: string; words: string[] }> = [
    { id: "louro-freijo-reeded", words: ["louro freijo", "louro-freijo", "freijo reeded", "freijo canelado"] },
    { id: "off-white-minimalista", words: ["off white", "off-white", "branco minimalista"] },
    { id: "carvalho-grafite-industrial", words: ["carvalho grafite", "grafite industrial", "industrial grafite"] },
    { id: "nogueira-luxo", words: ["nogueira luxo", "nogueira premium", "luxo nogueira"] },
    { id: "freijo-cumaru", words: ["freijo cumaru", "cumaru freijo"] },
  ];
  if (has(t, "acabamento", "aplique acabamento", "aplicar acabamento", "aplique o acabamento", "acabamento automatico", "harmonize", "harmonizar")) {
    const scope =
      has(t, "aereo", "aereos") ? "aereos"
      : has(t, "balcao", "balcoes") ? "balcoes"
      : has(t, "torre") ? "torre"
      : has(t, "painel") ? "painel"
      : has(t, "tampo", "bancada") ? "tampos"
      : "all";
    const match = FINISHING_MATCHERS.find((f) => f.words.some((w) => t.includes(w)));
    if (match) {
      intents.push({ tool: "apply_finishing", args: { preset: match.id, scope } });
    }
  } else {
    // Detecção implícita: se o usuário citou o nome do preset diretamente.
    const match = FINISHING_MATCHERS.find((f) => f.words.some((w) => t.includes(w)));
    if (match && has(t, "aplique", "aplicar", "deixe", "coloca", "coloque", "usa", "use", "usar")) {
      intents.push({ tool: "apply_finishing", args: { preset: match.id, scope: "all" } });
    }
  }

  // ── Inserção genérica pelo subtipo mencionado ──
  if (intents.length === 0 && has(t, "adicione", "adicionar", "insira", "inserir", "coloque", "coloca", "adiciona")) {
    for (const { subtype, words } of SUBTYPE_KEYWORDS) {
      if (words.some((w) => t.includes(w))) {
        const count = parseNumber(t.replace(/^\d+\s*[x×]?\s*/, "")) ?? 1;
        intents.push({ tool: "insert_item", args: { subtype, count: Math.min(10, count) } });
        break;
      }
    }
  }

  if (intents.length > 0) return { type: "command", intents };

  return {
    type: "unknown",
    reply:
      "Ainda não entendi esse comando. Tente: 'crie uma cozinha moderna', 'troque para Freijó', 'abra todas as portas', 'centralize este armário'.",
  };
}