/**
 * Etapa 9 — Registro canônico das ferramentas profissionais.
 *
 * Cada entrada declara schema estrito, agente proprietário, categoria,
 * flags de segurança e executor. Ferramentas legadas (Etapas anteriores)
 * entram aqui com schema de validação real e delegam a execução aos
 * executores puros de `services/tools.ts` — nenhuma lógica é duplicada.
 */
import { z } from "zod";
import type { PlannerProject } from "@/modules/planner/shared";
import {
  TOOL_FUNCTIONS,
  type ToolContext,
  type ToolExecutionResult,
  type ToolName,
} from "../services/tools";
import type { PlannerAgentId } from "../agents/types";
import {
  estimateBudget,
  preliminaryCutList,
  productionSummary,
  searchMaterialTool,
} from "./advisory";
import { checkCirculation, reviewProject } from "./inspection";
import { getScenePrefs, setScenePrefs, type RenderQuality } from "./scene-prefs";
import type { PlannerToolContract, PlannerToolOutcome, PlannerToolRunContext } from "./types";
import {
  LIMITS,
  dimensionMm,
  pointMm,
  positiveInt,
  shapeEnum,
  shortText,
  wallEnum,
} from "./validation";

const empty = () => z.object({}).strict();

/** Adapta um executor legado ao contrato padronizado. */
function legacy(
  name: ToolName,
  mutating: boolean,
): (args: unknown, run: PlannerToolRunContext) => PlannerToolOutcome {
  return (args, run) => {
    const fn = (TOOL_FUNCTIONS as Record<string, unknown>)[name] as
      | ((p: PlannerProject, c: ToolContext, a: unknown) => ToolExecutionResult)
      | undefined;
    if (!fn) {
      return { summary: `Ferramenta indisponível: ${name}.`, errorCode: "NOT_FOUND" };
    }
    const res = fn(run.project, run.ctx, args ?? {});
    // Ferramenta mutante que devolveu exatamente o projeto de entrada não
    // realizou a ação. Sem este marcador o runner convertia mensagens como
    // “sem cômodo ativo”/“item não encontrado” em sucesso e o chat dizia
    // “Pronto” apesar de nada ter mudado.
    const noChange = mutating && res.project === run.project;
    return {
      project: res.project,
      summary: res.summary,
      affectedIds: res.affectedIds,
      errorCode: noChange ? "NOT_FOUND" : undefined,
    };
  };
}

interface Meta {
  readonly description: string;
  readonly owner: PlannerAgentId;
  readonly category: PlannerToolContract["category"];
  readonly schema: z.ZodType<unknown>;
  readonly mutating?: boolean;
  readonly destructive?: boolean;
  readonly requiresProject?: boolean;
  readonly supportsPreview?: boolean;
  readonly singletonPerTurn?: boolean;
  readonly timeout?: number;
  readonly maxAffected?: number;
  readonly execute?: (args: never, run: PlannerToolRunContext) => PlannerToolOutcome;
}

function contract(name: ToolName, meta: Meta): PlannerToolContract {
  return {
    name,
    description: meta.description,
    ownerAgent: meta.owner,
    category: meta.category,
    inputSchema: meta.schema,
    mutating: meta.mutating ?? false,
    destructive: meta.destructive ?? false,
    requiresProject: meta.requiresProject ?? true,
    supportsPreview: meta.supportsPreview ?? false,
    supportsUndo: meta.mutating ?? false,
    singletonPerTurn: meta.singletonPerTurn ?? false,
    timeout: meta.timeout ?? 8_000,
    maxAffected: meta.maxAffected,
    execute: (meta.execute ?? legacy(name, meta.mutating ?? false)) as PlannerToolContract["execute"],
  };
}

/* ----------------------------- schemas ----------------------------- */

const layoutPieceSchema = () =>
  z
    .object({
      description: shortText(200),
      count: positiveInt(LIMITS.count).optional(),
      wall: wallEnum.optional(),
      width: dimensionMm(LIMITS.moduleWidth).optional(),
      height: dimensionMm(LIMITS.moduleHeight).optional(),
      depth: dimensionMm(LIMITS.moduleDepth).optional(),
    })
    .strict();

/* ---------------------------- contratos ---------------------------- */

