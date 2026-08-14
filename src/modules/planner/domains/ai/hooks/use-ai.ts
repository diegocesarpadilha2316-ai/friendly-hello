import { usePlannerEditor } from "@/modules/planner/shared";
import { useCallback, useMemo, useRef, useState } from "react";
import { DEFAULT_PROVIDER, createProvider } from "../providers";
import {
  appendMessage,
  buildPromptContext,
  clearConversation,
  composeSystemMessage,
  createConversation,
  projectContext,
  roomContext,
  runAgent,
  summarize,
  windowedMessages,
} from "../services";
import type { AIConversationState, AIMessage, AIProviderId, AIToolResult } from "../types";

export interface UseAIOptions {
  readonly provider?: AIProviderId;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly model?: string;
  readonly maxTurns?: number;
}

export interface UseAIReturn {
  readonly conversation: AIConversationState;
  readonly status: "idle" | "streaming" | "error";
  readonly error: string | null;
  readonly toolResults: readonly AIToolResult[];
  readonly send: (text: string) => Promise<void>;
  readonly stop: () => void;
  readonly reset: () => void;
  readonly providerId: AIProviderId;
}

/**
 * Hook composicional — sem provider/store. Consome exclusivamente o
 * PlannerEditorProvider; toda mutação passa por updateProject().
 */
export function useAi(options: UseAIOptions = {}): UseAIReturn {
  const editor = usePlannerEditor();
  const providerId = options.provider ?? DEFAULT_PROVIDER;
  const provider = useMemo(
    () =>
      createProvider(providerId, {
        [providerId]: {
          apiKey: options.apiKey,
          baseUrl: options.baseUrl,
          defaultModel: options.model,
        },
      } as Record<AIProviderId, { apiKey?: string; baseUrl?: string; defaultModel?: string }>),
    [providerId, options.apiKey, options.baseUrl, options.model],
  );

  const [conversation, setConversation] = useState<AIConversationState>(() =>
    createConversation(options.maxTurns ?? 20),
  );
  const [status, setStatus] = useState<UseAIReturn["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<readonly AIToolResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    stop();
    setConversation((c) => clearConversation(c));
    setToolResults([]);
    setError(null);
  }, [stop]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || status === "streaming") return;
      setError(null);
      setStatus("streaming");
      abortRef.current = new AbortController();

      const project = editor.state.project;
      const ctx = buildPromptContext({
        project: projectContext(project),
        room: roomContext(project, editor.state.selectedEnvironmentId, editor.state.selectedRoomId),
      });
      const sys = composeSystemMessage(ctx);
      const userMsg: AIMessage = {
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };

      let next = appendMessage(conversation, userMsg);
      next = summarize(next);
      setConversation(next);

      const wire = [sys, ...windowedMessages(next)];
      let streamed = "";
      const streamingMsg: AIMessage = { role: "assistant", content: "" };
      setConversation((c) => appendMessage(c, streamingMsg));

      try {
        const result = await runAgent(provider, wire, {
          stream: true,
          signal: abortRef.current.signal,
          currentProject: project,
          applyProject: editor.updateProject,
          onChunk: (chunk) => {
            if (chunk.delta) {
              streamed += chunk.delta;
              setConversation((c) => {
                const msgs = [...c.messages];
                msgs[msgs.length - 1] = { role: "assistant", content: streamed };
                return { ...c, messages: msgs };
              });
            }
          },
          onToolResult: (r) => setToolResults((t) => [...t, r]),
        });
        setConversation((c) => {
          const msgs = [...c.messages];
          msgs[msgs.length - 1] = result.finalMessage;
          return { ...c, messages: msgs };
        });
        setStatus("idle");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus("error");
      } finally {
        abortRef.current = null;
      }
    },
    [
      conversation,
      editor.state.project,
      editor.state.selectedEnvironmentId,
      editor.state.selectedRoomId,
      editor.updateProject,
      provider,
      status,
    ],
  );

  return { conversation, status, error, toolResults, send, stop, reset, providerId };
}
