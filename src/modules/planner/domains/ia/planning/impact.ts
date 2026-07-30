/**
 * Etapa 11 — Parte 5: cálculo de impacto e necessidade de confirmação.
 *
 * O impacto é derivado exclusivamente dos contratos da Etapa 9 (mutating
 * / destructive / escopo) — nunca de texto livre do modelo.
 */
import type { PlanImpact, PlanStep } from "./types";

export interface ImpactAnalysis {
  readonly impact: PlanImpact;
  readonly requiresConfirmation: boolean;
  readonly needsCheckpoint: boolean;
  readonly reasons: readonly string[];
  /** Linhas do preview: "Esta ação irá: …". */
  readonly previewLines: readonly string[];
}

export function analyzeImpact(steps: readonly PlanStep[]): ImpactAnalysis {
  const mutating = steps.filter((s) => s.mutating);
  const destructive = steps.filter((s) => s.destructive);
  const touchesRoom = mutating.some((s) => s.affectedScope === "comodo" || s.affectedScope === "ambiente");
  const touchesProject = mutating.some((s) => s.affectedScope === "projeto");

  const reasons: string[] = [];
  let impact: PlanImpact = "baixo";

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

  const requiresConfirmation = impact === "alto" || impact === "destrutivo";
  const needsCheckpoint = requiresConfirmation;

  const previewLines = steps.map((s) => {
    const tag = s.destructive ? "remover" : s.mutating ? "alterar" : "consultar";
    return `${s.position + 1}. ${s.title} — ${tag} (${s.affectedScope}).`;
  });

  return { impact, requiresConfirmation, needsCheckpoint, reasons, previewLines };
}