function buildContracts(): readonly PlannerToolContract[] {
  return [
    // ───────────────── Designer ─────────────────
    contract("create_room_preset", {
      description:
        "Monta um ambiente completo (cozinha, closet, sala) com casca, módulos e decoração.",
      owner: "designer",
      category: "environment",
      mutating: true,
      supportsPreview: true,
      singletonPerTurn: true,
      timeout: 15_000,
      maxAffected: 120,
      schema: z
        .object({
          preset: shortText(60),
          style: shortText(40).optional(),
          material: shortText(80).optional(),
          pieces: z.array(layoutPieceSchema()).max(40).optional(),
        })
        .strict(),
    }),
    contract("layout_room", {
      description: "Distribui peças ao longo das paredes em configuração linear, L, U ou paralela.",
      owner: "designer",
      category: "layout",
      mutating: true,
      supportsPreview: true,
      timeout: 12_000,
      maxAffected: 80,
      schema: z
        .object({
          shape: shapeEnum,
          pieces: z.array(layoutPieceSchema()).min(1).max(40),
        })
        .strict(),
    }),
    contract("set_style", {
      description:
        "Harmoniza todo o cômodo em um estilo (minimalista, clássico, industrial, luxo, moderno).",
      owner: "designer",
      category: "layout",
      mutating: true,
      schema: z.object({ style: shortText(40) }).strict(),
    }),
    contract("center", {
      description: "Centraliza os módulos selecionados no cômodo.",
      owner: "designer",
      category: "layout",
      mutating: true,
      schema: empty(),
    }),
    contract("rotate", {
      description: "Gira os módulos selecionados em graus.",
      owner: "designer",
      category: "layout",
      mutating: true,
      schema: z
        .object({
          degrees: z
            .number()
            .refine((n) => Number.isFinite(n), "ângulo inválido")
            .transform((n) => ((Math.round(n) % 360) + 360) % 360),
        })
        .strict(),
    }),
    contract("mirror", {
      description: "Espelha os módulos selecionados.",
      owner: "designer",
      category: "layout",
      mutating: true,
      schema: empty(),
    }),
    contract("panel_ripado", {
      description: "Insere um painel ripado decorativo.",
      owner: "designer",
      category: "furniture",
      mutating: true,
      schema: z
        .object({
          width: dimensionMm(LIMITS.moduleWidth).optional(),
          height: dimensionMm(LIMITS.moduleHeight).optional(),
        })
        .strict(),
    }),
    contract("check_circulation", {
      description:
        "Verifica passagens, área livre e módulos fora dos limites do ambiente. Consultiva.",
      owner: "designer",
      category: "inspection",
      schema: empty(),
      execute: (_args, run) => {
        const report = checkCirculation(run.project, run.ctx);
        return {
          summary: report.ok
            ? `Circulação adequada — ${Math.round(report.freeAreaRatio * 100)}% de área livre.`
            : `Circulação com ${report.findings.length} ponto(s) de atenção.`,
          warnings: report.findings.filter((f) => f.severity !== "info").map((f) => f.title),
          data: report,
        };
      },
    }),
    contract("review_project", {
      description:
        "Revisão completa e estruturada do projeto: limites, dimensões, colisões, materiais, identificação, aberturas, circulação e prontidão para orçamento/produção/render. Nunca corrige sozinha.",
      owner: "designer",
      category: "inspection",
      timeout: 12_000,
      schema: empty(),
      execute: (_args, run) => {
        const report = reviewProject(run.project, run.ctx);
        return {
          summary: `Revisão concluída — ${report.counts.error} erro(s), ${report.counts.warning} aviso(s), ${report.counts.info} observação(ões).`,
          warnings: report.findings.filter((f) => f.severity === "error").map((f) => f.title),
          data: report,
        };
      },
    }),

    // ──────────────── Marceneiro ────────────────
    contract("insert_item", {
      description: "Insere um item do catálogo pelo id ou subtipo.",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      maxAffected: 20,
      schema: z
        .object({
          catalogItemId: shortText(80).optional(),
          subtype: shortText(40).optional(),
          count: positiveInt(LIMITS.count).optional(),
          at: pointMm.optional(),
        })
        .strict()
        .refine((a) => Boolean(a.catalogItemId || a.subtype), {
          message: "informe catalogItemId ou subtype",
        }),
    }),
    contract("insert_described", {
      description:
        "Casa uma descrição livre com um item real do catálogo e insere com medidas e acabamento.",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      maxAffected: 20,
      schema: z
        .object({
          description: shortText(300),
          count: positiveInt(LIMITS.count).optional(),
          width: dimensionMm(LIMITS.moduleWidth).optional(),
          height: dimensionMm(LIMITS.moduleHeight).optional(),
          depth: dimensionMm(LIMITS.moduleDepth).optional(),
          at: pointMm.optional(),
          params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
        })
        .strict(),
    }),
    contract("resize", {
      description: "Altera largura, profundidade e altura em mm (ou por fator).",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      schema: z
        .object({
          factor: z.number().min(0.2).max(5).optional(),
          width: dimensionMm(LIMITS.moduleWidth).optional(),
          height: dimensionMm(LIMITS.moduleHeight).optional(),
          depth: dimensionMm(LIMITS.moduleDepth).optional(),
        })
        .strict()
        .refine((a) => a.factor || a.width || a.height || a.depth, {
          message: "informe ao menos uma medida ou fator",
        }),
    }),
    contract("convert_to", {
      description: "Converte o módulo selecionado em outro tipo preservando posição.",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      schema: z
        .object({
          description: shortText(200).optional(),
          subtype: shortText(40).optional(),
          catalogItemId: shortText(80).optional(),
        })
        .strict()
        .refine((a) => Boolean(a.description || a.subtype || a.catalogItemId), {
          message: "informe descrição, subtipo ou item",
        }),
    }),
    contract("set_front_type", {
      description: "Troca a frente para vidro, reeded, sólido ou aberto.",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      schema: z
        .object({
          type: z.enum(["vidro", "reeded", "solid", "aberto"]),
          subtype: shortText(40).optional(),
        })
        .strict(),
    }),
    contract("change_hardware", {
      description: "Define puxador, dobradiça, corrediça ou pistão.",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      schema: z
        .object({
          kind: z.enum(["puxador", "dobradica", "corredica", "pistao"]),
          value: shortText(80),
        })
        .strict(),
    }),
    contract("duplicate", {
      description: "Duplica os módulos selecionados.",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      schema: empty(),
    }),
    contract("remove", {
      description: "Remove os módulos selecionados. Destrutiva — exige confirmação.",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      destructive: true,
      supportsPreview: true,
      schema: empty(),
    }),
    contract("open_all", {
      description: "Abre ou fecha portas e gavetas (visualização).",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      schema: z
        .object({
          target: z.enum(["doors", "drawers", "all"]),
          open: z.boolean(),
        })
        .strict(),
    }),

    // ───────────────── Materiais ─────────────────
    contract("search_material", {
      description:
        "Busca acabamentos REAIS no catálogo de chapas por nome e marca. Use antes de aplicar material — nunca invente acabamento.",
      owner: "materiais",
      category: "materials",
      requiresProject: false,
      schema: z.object({ query: shortText(120), brand: shortText(60).optional() }).strict(),
      execute: (args, run) => {
        const { query, brand } = args as { query: string; brand?: string };
        void run;
        const res = searchMaterialTool(query, brand);
        return {
          summary: res.note,
          warnings: res.ambiguous ? ["Resultado ambíguo — peça ao usuário para escolher."] : [],
          data: res,
          errorCode: res.matches.length === 0 ? "NOT_FOUND" : undefined,
        };
      },
    }),
    contract("change_material", {
      description: "Aplica material/chapa aos módulos alvo.",
      owner: "materiais",
      category: "materials",
      mutating: true,
      schema: z.object({ material: shortText(120) }).strict(),
    }),
    contract("change_color", {
      description: "Aplica cor/acabamento aos módulos alvo.",
      owner: "materiais",
      category: "materials",
      mutating: true,
      schema: z.object({ color: shortText(120) }).strict(),
    }),
    contract("apply_finishing", {
      description: "Aplica um preset coordenado de acabamento em todo o cômodo ou num escopo.",
      owner: "materiais",
      category: "materials",
      mutating: true,
      supportsPreview: true,
      schema: z
        .object({
          preset: shortText(60),
          scope: shortText(40).optional(),
        })
        .strict(),
    }),
    contract("set_module_params", {
      description:
        "Altera apenas os atributos citados do módulo (portas, abertura, gavetas, prateleiras, divisões, maleiro, cabideiros, nichos, espelho, puxador).",
      owner: "marceneiro",
      category: "furniture",
      mutating: true,
      schema: z
        .object({
          doors: z.number().int().min(0).max(8).optional(),
          drawers: z.number().int().min(0).max(12).optional(),
          shelves: z.number().int().min(0).max(20).optional(),
          divisions: z.number().int().min(0).max(12).optional(),
          opening: z
            .enum(["abrir", "correr", "sanfonada", "basculante", "sem-porta"])
            .optional(),
          maleiro: z.boolean().optional(),
          cabideiros: z.number().int().min(0).max(8).optional(),
          nichos: z.number().int().min(0).max(20).optional(),
          mirror: z.boolean().optional(),
          mirrorPosition: z.enum(["central", "todas", "lateral", "interna"]).optional(),
          handle: shortText(40).optional(),
        })
        .strict(),
    }),

    // ─────────────── Orçamentista ────────────────
    contract("estimate_budget", {
      description:
        "Estimativa por categoria (chapas, fita, ferragens, serviços) a partir da decomposição real. Nunca inventa preço: o que não tem valor no catálogo é declarado como pendência.",
      owner: "orcamentista",
      category: "budget",
      timeout: 12_000,
      schema: empty(),
      execute: (_args, run) => {
        const est = estimateBudget(run.project, run.ctx, run.rules);
        return {
          summary: est.partial
            ? `Estimativa parcial — R$ ${est.totalKnownBRL.toFixed(2)} em itens com preço; ${est.pendingCategories.length} categoria(s) sem tabela de preço.`
            : `Estimativa: R$ ${est.totalKnownBRL.toFixed(2)}.`,
          warnings: est.partial ? [est.disclaimer] : [],
          data: est,
        };
      },
    }),

    // ───────────────── Produção ──────────────────
    contract("production_summary", {
      description:
        "Resumo de produção: módulos, peças, área de chapa e metros de fita, com pendências.",
      owner: "producao",
      category: "production",
      timeout: 12_000,
      schema: empty(),
      execute: (_args, run) => {
        const s = productionSummary(run.project, run.ctx, run.rules);
        return {
          summary: `${s.moduleCount} módulo(s), ${s.partCount} peça(s), ${s.boardAreaM2} m² de chapa e ${s.edgeMeters} m de fita.`,
          warnings: s.pendings,
          data: s,
        };
      },
    }),
    contract("preliminary_cut_list", {
      description:
        "Lista de corte PRELIMINAR derivada da decomposição real. Não substitui o plano de corte oficial.",
      owner: "producao",
      category: "production",
      timeout: 15_000,
      schema: empty(),
      execute: (_args, run) => {
        const list = preliminaryCutList(run.project, run.ctx, run.rules);
        return {
          summary: `Lista preliminar com ${list.totalPieces} peça(s)${list.truncated ? " (exibindo as primeiras)" : ""}.`,
          warnings: [list.note],
          data: list,
        };
      },
    }),

    // ────────────────── Render ───────────────────
    contract("toggle_led", {
      description: "Liga/desliga LEDs dos módulos ou adiciona fita de LED ambiente.",
      owner: "render",
      category: "render",
      mutating: true,
      schema: z.object({ on: z.boolean() }).strict(),
    }),
    contract("set_render_preset", {
      description:
        "Define preset de cena (qualidade, iluminação, exposição) para a pré-visualização. Não persiste no projeto.",
      owner: "render",
      category: "render",
      schema: z
        .object({
          quality: z.enum(["rascunho", "baixa", "media", "alta", "ultra"]).optional(),
          lighting: z.enum(["natural", "cenica", "noturna", "estudio"]).optional(),
          exposure: z.number().min(0.2).max(3).optional(),
        })
        .strict()
        .refine((a) => a.quality || a.lighting || a.exposure !== undefined, {
          message: "informe qualidade, iluminação ou exposição",
        }),
      execute: (args, run) => {
        const a = args as {
          quality?: RenderQuality;
          lighting?: "natural" | "cenica" | "noturna" | "estudio";
          exposure?: number;
        };
        const prefs = setScenePrefs(run.project.id, {
          ...(a.quality ? { quality: a.quality, preset: a.quality } : {}),
          ...(a.lighting ? { lighting: a.lighting } : {}),
          ...(a.exposure !== undefined ? { exposure: a.exposure } : {}),
        });
        return {
          summary: `Cena ajustada — qualidade ${prefs.quality}, iluminação ${prefs.lighting}, exposição ${prefs.exposure}.`,
          warnings: ["Preset de cena vale para a pré-visualização atual e não é salvo no projeto."],
          data: prefs,
        };
      },
    }),
    contract("set_camera", {
      description:
        "Ajusta a câmera da pré-visualização (altura do olho e abertura). Não persiste no projeto.",
      owner: "render",
      category: "render",
      schema: z
        .object({
          heightMm: dimensionMm({ min: 300, max: 4000 }).optional(),
          fov: z.number().min(15).max(110).optional(),
        })
        .strict()
        .refine((a) => a.heightMm !== undefined || a.fov !== undefined, {
          message: "informe altura ou abertura da câmera",
        }),
      execute: (args, run) => {
        const a = args as { heightMm?: number; fov?: number };
        const prefs = setScenePrefs(run.project.id, {
          ...(a.heightMm !== undefined ? { cameraHeightMm: a.heightMm } : {}),
          ...(a.fov !== undefined ? { cameraFov: Math.round(a.fov) } : {}),
        });
        return {
          summary: `Câmera a ${prefs.cameraHeightMm} mm com abertura de ${prefs.cameraFov}°.`,
          data: prefs,
        };
      },
    }),
  ];
}

/** Construção preguiçosa — evita ciclos de import na inicialização. */
let cache: readonly PlannerToolContract[] | null = null;
function contracts(): readonly PlannerToolContract[] {
  if (!cache) cache = buildContracts();
  return cache;
}

export function getToolContract(name: string): PlannerToolContract | null {
  return contracts().find((c) => c.name === name) ?? null;
}

export function listToolContracts(): readonly PlannerToolContract[] {
  return contracts();
}

/** Ownership derivado do contrato — fonte única para o roteador. */
export function contractOwner(name: string): PlannerAgentId | null {
  return getToolContract(name)?.ownerAgent ?? null;
}

export { getScenePrefs };
