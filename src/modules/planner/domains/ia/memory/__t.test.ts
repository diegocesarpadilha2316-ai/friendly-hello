import { describe, it, expect, beforeEach } from "vitest";
import { createProject, createEnvironment, createRoom } from "@/modules/planner/shared";
import { updateMemoryFromTurn } from "./service";
import { readMemory, clearMemory, sanitizeValue, memoryKey } from "./store";
import { buildMemoryPromptBlock } from "./summary";

function proj(name = "Cozinha") {
  const room = createRoom({ name: "Cozinha", type: "cozinha", width: 4000, depth: 3000, height: 2700 });
  const env = { ...createEnvironment({ name: "Ambiente" }), rooms: [room] };
  const p = createProject({ tenantId: "t1", ownerId: "u1", name });
  return { project: { ...p, environments: [env] }, envId: env.id, roomId: room.id };
}

describe("Memória do projeto (Etapa 10)", () => {
  beforeEach(() => localStorage.clear());

  it("registra materiais confirmados e substitui em conflito", () => {
    const { project, envId, roomId } = proj();
    updateMemoryFromTurn({
      tenantId: "t1", userMessage: "Criar cozinha moderna em Freijó", project,
      environmentId: envId, roomId, outcome: "done",
      toolCalls: [{ name: "change_material", args: { material: "freijo", scope: "all" }, status: "ok", agent: "materiais" }],
    });
    let m = readMemory("t1", project.id)!;
    expect(m.materials.map((x) => x.value)).toContain("Freijo");
    expect(m.style).toBe("moderno");

    updateMemoryFromTurn({
      tenantId: "t1", userMessage: "Agora quero Carvalho", project,
      environmentId: envId, roomId, outcome: "done",
      toolCalls: [{ name: "change_material", args: { material: "carvalho", scope: "all" }, status: "ok" }],
    });
    m = readMemory("t1", project.id)!;
    const corpo = m.materials.filter((x) => x.key === "material:corpo");
    expect(corpo).toHaveLength(1);
    expect(corpo[0].value).toBe("Carvalho");
  });

  it("ignora turnos cancelados/erro e tool calls falhas", () => {
    const { project, envId, roomId } = proj();
    updateMemoryFromTurn({ tenantId: "t1", userMessage: "x", project, environmentId: envId, roomId, outcome: "cancelled", toolCalls: [] });
    updateMemoryFromTurn({
      tenantId: "t1", userMessage: "y", project, environmentId: envId, roomId, outcome: "done",
      toolCalls: [{ name: "change_material", args: { material: "nogueira" }, status: "error" }],
    });
    expect(readMemory("t1", project.id)!.materials).toHaveLength(0);
  });

  it("isola memória por tenant e projeto", () => {
    const a = proj("A"); const b = proj("B");
    updateMemoryFromTurn({ tenantId: "t1", userMessage: "prefiro freijo", project: a.project, environmentId: a.envId, roomId: a.roomId, outcome: "done", toolCalls: [] });
    expect(readMemory("t1", a.project.id)!.preferences.length).toBe(1);
    expect(readMemory("t1", b.project.id)!.preferences.length).toBe(0);
    expect(readMemory("t2", a.project.id)!.preferences.length).toBe(0);
    expect(memoryKey("t1", a.project.id)).not.toBe(memoryKey("t2", a.project.id));
  });

  it("nunca guarda segredos e mantém contexto compacto", () => {
    expect(sanitizeValue("sk-abc123 secret token")).toBeNull();
    const { project, envId, roomId } = proj();
    updateMemoryFromTurn({ tenantId: "t1", userMessage: "prefiro duratex, evite vidro, quero orçamento", project, environmentId: envId, roomId, outcome: "done", toolCalls: [] });
    const m = readMemory("t1", project.id)!;
    expect(m.constraints.some((c) => /Vidro/.test(c.value))).toBe(true);
    expect(m.pendings.some((p) => p.kind === "orcamento")).toBe(true);
    const block = buildMemoryPromptBlock(m);
    expect(block.length).toBeLessThan(950);
    expect(m.executiveSummary).toContain("cozinha");
  });

  it("limpa memória do projeto", () => {
    const { project, envId, roomId } = proj();
    updateMemoryFromTurn({ tenantId: "t1", userMessage: "prefiro carvalho", project, environmentId: envId, roomId, outcome: "done", toolCalls: [] });
    clearMemory("t1", project.id);
    expect(readMemory("t1", project.id)!.preferences).toHaveLength(0);
  });
});
