function objectsFrom(plan, kinds) {
    const out = new Set();
    for (const step of plan.steps) {
        if (step.status !== "completed")
            continue;
        if (!kinds.some((k) => step.toolName.startsWith(k)))
            continue;
        for (const id of step.result?.affectedIds ?? [])
            out.add(id);
    }
    return [...out];
}
export function buildFinalReport(plan, status) {
    const completed = plan.steps.filter((s) => s.status === "completed");
    const failed = plan.steps.filter((s) => s.status === "failed");
    const pendings = plan.steps
        .filter((s) => s.status === "pending" || s.status === "blocked" || s.status === "cancelled")
        .map((s) => s.title);
    const materials = completed
        .filter((s) => s.toolName.includes("material") || s.toolName.includes("finishing"))
        .map((s) => s.result?.summary ?? s.title);
    const has = (needle) => plan.steps.some((s) => s.toolName.includes(needle));
    const done = (needle) => completed.some((s) => s.toolName.includes(needle));
    const warnings = plan.steps.flatMap((s) => s.warnings);
    const nextSteps = [
        ...failed.map((s) => `Repetir: ${s.title}.`),
        ...pendings.map((t) => `Concluir: ${t}.`),
    ].slice(0, 6);
    const headline = status === "completed"
        ? "Plano concluído."
        : status === "partially_completed"
            ? "Plano concluído parcialmente."
            : status === "cancelled"
                ? "Plano cancelado — as etapas já concluídas foram preservadas."
                : "Plano não pôde ser concluído.";
    const text = [
        headline,
        `Etapas concluídas: ${completed.length} de ${plan.steps.length}.`,
        failed.length ? `Falhas: ${failed.map((s) => s.title).join(", ")}.` : "",
        pendings.length ? `Pendências: ${pendings.join(", ")}.` : "",
        warnings.length ? `Avisos: ${warnings.slice(0, 3).join(" · ")}.` : "",
    ]
        .filter(Boolean)
        .join("\n");
    return {
        objective: plan.title,
        completedSteps: completed.map((s) => s.title),
        failedSteps: failed.map((s) => s.title),
        createdObjects: objectsFrom(plan, ["insert", "create", "layout"]),
        changedObjects: objectsFrom(plan, ["change", "apply", "set", "resize", "convert"]),
        materials,
        warnings,
        pendings,
        budget: done("budget") ? "disponivel" : has("budget") ? "incompleto" : "nao_solicitado",
        production: done("production") ? "disponivel" : has("production") ? "preliminar" : "nao_solicitado",
        render: done("render") ? "preparado" : has("render") ? "pendente" : "nao_solicitado",
        nextSteps,
        text,
    };
}
