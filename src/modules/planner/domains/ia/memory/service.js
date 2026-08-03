import { extractMemory } from "./extract";
import { readMemory, recordMemoryTelemetry, upsertFacts, upsertPendings, writeMemory, } from "./store";
import { buildExecutiveSummary } from "./summary";
export function updateMemoryFromTurn(turn) {
    if (turn.outcome !== "done")
        return null;
    const projectId = turn.project?.id;
    if (!projectId)
        return null;
    const okCalls = turn.toolCalls
        .filter((c) => c.status === "ok")
        .map((c) => ({ name: c.name, args: c.args ?? {}, agent: c.agent, message: c.message }));
    const extracted = extractMemory({
        userMessage: turn.userMessage,
        project: turn.project,
        environmentId: turn.environmentId,
        roomId: turn.roomId,
        toolCalls: okCalls,
    });
    const current = readMemory(turn.tenantId, projectId, turn.project.name);
    const changed = [];
    const materials = upsertFacts(current.materials, extracted.materials);
    const preferences = upsertFacts(current.preferences, extracted.preferences);
    const decisions = upsertFacts(current.decisions, extracted.decisions);
    const constraints = upsertFacts(current.constraints, extracted.constraints);
    const pendings = upsertPendings(current.pendings, extracted.pendings, extracted.resolvedPendings);
    changed.push(...materials.changed, ...preferences.changed, ...decisions.changed, ...constraints.changed, ...pendings.changed);
    const style = extracted.style ?? current.style;
    if (style !== current.style)
        changed.push("estilo");
    const environmentType = extracted.environmentType ?? current.identity.environmentType;
    if (environmentType !== current.identity.environmentType)
        changed.push("ambiente");
    const stage = extracted.stage ?? current.identity.stage;
    if (stage !== current.identity.stage)
        changed.push("etapa");
    if (turn.project.name !== current.identity.projectName)
        changed.push("nome");
    const next = {
        ...current,
        identity: { projectName: turn.project.name, environmentType, stage },
        style,
        materials: materials.next,
        preferences: preferences.next,
        decisions: decisions.next,
        constraints: constraints.next,
        pendings: pendings.next,
        executiveSummary: "",
        updatedAt: new Date().toISOString(),
    };
    const withSummary = { ...next, executiveSummary: buildExecutiveSummary(next) };
    if (!changed.length && withSummary.executiveSummary === current.executiveSummary)
        return current;
    recordMemoryTelemetry({
        projectId,
        reason: changed.length ? `turno concluído: ${changed.slice(0, 6).join(", ")}` : "resumo",
        agent: turn.agent ?? okCalls[0]?.agent ?? "orchestrator",
        changedKeys: changed,
    });
    return writeMemory(withSummary);
}
/** Recalcula o resumo executivo sem tocar nos fatos. */
export function recomputeMemory(tenantId, projectId, projectName) {
    const current = readMemory(tenantId, projectId, projectName);
    const next = {
        ...current,
        executiveSummary: buildExecutiveSummary(current),
        updatedAt: new Date().toISOString(),
    };
    recordMemoryTelemetry({
        projectId,
        reason: "recálculo manual",
        agent: "user",
        changedKeys: ["resumo"],
    });
    return writeMemory(next);
}
