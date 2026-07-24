/**
 * Fase 3.8 — IA Decoradora: hook orquestrador.
 *
 * Gerencia estado local da sessão (estilo, provider, plano, aceitações).
 * Todas as mutações do projeto passam por `usePlannerEditor().updateProject`
 * → Undo/Redo/Autosave/Histórico herdados.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import {
  applySuggestionsToProject,
  removeAppliedNodes,
  type AppliedNode,
} from "../adapter";
import { DEFAULT_DECORATOR_PROVIDER_ID, getDecoratorProvider } from "../providers";
import { DEFAULT_DECOR_STYLE_ID } from "../styles";
import type {
  DecorPlan,
  DecorSession,
  DecorStyleId,
  DecorSuggestion,
  DecorSuggestionStatus,
} from "../types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptySession(styleId: DecorStyleId, providerId: string): DecorSession {
  const now = new Date().toISOString();
  return {
    id: uid("dsess"),
    status: "idle",
    styleId,
    providerId,
    plan: null,
    beforeNodeIds: [],
    appliedNodeIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export interface UseDecoratorSession {
  session: DecorSession;
  currentRoomId: string | null;
  currentEnvironmentId: string | null;
  isBusy: boolean;
  canAnalyze: boolean;
  canApply: boolean;
  pending: DecorSuggestion[];
  accepted: DecorSuggestion[];
  rejected: DecorSuggestion[];
  setStyle(id: DecorStyleId): void;
  setProviderId(id: string): void;
  analyze(): Promise<void>;
  cancel(): void;
  setSuggestionStatus(id: string, status: DecorSuggestionStatus): void;
  acceptAll(): void;
  rejectAll(): void;
  applyAccepted(): void;
  undoApplied(): void;
  reset(): void;
}

export function useDecoratorSession(): UseDecoratorSession {
  const editor = usePlannerEditor();
  const [session, setSession] = useState<DecorSession>(() =>
    emptySession(DEFAULT_DECOR_STYLE_ID, DEFAULT_DECORATOR_PROVIDER_ID),
  );
  const abortRef = useRef<AbortController | null>(null);

  const project = editor.state.project;
  const envId = editor.state.selectedEnvironmentId;
  const roomId = editor.state.selectedRoomId;

  const currentRoom = useMemo(() => {
    if (!project || !envId || !roomId) return null;
    const env = project.environments.find((e) => e.id === envId);
    return env?.rooms.find((r) => r.id === roomId) ?? null;
  }, [project, envId, roomId]);

  const setStyle = useCallback((id: DecorStyleId) => {
    setSession((prev) => ({ ...prev, styleId: id, updatedAt: new Date().toISOString() }));
  }, []);

  const setProviderId = useCallback((id: string) => {
    setSession((prev) => ({ ...prev, providerId: id, updatedAt: new Date().toISOString() }));
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSession((prev) => ({
      ...prev,
      status: prev.plan ? "review" : "idle",
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const analyze = useCallback(async () => {
    if (!currentRoom) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSession((prev) => ({
      ...prev,
      status: "analyzing",
      plan: null,
      appliedNodeIds: [],
      beforeNodeIds: currentRoom.nodeOrder.slice(),
      error: undefined,
      updatedAt: new Date().toISOString(),
    }));

    try {
      const provider = getDecoratorProvider(session.providerId);
      const plan: DecorPlan = await provider.suggest({
        room: currentRoom,
        styleId: session.styleId,
        signal: controller.signal,
      });
      setSession((prev) => ({
        ...prev,
        status: "review",
        plan,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setSession((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Falha na sugestão.",
        updatedAt: new Date().toISOString(),
      }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [currentRoom, session.providerId, session.styleId]);

  const setSuggestionStatus = useCallback((id: string, status: DecorSuggestionStatus) => {
    setSession((prev) => {
      if (!prev.plan) return prev;
      return {
        ...prev,
        plan: {
          ...prev.plan,
          suggestions: prev.plan.suggestions.map((s) => (s.id === id ? { ...s, status } : s)),
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const acceptAll = useCallback(() => {
    setSession((prev) => {
      if (!prev.plan) return prev;
      return {
        ...prev,
        plan: {
          ...prev.plan,
          suggestions: prev.plan.suggestions.map((s) => ({ ...s, status: "accepted" })),
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const rejectAll = useCallback(() => {
    setSession((prev) => {
      if (!prev.plan) return prev;
      return {
        ...prev,
        plan: {
          ...prev.plan,
          suggestions: prev.plan.suggestions.map((s) => ({ ...s, status: "rejected" })),
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const applyAccepted = useCallback(() => {
    if (!project || !envId || !roomId || !session.plan) return;
    const accepted = session.plan.suggestions.filter((s) => s.status === "accepted");
    if (accepted.length === 0) return;

    let appliedNodes: AppliedNode[] = [];
    editor.updateProject((current) => {
      const result = applySuggestionsToProject(current, { environmentId: envId, roomId }, accepted);
      appliedNodes = result.applied;
      return result.project;
    });

    setSession((prev) => ({
      ...prev,
      status: "applied",
      appliedNodeIds: [...prev.appliedNodeIds, ...appliedNodes.map((a) => a.nodeId)],
      updatedAt: new Date().toISOString(),
    }));
  }, [editor, envId, roomId, project, session.plan]);

  const undoApplied = useCallback(() => {
    if (!envId || !roomId || session.appliedNodeIds.length === 0) return;
    const idsToRemove = session.appliedNodeIds.slice();
    editor.updateProject((current) =>
      removeAppliedNodes(current, { environmentId: envId, roomId }, idsToRemove),
    );
    setSession((prev) => ({
      ...prev,
      status: prev.plan ? "review" : "idle",
      appliedNodeIds: [],
      updatedAt: new Date().toISOString(),
    }));
  }, [editor, envId, roomId, session.appliedNodeIds]);

  const reset = useCallback(() => {
    setSession((prev) => emptySession(prev.styleId, prev.providerId));
  }, []);

  const pending = useMemo(
    () => session.plan?.suggestions.filter((s) => s.status === "pending") ?? [],
    [session.plan],
  );
  const accepted = useMemo(
    () => session.plan?.suggestions.filter((s) => s.status === "accepted") ?? [],
    [session.plan],
  );
  const rejected = useMemo(
    () => session.plan?.suggestions.filter((s) => s.status === "rejected") ?? [],
    [session.plan],
  );

  return {
    session,
    currentRoomId: roomId,
    currentEnvironmentId: envId,
    isBusy: session.status === "analyzing",
    canAnalyze: !!currentRoom && session.status !== "analyzing",
    canApply: accepted.length > 0 && !!currentRoom && session.status !== "analyzing",
    pending,
    accepted,
    rejected,
    setStyle,
    setProviderId,
    analyze,
    cancel,
    setSuggestionStatus,
    acceptAll,
    rejectAll,
    applyAccepted,
    undoApplied,
    reset,
  };
}