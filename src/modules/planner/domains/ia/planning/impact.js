export function analyzeImpact(steps) {
  const mutating = steps.filter((s) => s.mutating);
  const destructive = steps.filter((s) => s.destructive);
  const touchesRoom = mutating.some(
    (s) => s.affectedScope === "comodo" || s.affectedScope === "ambiente",
  );
  const touchesProject = mutating.some((s) => s.affectedScope === "projeto");
  const reasons = [];
  let impact = "baixo";
  if (destructive.length) {
    impact = "destrutivo";
    reasons.push(`${destructive.length} etapa(s) removem ou substituem conteúdo existente.`);
  } else if (touchesProject || mutating.length >= 4) {
    impact = "alto";
    reasons.push(`${mutating.length} etapa(s) alteram o projeto.`);
  } else if (touchesRoom || mutating.length >= 2) {
    impact = "medio";
    reasons.push(`${mutating.length} etapa(s) alteram o cômodo ativo.`);
  } else if (mutating.length === 1) {
    reasons.push("Uma etapa altera o projeto.");
  } else {
    reasons.push("Todas as etapas são consultivas.");
  }
  // Confirmação manual existe apenas para operações destrutivas: um pedido
  // completo (impacto alto) já traz a intenção do usuário e deve executar
  // automaticamente. O checkpoint continua sendo criado nos dois casos.
  const requiresConfirmation = impact === "destrutivo";
  const needsCheckpoint = impact === "alto" || impact === "destrutivo";
  const previewLines = steps.map((s) => {
    const tag = s.destructive ? "remover" : s.mutating ? "alterar" : "consultar";
    return `${s.position + 1}. ${s.title} — ${tag} (${s.affectedScope}).`;
  });
  return { impact, requiresConfirmation, needsCheckpoint, reasons, previewLines };
}
