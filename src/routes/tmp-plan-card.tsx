import { createFileRoute } from "@tanstack/react-router";
import { PlanPreviewCard } from "@/modules/planner/domains/ia/components/PlanPreviewCard";
import type { ProjectPlan } from "@/modules/planner/domains/ia/planning";

export const Route = createFileRoute("/tmp-plan-card")({ component: T });

const plan = {
  version: 1,
  planId: "p1",
  tenantId: "t",
  projectId: "pr",
  sessionId: null,
  clientMessageId: "c1",
  title: "Cozinha completa moderna com ilha central e torre quente",
  status: "ready",
  estimatedImpact: "alto",
  assumptions: [{ key: "a", label: "Estilo moderno assumido" }],
  missingInformation: [],
  warnings: [],
  steps: Array.from({ length: 6 }).map((_, i) => ({
    stepId: `s${i}`,
    position: i,
    title: `Etapa longa de teste número ${i + 1} com texto extenso`,
    toolName: "create_room_preset",
    agent: "arquiteto",
    args: {},
    status: "pending",
    mutating: true,
    destructive: false,
    optional: i > 3,
    affectedScope: "comodo",
    dependsOn: [],
  })),
} as unknown as ProjectPlan;

function T() {
  const noop = () => { (window as unknown as Record<string, unknown>).__hit = "clicked"; };
  return (
    <div className="min-h-dvh bg-background p-3">
      <div className="mx-auto w-full max-w-md">
        <PlanPreviewCard plan={plan} progress={null} onExecute={noop} onConfirm={noop} onAnswer={noop} onPause={noop} onResume={noop} onCancel={noop} onRetry={noop} onRollback={noop} onRemoveStep={noop} onDismiss={noop} />
      </div>
    </div>
  );
}
