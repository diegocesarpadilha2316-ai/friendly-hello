/**
 * Etapa 10 — extração automática de fatos confirmados.
 *
 * Fonte de verdade: (1) o **projeto real** após a execução das tools e
 * (2) as tool calls concluídas com sucesso. Mensagens de erro, respostas
 * canceladas, tentativas interrompidas, hipóteses e tool calls parciais
 * nunca viram memória. Do texto do usuário extraímos apenas preferências
 * e restrições explícitas (verbos de preferência/proibição).
 */
import type { PlannerProject } from "@/modules/planner/shared";
import type { MemoryFact, MemoryPending, ProjectMemory } from "./types";

export interface ExtractionInput {
  readonly userMessage: string;
  readonly project: PlannerProject;
  readonly environmentId: string | null;
  readonly roomId: string | null;
  /** Somente tool calls com status `ok`. */
  readonly toolCalls: readonly {
    name: string;
    args: Record<string, unknown>;
    agent?: string;
    message?: string;
  }[];
}

export interface ExtractionResult {
  readonly style: string | null;
  readonly environmentType: string | null;
  readonly materials: readonly MemoryFact[];
  readonly preferences: readonly MemoryFact[];
  readonly decisions: readonly MemoryFact[];
  readonly constraints: readonly MemoryFact[];
  readonly pendings: readonly MemoryPending[];
  readonly resolvedPendings: readonly string[];
  readonly stage: ProjectMemory["identity"]["stage"] | null;
}

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const STYLES = [
  "moderno",
  "classico",
  "industrial",
  "minimalista",
  "luxo",
  "rustico",
  "escandinavo",
  "contemporaneo",
] as const;

const MATERIAL_WORDS = [
  "freijo",
  "carvalho",
  "nogueira",
  "off white",
  "branco tx",
  "grafite",
  "preto",
  "cinza",
  "amendoa",
  "ipe",
  "canela",
  "marmore",
  "granito",
  "quartzo",
  "porcelanato",
  "laminado",
  "vinilico",
  "vidro",
  "reeded",
] as const;

const BRANDS = [
  "duratex",
  "arauco",
  "guararapes",
  "berneck",
  "eucatex",
  "sudati",
  "blum",
  "hettich",
  "hafele",
  "fgv",
  "grass",
  "portobello",
  "eliane",
] as const;

const now = () => new Date().toISOString();

