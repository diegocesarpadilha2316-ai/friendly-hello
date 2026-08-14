export function validateGraph(steps) {
  const errors = [];
  const byId = new Map(steps.map((s) => [s.stepId, s]));
  if (byId.size !== steps.length) errors.push("Existem etapas com identificador duplicado.");
  for (const step of steps) {
    if (!step.stepId) errors.push("Etapa sem identificador.");
    for (const dep of step.dependsOn) {
      if (!byId.has(dep)) {
        errors.push(`A etapa "${step.title}" depende de uma etapa inexistente.`);
      }
    }
  }
  // Kahn — ordem topológica estável pela posição declarada.
  const indegree = new Map();
  for (const s of steps) indegree.set(s.stepId, 0);
  for (const s of steps) {
    for (const dep of s.dependsOn) {
      if (byId.has(dep)) indegree.set(s.stepId, (indegree.get(s.stepId) ?? 0) + 1);
    }
  }
  const ready = steps
    .filter((s) => (indegree.get(s.stepId) ?? 0) === 0)
    .sort((a, b) => a.position - b.position);
  const ordered = [];
  const queue = [...ready];
  while (queue.length) {
    const current = queue.shift();
    ordered.push(current);
    const unlocked = [];
    for (const s of steps) {
      if (!s.dependsOn.includes(current.stepId)) continue;
      const left = (indegree.get(s.stepId) ?? 0) - 1;
      indegree.set(s.stepId, left);
      if (left === 0) unlocked.push(s);
    }
    unlocked.sort((a, b) => a.position - b.position);
    queue.push(...unlocked);
    queue.sort((a, b) => a.position - b.position);
  }
  if (ordered.length !== steps.length) {
    errors.push("O plano possui dependência circular e não pode ser executado.");
  }
  const normalized = (ordered.length === steps.length ? ordered : steps).map((s, i) => ({
    ...s,
    position: i,
  }));
  return { ok: errors.length === 0, errors, ordered: normalized };
}
/** Uma etapa só roda quando todas as dependências obrigatórias concluíram. */
export function isStepUnlocked(step, all) {
  return step.dependsOn.every((dep) => {
    const d = all.find((s) => s.stepId === dep);
    if (!d) return true;
    return d.status === "completed" || d.status === "skipped";
  });
}
/** Recalcula `blocked`/`pending` de todas as etapas ainda não executadas. */
export function refreshBlocked(steps) {
  return steps.map((s) => {
    if (s.status !== "pending" && s.status !== "blocked") return s;
    return { ...s, status: isStepUnlocked(s, steps) ? "pending" : "blocked" };
  });
}
