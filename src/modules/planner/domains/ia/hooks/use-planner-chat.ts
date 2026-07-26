/**
 * `usePlannerChat` — hook único do chat da IA.
 *
 * Consome exclusivamente o `PlannerEditorProvider` (nada de store nova) e
 * mantém em memória a conversa daquela sessão. Mudanças no projeto
 * passam por `updateProject`, herdando Undo/Redo, Autosave, Histórico e
 * a sincronização 2D/3D/Engenharia.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { aiGenerateText, aiGenerateJson } from "@/core/ai";
import { useTenant } from "@/core/providers/TenantProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { createProjectRow } from "@/lib/planner-projects.functions";
import { saveProjectSnapshot, type JsonObject } from "@/lib/planner-snapshots.functions";
import {
  createEnvironment,
  createProject,
  ensureProjectRoomShells,
  createRoom,
  upsertProject,
  usePlannerEditor,
  loadRules,
} from "@/modules/planner/shared";
import { runAgent } from "../services/agent";
import { PLANNER_TOOL_REGISTRY } from "../services/tools";
import { FINISHING_PRESETS } from "../services/finishing";
import type { ParsedIntent } from "../services/interpreter";
import type { PlannerProject, PlannerRoomType } from "@/modules/planner/shared";
import type { ToolContext } from "../services/tools";
import type {
  PlannerAIMessage,
  PlannerAIStatus,
  PlannerAIToolCall,
  PlannerAIQuickAction,
} from "../types";

const uid = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

/**
 * Fallback direto para o proxy público `/api/ai/chat` (Lovable AI).
 * Usado quando a chamada via `aiGenerateText`/`aiGenerateJson` falha
 * (ex.: tenant não selecionado, créditos, RLS). Garante que a IA de
 * teste sempre responda.
 */
