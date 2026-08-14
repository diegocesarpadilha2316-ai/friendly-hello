import { buildBlueprint, blueprintToPreset, validateBlueprint } from "./blueprint";
import { decompose } from "./decomposer";
import { parseEdits } from "./edits";
import { assumptionsSentence, buildFurnitureSpec, specToDescription, specToParams } from "./spec";
/**
 * Ficha Técnica → intent de inserção. O Planner Engine recebe a descrição
 * canônica (escolha de família/variante no catálogo) mais os params exatos
 * da ficha (portas, abertura, gavetas, maleiro, cabideiro, espelho, nichos,
 * puxador, estilo) — nunca um modelo genérico.
 */
function specToIntent(spec, count = 1) {
  return {
    tool: "insert_described",
    args: {
      description: specToDescription(spec),
      count,
      width: spec.width,
      height: spec.height,
      depth: spec.depth,
      params: specToParams(spec),
    },
    answerHint: assumptionsSentence(spec) ?? undefined,
  };
}
/**
 * Substantivos que representam um MÓVEL de verdade. Trechos como "3 portas
 * de correr" ou "duas gavetas internas" são atributos do mesmo móvel — não
 * módulos independentes — e por isso não contam aqui.
 */
const REAL_MODULE_NOUN =
  /armari|aereo|balcao|gaveteir|torre|cristaleir|roupeir|guarda[-\s]?roupa|closet|painel|nicho|prateleir|bancada|tampo|ilha|pia|cuba|coifa|cooktop|forno|geladeira/;
