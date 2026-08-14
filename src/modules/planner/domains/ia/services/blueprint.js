import { listPrimitives } from "@/modules/planner/shared";
import { decompose } from "./decomposer";
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
// ─────────────────────────────────────────────────────────────────────────
// 1) Construção — linguagem natural → Blueprint
// ─────────────────────────────────────────────────────────────────────────
const STYLE_WORDS = [
  { style: "moderno", words: ["moderno", "moderna", "contemporane"] },
  { style: "minimalista", words: ["minimalista", "minimal", "clean"] },
  { style: "classico", words: ["classico", "clássico", "provençal", "provencal"] },
  { style: "industrial", words: ["industrial", "loft"] },
  { style: "luxo", words: ["luxo", "luxuos", "premium", "sofisticad"] },
];
const MATERIAL_WORDS = [
  { material: "Louro Freijó", words: ["louro freijo", "louro-freijo"] },
  { material: "Freijó", words: ["freijo"] },
  { material: "Nogueira", words: ["nogueira"] },
  { material: "Carvalho", words: ["carvalho"] },
  { material: "Branco Fosco", words: ["branco fosco", "off white", "off-white"] },
  { material: "Branco TX", words: ["branco tx", "branco", "branca"] },
  { material: "Grafite", words: ["grafite", "chumbo"] },
  { material: "Quartzo", words: ["quartzo"] },
  { material: "Preto Absoluto", words: ["preto absoluto", "preto", "preta"] },
];
function detectStyle(t) {
  for (const s of STYLE_WORDS) if (s.words.some((w) => t.includes(w))) return s.style;
  return undefined;
}
function detectMaterial(t) {
  for (const m of MATERIAL_WORDS) if (m.words.some((w) => t.includes(w))) return m.material;
  return undefined;
}
/**
 * Constrói o Blueprint a partir de um pedido em pt-BR.
 * Nunca inventa módulos: o que não casar vai para `unresolved` para a IA
 * perguntar antes de executar.
 */
export function buildBlueprint(input, override) {
  const t = norm(input);
  const dec = decompose(input);
  // Prioridade: override explícito > preset detectado pelo decompositor >
  // inferência por módulos declarados (roupeiro→dormitorio, painel→sala) >
  // default "cozinha".
  const environment =
    override?.environment ??
    dec.preset ??
    inferEnvironment(t) ??
    inferFromModules(dec) ??
    "cozinha";
  const style = detectStyle(t);
  const material = detectMaterial(t);
  const modules = dec.modules.map((m) => ({
    label: m.label,
    description: m.description,
    count: m.count,
    doors: m.doors,
    drawers: m.drawers,
    wall: m.wall,
    width: m.width,
    height: m.height,
    depth: m.depth,
  }));
  return {
    environment,
    style,
    material,
    modules,
    lighting: style === "industrial" ? "cool" : "warm",
    camera: "presentation",
    unresolved: dec.unresolved,
  };
}
function inferEnvironment(t) {
  if (/(cozinh)/.test(t)) return "cozinha";
  if (/(closet)/.test(t)) return "closet";
  if (/(quarto|dormit)/.test(t)) return "dormitorio";
  if (/(sala|living|estar)/.test(t)) return "sala";
  if (/(escritori|home office)/.test(t)) return "escritorio";
  if (/(banheir|lavab)/.test(t)) return "banheiro";
  if (/(lavanderi|area de servico)/.test(t)) return "lavanderia";
  return null;
}
/**
 * Quando o usuário cita um módulo sem nome de ambiente ("quero um roupeiro
 * de 6 portas"), inferimos o ambiente pelo tipo do módulo dominante.
 */
function inferFromModules(dec) {
  const labels = dec.modules.map((m) => m.label.toLowerCase());
  if (labels.some((l) => l.includes("roupeir"))) return "dormitorio";
  if (labels.some((l) => l.includes("closet"))) return "closet";
  if (labels.some((l) => l.includes("painel"))) return "sala";
  if (labels.some((l) => l.includes("espelho") || l.includes("nicho"))) return "banheiro";
  return null;
}
// ─────────────────────────────────────────────────────────────────────────
// 2) Validação — nunca executar Blueprint incompleto
// ─────────────────────────────────────────────────────────────────────────
const VALID_ENVS = new Set([
  "cozinha",
  "closet",
  "dormitorio",
  "sala",
  "escritorio",
  "banheiro",
  "lavanderia",
]);
export function validateBlueprint(bp) {
  const errors = [];
  if (!bp.environment) errors.push("Ambiente ausente.");
  else if (!VALID_ENVS.has(bp.environment))
    errors.push(`Ambiente desconhecido: ${bp.environment}.`);
  // Módulos vazios são aceitáveis (usuário disse "quero uma cozinha" —
  // o Engine aplica o blueprint padrão do ambiente). Só bloqueamos quando
  // veio um pedaço não resolvido junto, para não silenciar divergência.
  if (bp.unresolved.length > 0) {
    errors.push(`Não reconheci: ${bp.unresolved.slice(0, 3).join(", ")}.`);
  }
  // Sanidade de contagens.
  for (const m of bp.modules) {
    if (m.count < 1 || m.count > 20) errors.push(`${m.label}: quantidade inválida (${m.count}).`);
    if (m.doors != null && (m.doors < 1 || m.doors > 8))
      errors.push(`${m.label}: portas inválidas (${m.doors}).`);
    if (m.drawers != null && (m.drawers < 1 || m.drawers > 8))
      errors.push(`${m.label}: gavetas inválidas (${m.drawers}).`);
    if (m.width != null && (m.width < 150 || m.width > 5000))
      errors.push(`${m.label}: largura inválida (${m.width}mm).`);
    if (m.height != null && (m.height < 100 || m.height > 3200))
      errors.push(`${m.label}: altura inválida (${m.height}mm).`);
    if (m.depth != null && (m.depth < 30 || m.depth > 1400))
      errors.push(`${m.label}: profundidade inválida (${m.depth}mm).`);
  }
  const ok = errors.length === 0;
  const ask = ok
    ? undefined
    : bp.unresolved.length > 0
      ? `Não entendi "${bp.unresolved[0]}". Pode me dizer o tipo (aéreo, balcão, gaveteiro, torre, prateleira…) e a quantidade?`
      : undefined;
  return { ok, errors, ask };
}
/**
 * Traduz o Blueprint no args esperado pelo tool `create_room_preset` do
 * Planner Engine. Quando o usuário declarou módulos específicos, eles
 * substituem o blueprint padrão do ambiente (mantendo shell + decor).
 */
