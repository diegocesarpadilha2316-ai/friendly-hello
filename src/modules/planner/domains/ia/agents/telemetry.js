const MAX_RUNS = 200;
const runs = [];
let seq = 0;
const nextId = () => `run_${Date.now().toString(36)}_${(seq++).toString(36)}`;
export function startAgentRun(agent) {
  const id = nextId();
  const startedAt = Date.now();
  return {
    id,
    agent,
    finish(success, tools, error) {
      const finishedAt = Date.now();
      const run = {
        id,
        agent,
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        success,
        error,
        tools,
      };
      runs.push(run);
      if (runs.length > MAX_RUNS) runs.splice(0, runs.length - MAX_RUNS);
      return run;
    },
  };
}
export function listAgentRuns(limit = 50) {
  return runs.slice(-limit);
}
export function clearAgentRuns() {
  runs.length = 0;
}
/** Linha compacta para exibir no chat / logs — "Designer 120ms ✓". */
export function formatAgentRun(run) {
  const status = run.success ? "ok" : `erro: ${run.error ?? "desconhecido"}`;
  return `${run.agent} — ${run.durationMs}ms — ${status}`;
}
