/**
 * `usePlannerChat` — hook único do chat da IA.
 *
 * Consome exclusivamente o `PlannerEditorProvider` (nada de store nova) e
 * mantém em memória a conversa daquela sessão. Mudanças no projeto
 * passam por `updateProject`, herdando Undo/Redo, Autosave, Histórico e
 * a sincronização 2D/3D/Engenharia.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { useTenant } from "@/core/providers/TenantProvider";
import {
  usePlannerEditor,
  loadRules,
} from "@/modules/planner/shared";
import { runAgent } from "../services/agent";
import type {
  PlannerAIMessage,
  PlannerAIStatus,
  PlannerAIToolCall,
  PlannerAIQuickAction,
} from "../types";

const uid = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

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
  const tenantId = activeCompany?.id ?? "anonymous";

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

      const project = editor.state.project;
      if (!project || !editor.state.selectedEnvironmentId || !editor.state.selectedRoomId) {
        patchMessage(assistantId, (m) => ({
          ...m,
          content: "Abra um projeto e selecione um cômodo para eu poder trabalhar.",
          status: "done",
        }));
        setState((s) => ({ ...s, status: "idle" }));
        return;
      }

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
            environmentId: editor.state.selectedEnvironmentId,
            roomId: editor.state.selectedRoomId,
          },
          rules,
          signal: controller.signal,
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
          editor.updateProject(() => mutatedProject);
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
    [state.status, editor, tenantId, patchMessage],
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