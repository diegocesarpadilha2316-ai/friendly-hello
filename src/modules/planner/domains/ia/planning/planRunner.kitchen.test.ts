import { describe, expect, it } from "vitest";
import { createProject, ensureProjectRoomShells } from "@/modules/planner/shared";
import { listPrimitives } from "@/modules/planner/shared/editor-2d/serialization";
import { generatePlan } from "./generator";
import { PlanRunner } from "./executor";

describe("Kitchen V10 — execução do plano autenticado", () => {
  it("materializa módulos no projeto após executar create_room_preset", async () => {
    const base = ensureProjectRoomShells(
      createProject({
        tenantId: "tenant-test",
        ownerId: "owner-test",
        name: "Execução Kitchen V10",
      }),
    );
    const environment = base.environments[0];
    const room = environment?.rooms[0];
    expect(environment).toBeTruthy();
    expect(room).toBeTruthy();

    const plan = generatePlan({
      message: "Crie uma cozinha moderna",
      tenantId: "tenant-test",
      projectId: base.id,
      sessionId: null,
      clientMessageId: "client-run-kitchen-v10",
      project: base,
      memory: null,
      hasSelection: false,
      roomHasDimensions: true,
    });
    let current = base;
    const runner = new PlanRunner({
      plan,
      tenantId: "tenant-test",
      ctx: { environmentId: environment.id, roomId: room.id },
      getProject: () => current,
      applyProject: (next) => {
        current = next;
      },
      onUpdate: () => undefined,
    });
    const finished = await runner.run();
    const furniture = current.environments
      .flatMap((env) => env.rooms)
      .flatMap((r) => listPrimitives(r))
      .filter((primitive) => primitive.kind === "furniture");
    expect(finished.status).toBe("completed");
    expect(furniture.length).toBeGreaterThan(0);
  });
});

export {};
