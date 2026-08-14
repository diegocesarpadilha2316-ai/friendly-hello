import { describe, expect, it } from "vitest";
import { createProject } from "@/modules/planner/shared";
import { generatePlan } from "./generator";

describe("Kitchen V10 — plano natural no Planner IA", () => {
  it("cria um plano executável de cozinha que usa o preset real, não um placeholder de layout", () => {
    const project = createProject({
      tenantId: "tenant-test",
      ownerId: "owner-test",
      name: "Teste Kitchen V10",
    });
    const plan = generatePlan({
      message: "Crie uma cozinha linear moderna com MDF 18mm e puxador cava",
      tenantId: "tenant-test",
      projectId: project.id,
      sessionId: null,
      clientMessageId: "client-kitchen-v10",
      project,
      memory: null,
      hasSelection: false,
      roomHasDimensions: true,
    });

    const creation = plan.steps.find((step) => step.toolName === "create_room_preset");
    expect(plan.status).toBe("ready");
    expect(creation).toBeTruthy();
    expect(creation?.args).toMatchObject({ preset: "cozinha", style: "moderno" });
    expect(creation?.args).not.toHaveProperty("shape");
    expect(plan.steps.some((step) => step.toolName === "layout_room")).toBe(false);
    expect(plan.steps.some((step) => step.toolName === "review_project")).toBe(true);
  });
});

export {};
