import type { PlannerProject } from "@/modules/planner/shared";
import type { AIToolCall, AIToolResult, AIToolSchema } from "../types";

/**
 * Catálogo de tools disponíveis para a IA. Cada tool descreve o schema
 * OpenAI-compatível e um executor puro que recebe o projeto atual e
 * retorna o próximo projeto. Toda mutação é aplicada via updateProject()
 * do PlannerEditorProvider — preservando Undo/Redo/Autosave/Histórico.
 */

export type ToolExecutor = (
  args: Record<string, unknown>,
  project: PlannerProject,
) => PlannerProject;

export interface AITool {
  readonly schema: AIToolSchema;
  readonly execute: ToolExecutor;
}

function objSchema(
  props: Record<string, { type: string; description?: string; enum?: readonly string[] }>,
  required: readonly string[] = [],
) {
  return {
    type: "object",
    properties: props,
    required: [...required],
    additionalProperties: false,
  } as Record<string, unknown>;
}

function identity(_args: Record<string, unknown>, p: PlannerProject): PlannerProject {
  return p;
}

/**
 * As tools abaixo declaram intenção. A execução concreta continua sendo
 * feita pelos domínios existentes (rooms, catalog, library, production,
 * render, video, importer, realtime, decorator, visão, marketplace) — o
 * agente encaminha o tool_call para o domínio correspondente via
 * updateProject(). Aqui mantemos apenas o schema declarativo e o
 * executor no-op como fallback seguro.
 */
