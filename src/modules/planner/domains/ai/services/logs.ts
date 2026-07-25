import type { AILogEntry } from "../types";

const MAX_LOGS = 200;

let logs: AILogEntry[] = [];
const listeners = new Set<(l: readonly AILogEntry[]) => void>();

export function pushLog(entry: Omit<AILogEntry, "id" | "at">): AILogEntry {
  const log: AILogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    ...entry,
  };
  logs = [log, ...logs].slice(0, MAX_LOGS);
  listeners.forEach((l) => l(logs));
  return log;
}

export function getLogs(): readonly AILogEntry[] {
  return logs;
}

export function clearLogs(): void {
  logs = [];
  listeners.forEach((l) => l(logs));
}

export function subscribeLogs(fn: (l: readonly AILogEntry[]) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}