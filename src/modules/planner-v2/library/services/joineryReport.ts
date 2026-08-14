import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { JoineryDefinition } from "../contracts/JoineryDefinition";

export type JoineryReport = {
  operations: JoineryDefinition[];
  warnings: string[];
};

function op(
  instance: FurnitureInstance,
  partId: string,
  kind: JoineryDefinition["kind"],
  index: number,
  overrides: Partial<JoineryDefinition> = {},
): JoineryDefinition {
  return {
    id: `${instance.id}-${partId}-${kind}-${index}`,
    moduleInstanceId: instance.id,
    partId,
    kind,
    face: "F1",
    positionMm: { x: 37, y: 37 },
    diameterMm: kind === "dowel" ? 8 : kind.startsWith("minifix") ? 15 : kind === "confirmat" ? 5 : 35,
    depthMm: kind === "hinge-cup" ? 12.5 : kind === "dowel" ? 30 : 13,
    tool: kind === "hinge-cup" ? "broca-forstner-35" : kind === "dowel" ? "broca-8" : kind.startsWith("minifix") ? "broca-15" : "broca-5",
    ...overrides,
  };
}

export function buildJoineryReport(instances: FurnitureInstance[]): JoineryReport {
  const operations: JoineryDefinition[] = [];
  const warnings: string[] = [];

  for (const instance of instances) {
    const parts = instance.parts;
    const structural = parts.filter((part) => ["side-left", "side-right", "base", "top", "shelf", "divider", "back"].includes(part.role));
    const fronts = parts.filter((part) => part.role === "door" || part.role === "drawer-front");
    const drawerParts = parts.filter((part) => part.role === "drawer-side" || part.role === "drawer-bottom");

    structural.forEach((part, index) => {
      operations.push(op(instance, part.id, "confirmat", index, { face: "F1", notes: "Fixação estrutural do carcass; confirmar recuo do fundo antes da usinagem." }));
      operations.push(op(instance, part.id, "dowel", index, { face: "F1", notes: "Cavilha de alinhamento estrutural." }));
    });

    fronts.forEach((part, index) => {
      if (part.role === "door") {
        operations.push(op(instance, part.id, "hinge-cup", index, { hardwareId: instance.hardwareOverrides.hinge, positionMm: { x: 21.5, y: Math.max(80, part.dimensionsMm.height - 100) }, notes: "Copo de dobradiça; repetir no topo e base da porta conforme altura." }));
        operations.push(op(instance, part.id, "hinge-fixing", index, { hardwareId: instance.hardwareOverrides.hinge, positionMm: { x: 37, y: Math.max(80, part.dimensionsMm.height - 100) } }));
      }
      if (part.role === "drawer-front" && instance.hardwareOverrides.handle) {
        operations.push(op(instance, part.id, "handle-through", index, { hardwareId: instance.hardwareOverrides.handle, diameterMm: 5, depthMm: 18, tool: "broca-5", notes: "Furação do puxador conforme gabarito do fabricante." }));
      }
    });

    drawerParts.forEach((part, index) => {
      operations.push(op(instance, part.id, "slide-fixing", index, { hardwareId: instance.hardwareOverrides.slide, diameterMm: 5, depthMm: 12, tool: "broca-5", notes: "Furação da corrediça com paralelismo obrigatório." }));
    });

    if (instance.moduleDefinitionId.includes("sink")) {
      const technical = parts.find((part) => part.volumeType === "technical");
      if (!technical) warnings.push(`${instance.name}: zona hidráulica sem volume técnico associado.`);
    }
  }

  return { operations, warnings };
}