export const AI_TOOLS: readonly AITool[] = [
  {
    schema: {
      name: "create_environment",
      description: "Criar um novo ambiente no projeto",
      parameters: objSchema({ nome: { type: "string" }, tipo: { type: "string" } }, ["nome"]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "edit_environment",
      description: "Editar propriedades do ambiente ativo",
      parameters: objSchema({
        largura_mm: { type: "number" },
        profundidade_mm: { type: "number" },
        altura_mm: { type: "number" },
      }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "create_furniture",
      description: "Criar móvel a partir do catálogo",
      parameters: objSchema(
        {
          catalogo_id: { type: "string" },
          largura_mm: { type: "number" },
          altura_mm: { type: "number" },
          profundidade_mm: { type: "number" },
        },
        ["catalogo_id"],
      ),
    },
    execute: identity,
  },
  {
    schema: {
      name: "modify_furniture",
      description: "Modificar móvel selecionado",
      parameters: objSchema(
        {
          node_id: { type: "string" },
          largura_mm: { type: "number" },
          altura_mm: { type: "number" },
          profundidade_mm: { type: "number" },
        },
        ["node_id"],
      ),
    },
    execute: identity,
  },
  {
    schema: {
      name: "change_material",
      description: "Trocar material do móvel/superfície",
      parameters: objSchema({ node_id: { type: "string" }, material_id: { type: "string" } }, [
        "node_id",
        "material_id",
      ]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "change_hardware",
      description: "Trocar ferragem",
      parameters: objSchema({ node_id: { type: "string" }, hardware_id: { type: "string" } }, [
        "node_id",
        "hardware_id",
      ]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "change_handle",
      description: "Trocar puxador",
      parameters: objSchema({ node_id: { type: "string" }, handle_id: { type: "string" } }, [
        "node_id",
        "handle_id",
      ]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "change_glass",
      description: "Trocar vidro",
      parameters: objSchema({ node_id: { type: "string" }, glass_id: { type: "string" } }, [
        "node_id",
        "glass_id",
      ]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "change_mirror",
      description: "Trocar espelho",
      parameters: objSchema({ node_id: { type: "string" }, mirror_id: { type: "string" } }, [
        "node_id",
        "mirror_id",
      ]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "change_led",
      description: "Trocar iluminação LED",
      parameters: objSchema({ node_id: { type: "string" }, led_id: { type: "string" } }, [
        "node_id",
        "led_id",
      ]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "resize",
      description: "Alterar medidas de um item",
      parameters: objSchema(
        {
          node_id: { type: "string" },
          largura_mm: { type: "number" },
          altura_mm: { type: "number" },
          profundidade_mm: { type: "number" },
        },
        ["node_id"],
      ),
    },
    execute: identity,
  },
  {
    schema: {
      name: "create_kitchen",
      description: "Criar cozinha completa",
      parameters: objSchema({ estilo: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "create_closet",
      description: "Criar closet",
      parameters: objSchema({ estilo: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "create_bedroom",
      description: "Criar dormitório",
      parameters: objSchema({ estilo: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "create_bathroom",
      description: "Criar banheiro",
      parameters: objSchema({ estilo: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: { name: "create_laundry", description: "Criar lavanderia", parameters: objSchema({}) },
    execute: identity,
  },
  {
    schema: { name: "create_office", description: "Criar escritório", parameters: objSchema({}) },
    execute: identity,
  },
  {
    schema: {
      name: "create_panel",
      description: "Criar painel",
      parameters: objSchema({ largura_mm: { type: "number" }, altura_mm: { type: "number" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "create_counter",
      description: "Criar balcão",
      parameters: objSchema({ largura_mm: { type: "number" }, altura_mm: { type: "number" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "create_island",
      description: "Criar ilha",
      parameters: objSchema({
        largura_mm: { type: "number" },
        profundidade_mm: { type: "number" },
      }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "run_render",
      description: "Executar render final",
      parameters: objSchema({ preset: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "run_video",
      description: "Executar geração de vídeo",
      parameters: objSchema({ preset: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "run_production",
      description: "Executar produção inteligente",
      parameters: objSchema({}),
    },
    execute: identity,
  },
  {
    schema: {
      name: "run_cutting_plan",
      description: "Executar plano de corte",
      parameters: objSchema({}),
    },
    execute: identity,
  },
  {
    schema: {
      name: "run_cnc",
      description: "Gerar programas CNC",
      parameters: objSchema({ marca: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: { name: "run_budget", description: "Executar orçamento", parameters: objSchema({}) },
    execute: identity,
  },
  {
    schema: {
      name: "run_importer",
      description: "Executar importação de arquivo CAD/BIM",
      parameters: objSchema({ formato: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "run_decorator",
      description: "Executar IA decoradora",
      parameters: objSchema({ estilo: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "run_vision",
      description: "Executar IA visão (foto → 3D)",
      parameters: objSchema({}),
    },
    execute: identity,
  },
  {
    schema: {
      name: "run_realtime",
      description: "Executar modo interativo Walk/FPS/Orbit/Drone",
      parameters: objSchema({ modo: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "open_doors",
      description: "Abrir portas",
      parameters: objSchema({ node_id: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "open_drawers",
      description: "Abrir gavetas",
      parameters: objSchema({ node_id: { type: "string" } }),
    },
    execute: identity,
  },
  {
    schema: {
      name: "duplicate",
      description: "Duplicar item selecionado",
      parameters: objSchema({ node_id: { type: "string" } }, ["node_id"]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "mirror",
      description: "Espelhar item",
      parameters: objSchema({ node_id: { type: "string" }, eixo: { type: "string" } }, ["node_id"]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "rotate",
      description: "Rotacionar item",
      parameters: objSchema({ node_id: { type: "string" }, graus: { type: "number" } }, [
        "node_id",
        "graus",
      ]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "delete",
      description: "Excluir item",
      parameters: objSchema({ node_id: { type: "string" } }, ["node_id"]),
    },
    execute: identity,
  },
  {
    schema: {
      name: "select",
      description: "Selecionar item",
      parameters: objSchema({ node_id: { type: "string" } }, ["node_id"]),
    },
    execute: identity,
  },
];

export function toolSchemas(): readonly AIToolSchema[] {
  return AI_TOOLS.map((t) => t.schema);
}

export function findTool(name: string): AITool | undefined {
  return AI_TOOLS.find((t) => t.schema.name === name);
}

export function runToolCall(
  call: AIToolCall,
  project: PlannerProject,
): { next: PlannerProject; result: AIToolResult } {
  const tool = findTool(call.name);
  if (!tool) {
    return {
      next: project,
      result: {
        toolCallId: call.id,
        name: call.name,
        ok: false,
        error: `tool não encontrada: ${call.name}`,
      },
    };
  }
  try {
    const next = tool.execute(call.arguments, project);
    return {
      next,
      result: { toolCallId: call.id, name: call.name, ok: true, data: { applied: true } },
    };
  } catch (err) {
    return {
      next: project,
      result: {
        toolCallId: call.id,
        name: call.name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