/** Quantos móveis distintos o pedido realmente cita. */
function realModuleCount(modules) {
  return modules.filter((m) => REAL_MODULE_NOUN.test(m.raw)).length;
}
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
function has(text, ...words) {
  return words.some((w) => text.includes(w));
}
const CREATE_VERBS = [
  "cria",
  "crie",
  "criar",
  "faca",
  "faco",
  "faz",
  "fazer",
  "feito",
  "monta",
  "montar",
  "quero",
  "queria",
  "gostaria",
  "preciso",
  "projeto",
  "ambiente",
  "gera",
  "gerar",
  "mande",
  "mandei",
  "pedi",
];
const INSERT_VERBS = [
  "insira",
  "inserir",
  "insere",
  "adicione",
  "adicionar",
  "adiciona",
  "coloque",
  "coloca",
  "poe",
  "poem",
  "bota",
  "bote",
  "cria",
  "crie",
  "criar",
  "faca",
  "faco",
  "faz",
  "fazer",
  "feito",
  "monta",
  "montar",
  "quero",
  "queria",
  "preciso",
  "gostaria",
  "gera",
  "gerar",
  "mande",
  "mandei",
  "pedi",
];
function parseNumber(text, fallback) {
  const m = text.match(/(-?\d+(?:[.,]\d+)?)/);
  if (!m) return fallback;
  return Number(m[1].replace(",", "."));
}
// mapa de palavras-chave → subtype/preset
const PRESET_KEYWORDS = [
  { preset: "cozinha", words: ["cozinha"] },
  { preset: "closet", words: ["closet"] },
  { preset: "dormitorio", words: ["dormitorio", "quarto"] },
  { preset: "sala", words: ["sala", "estar", "living"] },
  { preset: "escritorio", words: ["escritorio", "home office"] },
  { preset: "banheiro", words: ["banheiro", "lavabo"] },
  { preset: "lavanderia", words: ["lavanderia", "area de servico"] },
];
const SUBTYPE_KEYWORDS = [
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
export function interpret(input) {
  const raw = input.trim();
  if (!raw) return { type: "smalltalk", reply: "Como posso te ajudar no Planner?" };
  const t = norm(raw);
  // ── Perguntas ──
  if (
    t.startsWith("qual") ||
    t.startsWith("quanto") ||
    t.startsWith("quantas") ||
    t.startsWith("quantos") ||
    t.endsWith("?")
  ) {
    if (has(t, "mede", "metragem", "tamanho", "dimensao", "medida"))
      return { type: "question", question: { kind: "measurements" } };
    if (has(t, "mdf", "material", "chapa")) {
      if (has(t, "quanto de chapa", "quanto de mdf"))
        return { type: "question", question: { kind: "board_area" } };
      return { type: "question", question: { kind: "materials" } };
    }
    if (has(t, "porta")) return { type: "question", question: { kind: "door_count" } };
    if (has(t, "gaveta")) return { type: "question", question: { kind: "drawer_count" } };
    if (has(t, "ferragem", "puxador", "dobradica", "corredica"))
      return { type: "question", question: { kind: "hardware" } };
    if (has(t, "peca", "pecas")) return { type: "question", question: { kind: "part_count" } };
    if (has(t, "valor", "preco", "custo", "orcamento"))
      return { type: "question", question: { kind: "budget" } };
  }
  if (has(t, "ajuda", "help", "o que voce faz", "o que vc faz")) {
    return { type: "question", question: { kind: "help" } };
  }
  // ── Alterações cirúrgicas (antes de qualquer rota de criação) ──
  // "troque as portas por portas de correr", "aumente a largura para 3 m",
  // "coloque 4 gavetas internas" — mexem só no que foi citado.
  const edits = parseEdits(raw);
  if (edits.length > 0) {
    return {
      type: "command",
      intents: edits.map((e) => ({ tool: e.tool, args: e.args, answerHint: e.change })),
    };
  }
  const intents = [];
  // ── Criação de ambiente completo ──
  // Dispara sempre que o usuário mencionar o nome do ambiente OU pedir
  // genericamente "quero um projeto" / "faz um projeto" (default: cozinha).
  const wantsCreate = has(t, ...CREATE_VERBS);
  const wantsInsertVerb = has(t, ...INSERT_VERBS);
  const ambientWords = has(
    t,
    "projeto",
    "ambiente",
    "cozinha",
    "closet",
    "dormitorio",
    "quarto",
    "sala",
    "estar",
    "living",
    "escritorio",
    "home office",
    "banheiro",
    "lavabo",
    "lavanderia",
    "completo",
    "completa",
    "inteir",
    "todo",
    "toda",
  );
  {
    let matchedPreset = null;
    for (const { preset, words } of PRESET_KEYWORDS) {
      if (words.some((w) => t.includes(w))) {
        matchedPreset = preset;
        break;
      }
    }
    // ── ROTA A: Módulo específico sem ambiente ──
    // Se o usuário pediu peça(s) específica(s) ("faz um balcão de pia",
    // "adiciona um aéreo 800", "insere torre quente") SEM mencionar um
    // ambiente ou pedir "projeto/ambiente completo", inserimos apenas o
    // que foi pedido no cômodo atual — nada de recriar a cozinha inteira.
    if (!matchedPreset && !ambientWords && wantsInsertVerb) {
      const dec = decompose(raw);
      // Pedido de UM móvel específico → Ficha Técnica manda.
      if (realModuleCount(dec.modules) <= 1) {
        const spec = buildFurnitureSpec(raw);
        if (spec.type) {
          return { type: "command", intents: [specToIntent(spec, dec.modules[0]?.count ?? 1)] };
        }
      }
      if (dec.modules.length > 0) {
        const bp = buildBlueprint(raw);
        const material = bp.material;
        for (const m of dec.modules) {
          const alreadyHasFinish =
            /(freijo|nogueira|carvalho|branco|preto|grafite|chumbo|off\s*white|quartzo|cumaru|louro)/i.test(
              m.description,
            );
          const description =
            material && !alreadyHasFinish ? `${m.description} ${material}` : m.description;
          intents.push({
            tool: "insert_described",
            args: { description, count: m.count },
          });
        }
        return { type: "command", intents };
      }
    }
    // ROTA A.1: mesmo quando o verbo veio escrito como "faço/fazer/mandei fazer"
    // ou o usuário digitou uma frase curta sem verbo canônico, uma peça técnica
    // reconhecida deve continuar sendo inserção pontual — nunca preset genérico.
    if (!matchedPreset && !ambientWords) {
      const dec = decompose(raw);
      if (realModuleCount(dec.modules) <= 1 && dec.modules.length > 0) {
        const spec = buildFurnitureSpec(raw);
        if (spec.type) {
          return { type: "command", intents: [specToIntent(spec, dec.modules[0].count)] };
        }
      }
      if (dec.modules.length > 0 && dec.unresolved.length === 0) {
        const bp = buildBlueprint(raw);
        const material = bp.material;
        for (const m of dec.modules) {
          const alreadyHasFinish =
            /(freijo|nogueira|carvalho|branco|preto|grafite|chumbo|off\s*white|quartzo|cumaru|louro)/i.test(
              m.description,
            );
          const description =
            material && !alreadyHasFinish ? `${m.description} ${material}` : m.description;
          intents.push({
            tool: "insert_described",
            args: { description, count: m.count },
          });
        }
        return { type: "command", intents };
      }
    }
    // Se citou só o nome do ambiente (ex.: "cozinha moderna"), ou pediu
    // genericamente ("quero um projeto"), cria mesmo assim.
    if (matchedPreset || wantsCreate) {
      const preset = matchedPreset ?? "cozinha";
      const styleMatch = STYLES.find((s) => t.includes(norm(s)));
      // ── Nova arquitetura: IA constrói um Blueprint (spec técnica)
      // e o Planner Engine é o único responsável por gerar o projeto.
      // A IA nunca envia geometria — apenas a especificação validada.
      const bp = buildBlueprint(raw, { environment: preset });
      const validation = validateBlueprint(bp);
      if (!validation.ok && validation.ask) {
        // Blueprint incompleto — a IA PERGUNTA antes de executar.
        return { type: "unknown", reply: validation.ask };
      }
      const presetArgs = blueprintToPreset(bp);
      intents.push({
        tool: "create_room_preset",
        args: styleMatch ? { ...presetArgs, style: styleMatch } : presetArgs,
      });
      if (styleMatch)
        intents.push({
          tool: "set_style",
          args: { style: styleMatch === "clássico" ? "classico" : styleMatch },
        });
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
        if (
          key.includes("MDF") ||
          key.includes("MDP") ||
          key === "Quartzo" ||
          key === "Madeira maciça"
        ) {
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
    if (
      has(t, `deixe ${style}`, `deixa ${style}`, `estilo ${style}`, `faca ${style}`, `faz ${style}`)
    ) {
      intents.push({
        tool: "set_style",
        args: { style: style === "clássico" ? "classico" : style },
      });
    }
  }
  // ── Abrir/fechar portas e gavetas ──
  if (has(t, "abra todas as portas", "abrir portas", "abre as portas"))
    intents.push({ tool: "open_all", args: { target: "doors", open: true } });
  if (has(t, "feche todas as portas", "fechar portas"))
    intents.push({ tool: "open_all", args: { target: "doors", open: false } });
  if (has(t, "abra todas as gavetas", "abrir gavetas", "abre as gavetas"))
    intents.push({ tool: "open_all", args: { target: "drawers", open: true } });
  if (has(t, "feche todas as gavetas", "fechar gavetas"))
    intents.push({ tool: "open_all", args: { target: "drawers", open: false } });
  // ── LED ──
  if (has(t, "adicione led", "adicionar led", "liga led", "ligue led", "ligar led")) {
    intents.push({ tool: "toggle_led", args: { on: true } });
  }
  if (has(t, "desligar led", "desligue led", "apagar led", "apague led")) {
    intents.push({ tool: "toggle_led", args: { on: false } });
  }
  // ── Ferragens ──
  if (has(t, "troque puxadores", "trocar puxador", "muda puxador"))
    intents.push({
      tool: "change_hardware",
      args: { kind: "puxador", value: "dioris-perfil-linha" },
    });
  if (has(t, "troque ferragem", "troque ferragens", "trocar ferragem"))
    intents.push({ tool: "change_hardware", args: { kind: "dobradica", value: "blum-clip-top" } });
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
  if (has(t, "remova", "remover", "delete", "excluir", "apague"))
    intents.push({ tool: "remove", args: {} });
  if (has(t, "centralize", "centralizar", "centraliza")) intents.push({ tool: "center", args: {} });
  // ── Bancada / tampo ──
  if (has(t, "altere a bancada", "trocar bancada", "mude a bancada")) {
    intents.push({ tool: "change_material", args: { material: "Quartzo" } });
  }
  // ── Acabamento automático (preset coordenado) ──
  const FINISHING_MATCHERS = [
    {
      id: "louro-freijo-reeded",
      words: ["louro freijo", "louro-freijo", "freijo reeded", "freijo canelado"],
    },
    { id: "off-white-minimalista", words: ["off white", "off-white", "branco minimalista"] },
    {
      id: "carvalho-grafite-industrial",
      words: ["carvalho grafite", "grafite industrial", "industrial grafite"],
    },
    { id: "nogueira-luxo", words: ["nogueira luxo", "nogueira premium", "luxo nogueira"] },
    { id: "freijo-cumaru", words: ["freijo cumaru", "cumaru freijo"] },
  ];
  if (
    has(
      t,
      "acabamento",
      "aplique acabamento",
      "aplicar acabamento",
      "aplique o acabamento",
      "acabamento automatico",
      "harmonize",
      "harmonizar",
    )
  ) {
    const scope = has(t, "aereo", "aereos")
      ? "aereos"
      : has(t, "balcao", "balcoes")
        ? "balcoes"
        : has(t, "torre")
          ? "torre"
          : has(t, "painel")
            ? "painel"
            : has(t, "tampo", "bancada")
              ? "tampos"
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
  if (
    intents.length === 0 &&
    has(t, "adicione", "adicionar", "insira", "inserir", "coloque", "coloca", "adiciona")
  ) {
    for (const { subtype, words } of SUBTYPE_KEYWORDS) {
      if (words.some((w) => t.includes(w))) {
        const count = parseNumber(t.replace(/^\d+\s*[x×]?\s*/, "")) ?? 1;
        intents.push({ tool: "insert_item", args: { subtype, count: Math.min(10, count) } });
        break;
      }
    }
  }
  // ── Blueprint implícito ──
  // Pedidos curtos de módulo sem verbo/ambiente (ex.: "Roupeiro 6 portas")
  // ainda são comandos válidos. A IA interpreta intenção → Blueprint → Engine.
  if (intents.length === 0) {
    const bp = buildBlueprint(raw);
    const validation = validateBlueprint(bp);
    if (validation.ok && bp.modules.length > 0 && bp.unresolved.length === 0) {
      intents.push({
        tool: "create_room_preset",
        args: blueprintToPreset(bp),
      });
    }
  }
  if (intents.length > 0) return { type: "command", intents };
  return {
    type: "unknown",
    reply:
      "Ainda não entendi esse comando. Tente: 'crie uma cozinha moderna', 'troque para Freijó', 'abra todas as portas', 'centralize este armário'.",
  };
}