export function blueprintToPreset(bp) {
  // Enriquecemos a descrição com o material/cor global do blueprint,
  // desde que a descrição ainda não traga um acabamento explícito.
  // O matcher paramétrico usa a descrição para escolher item + finish,
  // então isso garante que "armário preto" chegue como "armário Preto
  // Absoluto" e não como armário genérico louro freijó.
  const material = bp.material;
  const hasFinish = (d) =>
    /(freijo|nogueira|carvalho|branco|preto|grafite|chumbo|off\s*white|quartzo|cumaru|louro)/i.test(
      d,
    );
  const pieces = bp.modules.map((m) => ({
    description:
      material && !hasFinish(m.description) ? `${m.description} ${material}` : m.description,
    count: m.count,
    wall: m.wall,
    width: m.width,
    height: m.height,
    depth: m.depth,
  }));
  return {
    preset: bp.environment,
    style: bp.style,
    ...(material ? { material } : {}),
    ...(pieces.length > 0 ? { pieces } : {}),
  };
}
/**
 * Compara o Blueprint com o projeto realmente montado pelo Engine.
 * Reporta divergências que a IA DEVE exibir ao usuário. Isso implementa
 * o "Modo Execução Rígida" da fase — tolerância zero para diferenças
 * silenciosas entre pedido e projeto entregue.
 */
export function auditBlueprint(project, bp) {
  const room = project.environments.flatMap((e) => e.rooms).find(Boolean);
  const placedLabels = [];
  if (room) {
    for (const p of listPrimitives(room)) {
      if (p.kind !== "furniture") continue;
      // params.label / params.subtype expõem o rótulo humano ou subtipo.
      const params = p.params ?? {};
      const lbl = String(params.label ?? params.subtype ?? p.kind);
      placedLabels.push(lbl);
    }
  }
  const missing = [];
  const notes = [];
  let requested = 0;
  for (const m of bp.modules) {
    requested += m.count;
    const needle = norm(m.label);
    const found = placedLabels.filter((l) => norm(l).includes(needle)).length;
    if (found < m.count) missing.push(`${m.label}: ${found}/${m.count}`);
    if (m.doors) notes.push(`${m.label}: ${m.doors} porta(s)`);
    if (m.drawers) notes.push(`${m.label}: ${m.drawers} gaveta(s)`);
  }
  return {
    ok: missing.length === 0,
    totalRequested: requested,
    totalPlaced: placedLabels.length,
    missing,
    extra: [],
    notes,
  };
}
/** Renderização humana da auditoria para o chat. */
export function formatAudit(audit) {
  if (audit.totalRequested === 0) {
    return `✔ Ambiente montado (${audit.totalPlaced} peças).`;
  }
  if (audit.ok) {
    return `✔ Auditoria Blueprint: ${audit.totalPlaced} peças, todos os módulos solicitados presentes.`;
  }
  return `⚠ Auditoria Blueprint: divergência — ${audit.missing.join("; ")}.`;
}
/** Descrição resumida do Blueprint (para debug / chat). */
export function describeBlueprint(bp) {
  const parts = [`ambiente=${bp.environment}`];
  if (bp.style) parts.push(`estilo=${bp.style}`);
  if (bp.material) parts.push(`material=${bp.material}`);
  if (bp.modules.length > 0) {
    const mods = bp.modules
      .map((m) => {
        const q = [`${m.count}×${m.label}`];
        if (m.doors) q.push(`${m.doors}p`);
        if (m.drawers) q.push(`${m.drawers}g`);
        return q.join(" ");
      })
      .join(", ");
    parts.push(`módulos=[${mods}]`);
  }
  return parts.join(" · ");
}