async function callLovableProxy(
  system: string,
  prompt: string,
  opts: { json?: boolean; maxTokens?: number; temperature?: number; signal?: AbortSignal } = {},
): Promise<string | null> {
  try {
    const body: Record<string, unknown> = {
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: opts.temperature ?? 0.4,
    };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
    if (opts.json) body.response_format = { type: "json_object" };
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok) {
      console.warn("[planner-chat] proxy /api/ai/chat falhou", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn("[planner-chat] proxy /api/ai/chat erro", e);
    return null;
  }
}

/** Prompt de sistema mínimo que dá contexto do projeto/cômodo ativo ao LLM. */
function buildPlannerSystemPrompt(
  p: PlannerProject,
  ctx: ToolContext,
): string {
  const env = p.environments.find((e) => e.id === ctx.environmentId);
  const room = env?.rooms.find((r) => r.id === ctx.roomId);
  const briefing = p.briefing
    ? `Briefing: estilo=${p.briefing.style ?? "—"}, ambiente=${p.briefing.environmentType ?? "—"}, área=${p.briefing.areaM2 ?? "—"}m², orçamento=${p.briefing.budget ?? "—"}.`
    : "";
  return [
    "Você é a IA Copiloto do Dioris Planner — um sistema paramétrico de marcenaria em pt-BR.",
    "Responda em português, de forma objetiva e prática, focando marcenaria, ergonomia e produção.",
    `Projeto ativo: "${p.name}" (v${p.version}).`,
    env ? `Ambiente ativo: "${env.name}".` : "Nenhum ambiente selecionado.",
    room ? `Cômodo ativo: "${room.name}" (${room.dimensions.width}×${room.dimensions.depth}×${room.dimensions.height} mm).` : "Nenhum cômodo selecionado.",
    briefing,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPlannerNoContextSystemPrompt(project: PlannerProject | null | undefined): string {
  const projectContext = project
    ? [
        `Existe um projeto carregado: "${project.name}" (v${project.version}).`,
        `Ambientes disponíveis: ${project.environments.map((env) => env.name).join(", ") || "nenhum"}.`,
        "Nenhum cômodo está selecionado no editor neste momento.",
      ].join("\n")
    : "Nenhum projeto está aberto no editor neste momento.";

  return [
    "Você é a IA Copiloto do Dioris Planner — um sistema paramétrico de marcenaria, interiores e produção em pt-BR.",
    "Responda normalmente ao usuário. Não repita a frase fixa 'Abra um projeto e selecione um cômodo'.",
    "Se o usuário pedir criação/edição de projeto sem contexto ativo, entregue um plano útil, materiais sugeridos e próximos passos; explique de forma curta que para aplicar no editor ele precisa abrir/criar um projeto e selecionar um cômodo.",
    "Use a biblioteca Dioris como base: MDF/MDP premium, Louro Freijó, Duratex, Arauco, Guararapes, ferragens Blum/Hettich, LED, portas de vidro, pisos, janelas e decoração.",
    projectContext,
  ].join("\n");
}

function normalizePrompt(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferRoomType(prompt: string): PlannerRoomType {
  const normalized = normalizePrompt(prompt);
  if (normalized.includes("cozinha")) return "cozinha";
  if (normalized.includes("closet")) return "closet";
  if (normalized.includes("banheiro") || normalized.includes("lavabo")) return "banheiro";
  if (normalized.includes("quarto") || normalized.includes("dormitorio")) return "dormitorio";
  if (normalized.includes("sala") || normalized.includes("living")) return "sala";
  if (normalized.includes("escritorio") || normalized.includes("home office")) return "escritorio";
  if (normalized.includes("lavanderia")) return "lavanderia";
  return "cozinha";
}

function labelForRoomType(type: PlannerRoomType): string {
  const labels: Record<PlannerRoomType, string> = {
    closet: "Closet",
    dormitorio: "Dormitório",
    banheiro: "Banheiro",
    lavanderia: "Lavanderia",
    escritorio: "Home Office",
    cozinha: "Cozinha",
    sala: "Sala",
    comercial: "Comercial",
    corporativo: "Corporativo",
    outro: "Ambiente",
  };
  return labels[type];
}

function ensureOperablePlannerContext(
  current: PlannerProject | null,
  selectedEnvironmentId: string | null,
  selectedRoomId: string | null,
  meta: { prompt: string; tenantId: string; ownerId: string },
): { project: PlannerProject; environmentId: string; roomId: string; changed: boolean } {
  const roomType = inferRoomType(meta.prompt);
  const fallbackProject =
    current ??
    createProject({
      tenantId: meta.tenantId,
      ownerId: meta.ownerId,
      name: `Projeto IA — ${labelForRoomType(roomType)}`,
      briefing: {
        environmentType: roomType,
        style: normalizePrompt(meta.prompt).includes("classico") ? "classico" : "moderno",
        notes: meta.prompt,
      },
    });

  const selectedEnv = selectedEnvironmentId
    ? fallbackProject.environments.find((env) => env.id === selectedEnvironmentId)
    : null;
  const selectedRoom = selectedEnv && selectedRoomId
    ? selectedEnv.rooms.find((room) => room.id === selectedRoomId)
    : null;

  if (selectedEnv && selectedRoom) {
    return {
      project: fallbackProject,
      environmentId: selectedEnv.id,
      roomId: selectedRoom.id,
      changed: false,
    };
  }

  const env = selectedEnv ?? fallbackProject.environments[0] ?? createEnvironment({ name: "Ambiente principal" });
  const room = selectedRoom ?? env.rooms[0] ?? createRoom({
    name: labelForRoomType(roomType),
    type: roomType,
    width: roomType === "cozinha" ? 4200 : 3600,
    depth: roomType === "cozinha" ? 3200 : 3000,
    height: 2700,
  });

  const envWithRoom = env.rooms.some((r) => r.id === room.id)
    ? env
    : { ...env, rooms: [...env.rooms, room], updatedAt: new Date().toISOString() };
  const hasEnv = fallbackProject.environments.some((item) => item.id === envWithRoom.id);
  const project = {
    ...fallbackProject,
    environments: hasEnv
      ? fallbackProject.environments.map((item) => item.id === envWithRoom.id ? envWithRoom : item)
      : [...fallbackProject.environments, envWithRoom],
  };

  return {
    project,
    environmentId: envWithRoom.id,
    roomId: room.id,
    changed: true,
  };
}

export const PLANNER_QUICK_ACTIONS: readonly PlannerAIQuickAction[] = [
  { id: "kitchen", label: "Crie uma cozinha moderna", prompt: "Crie uma cozinha moderna com ilha e LED." },
  { id: "closet", label: "Crie um closet", prompt: "Crie um closet completo minimalista." },
  { id: "freijo", label: "Troque para Freijó", prompt: "Troque o MDF para Freijó." },
  { id: "open-doors", label: "Abra todas as portas", prompt: "Abra todas as portas." },
  { id: "led", label: "Adicione LED", prompt: "Adicione LED em todos os móveis." },
  { id: "ripado", label: "Painel ripado", prompt: "Faça um painel ripado até o teto." },
  { id: "quote", label: "Qual o valor estimado?", prompt: "Qual o valor estimado do projeto?" },
  { id: "board", label: "Quanto de chapa?", prompt: "Quanto de chapa será utilizado?" },
];

interface ChatState {
  messages: PlannerAIMessage[];
  status: PlannerAIStatus;
}

export function usePlannerChat() {
  const editor = usePlannerEditor();
  const { activeCompany } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tenantId = activeCompany?.id ?? "anonymous";
  const ownerId = user?.id ?? "anonymous";
  const runAI = useServerFn(aiGenerateText);
  const runAIJson = useServerFn(aiGenerateJson);
  const createProjectOnServer = useServerFn(createProjectRow);
  const saveSnapshotOnServer = useServerFn(saveProjectSnapshot);

  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: uid(),
        role: "assistant",
        content:
          "Olá! Eu sou a IA do Dioris Planner. Posso criar ambientes inteiros, editar móveis, trocar materiais, abrir portas, gerar orçamento e responder qualquer coisa sobre o projeto. É só me contar o que você imagina.",
        createdAt: new Date().toISOString(),
        status: "done",
      },
    ],
    status: "idle",
  });

  const abortRef = useRef<AbortController | null>(null);

  const patchMessage = useCallback((id: string, patch: (m: PlannerAIMessage) => PlannerAIMessage) => {
    setState((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? patch(m) : m)) }));
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || state.status === "streaming" || state.status === "thinking") return;

      const userMsg: PlannerAIMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        status: "done",
      };
      const assistantId = uid();
      const assistantMsg: PlannerAIMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        status: "thinking",
        toolCalls: [],
      };

      setState((s) => ({
        messages: [...s.messages, userMsg, assistantMsg],
        status: "thinking",
      }));

      const boot = ensureOperablePlannerContext(
        editor.state.project,
        editor.state.selectedEnvironmentId,
        editor.state.selectedRoomId,
        { prompt: trimmed, tenantId, ownerId },
      );
      const startedWithoutProject = !editor.state.project;
      const shouldOpenEditorAfterCreate =
        startedWithoutProject || pathname.endsWith("/planner/projetos/novo");
      const operableProject = ensureProjectRoomShells(boot.project);
      if (boot.changed || operableProject !== boot.project) {
        if (editor.state.project) editor.updateProject(() => operableProject);
        else editor.loadProject(operableProject);
        editor.select({ environmentId: boot.environmentId, roomId: boot.roomId });
      }

      const project = operableProject;
      const activeEnvironmentId = boot.environmentId;
      const activeRoomId = boot.roomId;

      const controller = new AbortController();
      abortRef.current = controller;
      const rules = loadRules(tenantId);

      try {
        setState((s) => ({ ...s, status: "streaming" }));
        let buffer = "";
        let mutatedProject = project;
        const toolCalls: PlannerAIToolCall[] = [];

        for await (const chunk of runAgent({
          message: trimmed,
          project,
          ctx: {
            environmentId: activeEnvironmentId,
            roomId: activeRoomId,
          },
          rules,
          signal: controller.signal,
          llmPlan: async ({ userMessage, project: p, ctx }) => {
            try {
              const catalog = PLANNER_TOOL_REGISTRY.map(
                (t) => `- ${t.name}: ${t.description}`,
              ).join("\n");
              const system =
                "Você é o planejador do Dioris Planner. Traduza o pedido do usuário em uma sequência de chamadas de ferramentas (tool-calling). Responda SOMENTE com JSON válido no formato { \"intents\": [{ \"tool\": string, \"args\": object }] }. Não inclua explicações. Use apenas ferramentas da lista.\n\nFerramentas disponíveis:\n" +
                catalog +
                "\n\nSubtypes válidos para insert_item/set_front_type: aereo, balcao, gaveteiro, torre, tampo, ilha, painel, roupeiro, closet, nicho, prateleira, cristaleira, bancada, espelho, porta, gaveta, iluminacao.\nPresets válidos para create_room_preset: cozinha, closet, dormitorio, sala, escritorio, banheiro.\nEstilos válidos para set_style: minimalista, classico, industrial, luxo, moderno.\nTipos válidos para set_front_type: vidro, reeded, solid, aberto.\nPresets de apply_finishing (arg 'preset'): " +
                FINISHING_PRESETS.map((p) => `"${p.id}" (${p.label})`).join(", ") +
                ".\nEscopos de apply_finishing (arg 'scope'): all, aereos, balcoes, torre, painel, tampos.";
              const prompt = `Projeto: "${p.name}". Cômodo: "${p.environments.find((e) => e.id === ctx.environmentId)?.rooms.find((r) => r.id === ctx.roomId)?.name ?? "—"}".\nPedido do usuário: ${userMessage}`;
              let raw: unknown = null;
              try {
                const res = await runAIJson({
                  data: {
                    task: { type: "json", quality: "standard", speed: "balanced" },
                    system,
                    prompt,
                    temperature: 0.2,
                    maxTokens: 800,
                    reason: "planner:tool-plan",
                  },
                });
                raw = res?.output;
              } catch (e) {
                console.warn("[planner-chat] gateway com tenant falhou, usando proxy Lovable", e);
                raw = await callLovableProxy(system, prompt, { json: true, maxTokens: 800, temperature: 0.2 });
              }
              const parsed = typeof raw === "string" ? safeJson(raw) : raw;
              const intents = (parsed as { intents?: unknown } | null)?.intents;
              if (!Array.isArray(intents)) return null;
              return intents
                .filter(
                  (i): i is ParsedIntent =>
                    !!i && typeof i === "object" && typeof (i as ParsedIntent).tool === "string",
                )
                .map((i) => ({
                  tool: (i as ParsedIntent).tool,
                  args:
                    (i as ParsedIntent).args && typeof (i as ParsedIntent).args === "object"
                      ? (i as ParsedIntent).args
                      : {},
                }));
            } catch {
              return null;
            }
          },
          llmReply: async ({ userMessage, role, project: p, ctx }) => {
            // 1) tenta o AI Gateway com tenant (créditos + auditoria)
            // 2) fallback direto no proxy público Lovable (garante resposta em modo teste)
            const system = buildPlannerSystemPrompt(p, ctx);
            const prompt = `Usuário (${role}): ${userMessage}`;
            try {
              const res = await runAI({
                data: {
                  task: { type: "text", quality: "standard", speed: "balanced" },
                  system,
                  prompt,
                  temperature: 0.4,
                  maxTokens: 500,
                },
              });
              if (typeof res?.output === "string" && res.output.trim().length > 0) {
                return res.output;
              }
            } catch (e) {
              console.warn("[planner-chat] gateway com tenant falhou, usando proxy Lovable", e);
            }
            return await callLovableProxy(system, prompt, { maxTokens: 500, temperature: 0.4 });
          },
        })) {
          if (controller.signal.aborted) break;
          if (chunk.kind === "text" && chunk.text) {
            buffer += chunk.text;
            patchMessage(assistantId, (m) => ({ ...m, content: buffer, status: "streaming" }));
          } else if (chunk.kind === "tool" && chunk.toolName) {
            const existing = toolCalls.find((t) => t.status === "pending" && t.name === chunk.toolName);
            if (chunk.toolResult) {
              // resultado — atualiza projeto e marca a tool como ok
              mutatedProject = chunk.toolResult.project;
              const call: PlannerAIToolCall = {
                id: uid(),
                name: chunk.toolName,
                args: chunk.toolArgs ?? {},
                status: "ok",
                message: chunk.toolResult.summary,
                executedAt: new Date().toISOString(),
              };
              if (existing) {
                const idx = toolCalls.indexOf(existing);
                toolCalls[idx] = call;
              } else {
                toolCalls.push(call);
              }
            } else {
              toolCalls.push({
                id: uid(),
                name: chunk.toolName,
                args: chunk.toolArgs ?? {},
                status: "pending",
                executedAt: new Date().toISOString(),
              });
            }
            patchMessage(assistantId, (m) => ({ ...m, toolCalls: [...toolCalls] }));
          } else if (chunk.kind === "done") {
            if (chunk.toolResult) mutatedProject = chunk.toolResult.project;
            patchMessage(assistantId, (m) => ({ ...m, status: "done" }));
          } else if (chunk.kind === "error") {
            patchMessage(assistantId, (m) => ({ ...m, status: "error", content: chunk.text ?? m.content }));
          }
        }

        // Aplica mutações do projeto no editor — canal ÚNICO (Undo/Redo/Autosave).
        if (mutatedProject !== project) {
          const hasLoadedProject = Boolean(editor.state.project);
          if (hasLoadedProject) editor.updateProject(() => mutatedProject);
          else editor.loadProject(mutatedProject);
          editor.select({ environmentId: activeEnvironmentId, roomId: activeRoomId });
          upsertProject(tenantId, mutatedProject);

          // Quando a IA cria a partir do wizard/sem editor aberto, o usuário não
          // vê o resultado porque a página /novo mostra apenas uma prévia estática.
          // Persistimos o snapshot e abrimos o editor real do projeto criado.
          if (shouldOpenEditorAfterCreate) {
            try {
              if (activeCompany?.id) {
                if (!hasLoadedProject) {
                  await createProjectOnServer({
                    data: {
                      id: mutatedProject.id,
                      name: mutatedProject.name,
                      client: mutatedProject.client ?? null,
                    },
                  });
                }
                await saveSnapshotOnServer({
                  data: {
                    id: mutatedProject.id,
                    snapshot: mutatedProject as unknown as JsonObject,
                    version: mutatedProject.version,
                    name: mutatedProject.name,
                    client: mutatedProject.client ?? null,
                  },
                });
              }
            } catch (e) {
              console.warn("[planner-chat] snapshot IA não persistiu no servidor; usando cache local", e);
            }
            void navigate({
              to: "/planner/projetos/$projectId",
              params: { projectId: mutatedProject.id },
            });
          }
        }

        setState((s) => ({ ...s, status: "idle" }));
        abortRef.current = null;
      } catch (err) {
        patchMessage(assistantId, (m) => ({
          ...m,
          status: "error",
          content:
            (m.content || "") +
            `\n\n> Erro ao processar: ${(err as Error).message ?? String(err)}`,
        }));
        setState((s) => ({ ...s, status: "error" }));
      }
    },
    [
      state.status,
      editor,
      tenantId,
      ownerId,
      pathname,
      activeCompany?.id,
      patchMessage,
      runAI,
      runAIJson,
      createProjectOnServer,
      saveSnapshotOnServer,
      navigate,
    ],
  );

  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      const idx = state.messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return;
      const trimmed = newText.trim();
      if (!trimmed) return;
      // Corta histórico até a mensagem editada e re-envia.
      const before = state.messages.slice(0, idx);
      setState({ messages: before, status: "idle" });
      await send(trimmed);
    },
    [state.messages, send],
  );

  const clear = useCallback(() => {
    setState({
      messages: [
        {
          id: uid(),
          role: "assistant",
          content: "Conversa reiniciada. Como posso continuar o projeto?",
          createdAt: new Date().toISOString(),
          status: "done",
        },
      ],
      status: "idle",
    });
  }, []);

  return useMemo(
    () => ({
      messages: state.messages,
      status: state.status,
      isBusy: state.status === "thinking" || state.status === "streaming",
      send,
      cancel,
      clear,
      editMessage,
      quickActions: PLANNER_QUICK_ACTIONS,
    }),
    [state.messages, state.status, send, cancel, clear, editMessage],
  );
}