function pretty(word: string): string {
  return word
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Escopo do material a partir dos argumentos reais da tool. */
function scopeOf(args: Record<string, unknown>): string {
  const raw = String(args.scope ?? args.target ?? args.subtype ?? "geral");
  const n = norm(raw);
  if (n.includes("port") || n.includes("frente") || n.includes("front")) return "frentes";
  if (n.includes("tampo") || n.includes("bancada")) return "tampo";
  if (n.includes("piso")) return "piso";
  if (n.includes("aereo")) return "aereos";
  if (n.includes("balcao")) return "balcoes";
  return "corpo";
}

export function extractMemory(input: ExtractionInput): ExtractionResult {
  const text = norm(input.userMessage);
  const materials: MemoryFact[] = [];
  const preferences: MemoryFact[] = [];
  const decisions: MemoryFact[] = [];
  const constraints: MemoryFact[] = [];
  const pendings: MemoryPending[] = [];
  const resolvedPendings: string[] = [];
  let style: string | null = null;
  let stage: ProjectMemory["identity"]["stage"] | null = null;

  // ---- Estilo: só quando declarado pelo usuário ou aplicado por tool.
  const styleFromTool = input.toolCalls.find((t) => t.name === "set_style")?.args?.style;
  if (typeof styleFromTool === "string") style = norm(styleFromTool);
  else {
    // Aceita flexão de gênero/número: "moderna", "clássicas", "industriais".
    const found = STYLES.find((s) => {
      const root = s.replace(/[oa]$/, "");
      return new RegExp(`\\b${root}(o|a|os|as|es|is)?\\b`).test(text);
    });
    if (found) style = found;
  }

  // ---- Ambiente ativo (fato do projeto, não do texto).
  const env = input.project.environments.find((e) => e.id === input.environmentId);
  const room = env?.rooms.find((r) => r.id === input.roomId);
  const environmentType = room?.type ?? input.project.briefing?.environmentType ?? null;

  // ---- Fatos vindos das tools confirmadas.
  for (const call of input.toolCalls) {
    const args = call.args ?? {};
    switch (call.name) {
      case "change_material":
      case "apply_finishing": {
        const value =
          (args.material as string | undefined) ??
          (args.preset as string | undefined) ??
          (args.finish as string | undefined);
        if (value)
          materials.push({
            key: `material:${scopeOf(args)}`,
            value: pretty(String(value)),
            origin: "tool",
            agent: call.agent,
            updatedAt: now(),
          });
        break;
      }
      case "change_color": {
        const value = args.color as string | undefined;
        if (value)
          materials.push({
            key: `cor:${scopeOf(args)}`,
            value: pretty(String(value)),
            origin: "tool",
            agent: call.agent,
            updatedAt: now(),
          });
        break;
      }
      case "set_front_type": {
        const value = args.frontType ?? args.type;
        if (value)
          decisions.push({
            key: "frente",
            value: `Frentes em ${pretty(String(value))}`,
            origin: "tool",
            agent: call.agent,
            updatedAt: now(),
          });
        break;
      }
      case "change_hardware": {
        const value = args.hardware ?? args.brand;
        if (value)
          materials.push({
            key: "ferragem",
            value: pretty(String(value)),
            origin: "tool",
            agent: call.agent,
            updatedAt: now(),
          });
        break;
      }
      case "toggle_led":
        decisions.push({
          key: "iluminacao:led",
          value: args.enabled === false ? "Sem LED nos módulos" : "LED aplicado nos módulos",
          origin: "tool",
          agent: call.agent,
          updatedAt: now(),
        });
        break;
      case "estimate_budget":
        stage = "orcamento";
        resolvedPendings.push("orcamento");
        break;
      case "production_summary":
      case "preliminary_cut_list":
        stage = "producao";
        resolvedPendings.push("producao");
        break;
      case "set_render_preset":
      case "set_camera":
        resolvedPendings.push("render");
        break;
      case "create_room_preset":
      case "insert_item":
      case "insert_described":
        stage = stage ?? "layout";
        break;
      default:
        break;
    }
  }

  // ---- Preferências e restrições explícitas do usuário.
  const prefer = /(prefiro|prefer|quero sempre|sempre use|gosto de|de prefer)/.test(text);
  const avoid = /(evite|evitar|nao quero|sem |nada de|nunca use|nao use)/.test(text);
  for (const word of MATERIAL_WORDS) {
    if (!text.includes(word)) continue;
    if (avoid)
      constraints.push({
        key: `evitar:${word}`,
        value: `Evitar ${pretty(word)}`,
        origin: "user",
        updatedAt: now(),
      });
    else if (prefer)
      preferences.push({
        key: `pref:${word}`,
        value: `Prefere ${pretty(word)}`,
        origin: "user",
        updatedAt: now(),
      });
  }
  for (const brand of BRANDS) {
    if (text.includes(brand) && !avoid)
      preferences.push({
        key: `marca:${brand}`,
        value: `Marca preferida: ${pretty(brand)}`,
        origin: "user",
        updatedAt: now(),
      });
  }
  if (/circulacao/.test(text) && !avoid)
    preferences.push({
      key: "pref:circulacao",
      value: "Manter circulação livre",
      origin: "user",
      updatedAt: now(),
    });
  if (/gaveta(s)? grande|gavetao/.test(text))
    preferences.push({
      key: "pref:gavetas",
      value: "Preferir gavetas grandes",
      origin: "user",
      updatedAt: now(),
    });

  // ---- Pendências: pedidas e ainda não executadas nesta rodada.
  const executed = new Set(input.toolCalls.map((t) => t.name));
  if (/orcamento|preco|valor|custo/.test(text) && !executed.has("estimate_budget"))
    pendings.push({ kind: "orcamento", label: "Orçamento pendente", updatedAt: now() });
  if (/render|imagem realista|foto/.test(text) && !executed.has("set_render_preset"))
    pendings.push({ kind: "render", label: "Render pendente", updatedAt: now() });
  if (
    /producao|corte|chapa|marcenaria industrial/.test(text) &&
    !executed.has("production_summary")
  )
    pendings.push({ kind: "producao", label: "Produção pendente", updatedAt: now() });

  return {
    style,
    environmentType,
    materials,
    preferences,
    decisions,
    constraints,
    pendings,
    resolvedPendings,
    stage,
  };
}
