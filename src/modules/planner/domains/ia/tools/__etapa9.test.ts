import { describe, it, expect } from "vitest";
import { toMillimeters } from "@/modules/planner/domains/ia/tools/validation";
import { getToolContract, listToolContracts } from "@/modules/planner/domains/ia/tools/registry";
import { ownerOfTool } from "@/modules/planner/domains/ia/agents/registry";

describe("Etapa 9", () => {
  it("normaliza unidades para mm", () => {
    expect(toMillimeters("1,20 m")).toBe(1200);
    expect(toMillimeters("80cm")).toBe(800);
    expect(toMillimeters(800)).toBe(800);
    expect(toMillimeters(2.4)).toBe(2400);
  });
  it("valida args estritos", () => {
    const c = getToolContract("resize")!;
    expect(c.inputSchema.safeParse({ width: "1,2m" }).success).toBe(true);
    expect(c.inputSchema.safeParse({ largura: 800 }).success).toBe(false);
    expect(c.inputSchema.safeParse({ width: 999999 }).success).toBe(false);
  });
  it("ownership único e coerente com os agentes", () => {
    for (const c of listToolContracts()) expect(ownerOfTool(c.name)).toBe(c.ownerAgent);
  });
  it("remove é destrutiva", () => {
    expect(getToolContract("remove")!.destructive).toBe(true);
  });
});
