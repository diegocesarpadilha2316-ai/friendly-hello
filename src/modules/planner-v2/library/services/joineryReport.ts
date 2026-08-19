import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { JoineryDefinition } from "../contracts/JoineryDefinition";
import type { PartDefinition } from "../contracts/PartDefinition";
import { resolveGoldenHardwareApplication } from "./hardwareApplicationResolver";

export type JoineryReport = {
  operations: JoineryDefinition[];
  warnings: string[];
};

const GOLDEN_MODULE_ID = "kitchen-base-2-doors";

function semanticPartKey(partId: string): string {
  return partId.split(":").at(-1) ?? partId;
}

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
    diameterMm:
      kind === "dowel" ? 8 : kind.startsWith("minifix") ? 15 : kind === "confirmat" ? 5 : 35,
    depthMm: kind === "hinge-cup" ? 12.5 : kind === "dowel" ? 30 : 13,
    tool:
      kind === "hinge-cup"
        ? "broca-forstner-35"
        : kind === "dowel"
          ? "broca-8"
          : kind.startsWith("minifix")
            ? "broca-15"
            : kind === "hinge-fixing" || kind === "handle-through"
              ? "broca-5"
              : "sem-ferramenta-cam",
    ...overrides,
  };
}

function goldenHingeOperations(instance: FurnitureInstance, door: PartDefinition): JoineryDefinition[] {
  const resolvedApplication = resolveGoldenHardwareApplication(instance);
  const hingeParts = instance.parts.filter(
    (part) =>
      part.role === "hardware" &&
      part.hardwareId === instance.hardwareOverrides.hinge &&
      part.groupId === door.groupId &&
      part.id.startsWith(`${door.id}:hinge-`),
  );

  return hingeParts.flatMap((hingePart, index) => {
    const logicalHinge = `${semanticPartKey(door.id)}:${semanticPartKey(hingePart.id)}`;
    const mountingPlate = instance.parts.find(
      (part) =>
        part.role === "hardware" &&
        part.hardwareId === (instance.hardwareOverrides.mountingPlate ?? "mounting-plate-37-32") &&
        part.groupId === door.groupId &&
        part.id.startsWith(`${door.id}:mounting-plate-${hingePart.id.replace(`${door.id}:hinge-`, "")}`),
    );
    const positionMm = {
      x: hingePart.positionMm.x,
      y: hingePart.positionMm.y,
    };
    const common = {
      hardwareId: hingePart.hardwareId,
      relatedPartIds: [door.id, hingePart.id, ...(mountingPlate ? [mountingPlate.id] : [])],
      parameters: {
        doorPartId: door.id,
        hingePartId: hingePart.id,
        hingeSide: door.interactive?.hingeSide ?? null,
        clearanceMm: door.clearanceMm ?? null,
        quantity: 1,
        resolvedApplicationId: resolvedApplication?.id ?? null,
        applicationRuleId: resolvedApplication?.ruleId ?? null,
        applicationType: resolvedApplication?.applicationType ?? null,
      },
    } satisfies Partial<JoineryDefinition>;

    return [
      op(instance, door.id, "hinge-cup", index, {
        id: `${instance.id}:${logicalHinge}:cup`,
        positionMm,
        ...common,
        notes: "Copo de dobradiça derivado da peça de ferragem existente; parâmetros industriais ausentes não são inventados.",
      }),
      op(instance, door.id, "hinge-fixing", index, {
        id: `${instance.id}:${logicalHinge}:fixing`,
        positionMm,
        diameterMm: 0,
        depthMm: 0,
        tool: "assembly-only",
        ...common,
        notes: "Fixação da dobradiça/placa não promove pré-furo sem pilot-hole documentado.",
      }),
      ...(mountingPlate
        ? [
            op(instance, mountingPlate.id, "mounting-plate-placement", index, {
              id: `${instance.id}:${logicalHinge}:plate-placement`,
              positionMm,
              diameterMm: 0,
              depthMm: 0,
              tool: "assembly-only",
              hardwareId: mountingPlate.hardwareId,
              relatedPartIds: [door.id, hingePart.id, mountingPlate.id],
              parameters: {
                doorPartId: door.id,
                hingePartId: hingePart.id,
                mountingPlatePartId: mountingPlate.id,
                quantity: 1,
                resolvedApplicationId: resolvedApplication?.id ?? null,
                applicationRuleId: resolvedApplication?.ruleId ?? null,
                applicationType: resolvedApplication?.applicationType ?? null,
              },
              notes: "Posicionamento da placa de montagem como componente separado.",
            }),
            op(instance, mountingPlate.id, "mounting-plate-fixing", index, {
              id: `${instance.id}:${logicalHinge}:plate-fixing`,
              positionMm,
              diameterMm: 0,
              depthMm: 0,
              tool: "assembly-only",
              hardwareId: mountingPlate.hardwareId,
              relatedPartIds: [door.id, hingePart.id, mountingPlate.id],
              parameters: {
                doorPartId: door.id,
                hingePartId: hingePart.id,
                mountingPlatePartId: mountingPlate.id,
                quantity: 1,
                resolvedApplicationId: resolvedApplication?.id ?? null,
                applicationRuleId: resolvedApplication?.ruleId ?? null,
                applicationType: resolvedApplication?.applicationType ?? null,
              },
              notes: "Fixação por parafuso documentada como fastener; pré-furo não inferido.",
            }),
          ]
        : []),
    ];
  });
}

function goldenConstructionOperations(instance: FurnitureInstance): JoineryDefinition[] {
  if (instance.moduleDefinitionId !== GOLDEN_MODULE_ID) return [];

  const operations: JoineryDefinition[] = [];
  const parts = instance.parts;
  const doors = parts.filter((part) => part.role === "door");
  const toeKick = parts.find((part) => part.hardwareId === "toe-kick-profile");
  const feet = parts.filter((part) => part.hardwareId === "leg-adjustable");
  const clips = parts.filter((part) => part.hardwareId === "toe-kick-clip");
  const shelfParts = parts.filter((part) => part.role === "shelf");
  const shelfSupports = parts.filter((part) => part.hardwareId === "shelf-support");

  for (const door of doors) {
    operations.push(...goldenHingeOperations(instance, door));
    const handle = parts.find(
      (part) => part.hardwareId === instance.hardwareOverrides.handle && part.groupId === door.groupId,
    );
    if (handle?.hardwareId === "handle-gola") {
      const geometry = handle.hardwareGeometry;
      operations.push(
        op(instance, door.id, "gola-profile", Number(semanticPartKey(door.id).replace("door-", "")), {
          id: `${instance.id}:${semanticPartKey(door.id)}:gola-profile`,
          hardwareId: handle.hardwareId,
          positionMm: { x: handle.positionMm.x, y: handle.positionMm.y },
          relatedPartIds: [door.id, handle.id],
          parameters: {
            handlePartId: handle.id,
            profileWidthMm: handle.dimensionsMm.width,
            profileHeightMm: handle.dimensionsMm.height,
            profileDepthMm: handle.dimensionsMm.depth,
            lipMm: geometry?.kind === "gola" ? geometry.lipMm : null,
            recessMm: geometry?.kind === "gola" ? geometry.recessMm : null,
            continuous: true,
          },
          notes: "Perfil Gola semântico; não é tratado apenas como mesh visual.",
        }),
      );
    }
  }

  if (toeKick) {
    operations.push(
      op(instance, toeKick.id, "toe-kick-profile", 1, {
        id: `${instance.id}:toe-kick:profile`,
        hardwareId: toeKick.hardwareId,
        relatedPartIds: [toeKick.id],
        positionMm: { x: toeKick.positionMm.x, y: toeKick.positionMm.y },
        parameters: {
          profileWidthMm: toeKick.dimensionsMm.width,
          profileHeightMm: toeKick.dimensionsMm.height,
          profileDepthMm: toeKick.dimensionsMm.depth,
          groupId: toeKick.groupId ?? null,
        },
        notes: "Rodapé/perfil derivado da peça existente do módulo.",
      }),
    );
  }

  feet.forEach((foot, index) => {
    operations.push(
      op(instance, foot.id, "adjustable-foot", index + 1, {
        id: `${instance.id}:${semanticPartKey(foot.id)}:install`,
        hardwareId: foot.hardwareId,
        relatedPartIds: [foot.id, ...(toeKick ? [toeKick.id] : [])],
        positionMm: { x: foot.positionMm.x, y: foot.positionMm.y },
        parameters: {
          footPartId: foot.id,
          supportsPartId: toeKick?.id ?? null,
          xMm: foot.positionMm.x,
          yMm: foot.positionMm.y,
          zMm: foot.positionMm.z,
        },
        notes: "Pé regulável derivado da peça hardware existente; relação com rodapé preservada.",
      }),
    );
  });

  clips.forEach((clip, index) => {
    const nearestFoot = feet
      .slice()
      .sort((a, b) => Math.abs(a.positionMm.x - clip.positionMm.x) - Math.abs(b.positionMm.x - clip.positionMm.x))[0];
    operations.push(
      op(instance, toeKick?.id ?? clip.id, "toe-kick-clip", index + 1, {
        id: `${instance.id}:${semanticPartKey(clip.id)}:install`,
        hardwareId: clip.hardwareId,
        relatedPartIds: [clip.id, ...(nearestFoot ? [nearestFoot.id] : []), ...(toeKick ? [toeKick.id] : [])],
        positionMm: { x: clip.positionMm.x, y: clip.positionMm.y },
        parameters: {
          clipPartId: clip.id,
          footPartId: nearestFoot?.id ?? null,
          toeKickPartId: toeKick?.id ?? null,
        },
        notes: "Clip do rodapé relacionado ao pé mais próximo e ao perfil do rodapé.",
      }),
    );
  });

  shelfSupports.forEach((support, index) => {
    const shelf = shelfParts.find(
      (candidate) => candidate.id === support.groupId || semanticPartKey(candidate.id) === support.groupId,
    );
    operations.push(
      op(instance, shelf?.id ?? support.id, "shelf-support", index + 1, {
        id: `${instance.id}:${semanticPartKey(support.id)}:install`,
        hardwareId: support.hardwareId,
        relatedPartIds: [support.id, ...(shelf ? [shelf.id] : [])],
        positionMm: { x: support.positionMm.x, y: support.positionMm.y },
        parameters: {
          supportPartId: support.id,
          shelfPartId: shelf?.id ?? null,
          xMm: support.positionMm.x,
          yMm: support.positionMm.y,
          zMm: support.positionMm.z,
        },
        notes: "Suporte de prateleira derivado da mesma prateleira e ferragem construídas.",
      }),
    );
  });

  return operations;
}

export function buildJoineryReport(instances: FurnitureInstance[]): JoineryReport {
  const operations: JoineryDefinition[] = [];
  const warnings: string[] = [];

  for (const instance of instances) {
    const parts = instance.parts;
    const structural = parts.filter((part) =>
      ["side-left", "side-right", "base", "top", "shelf", "divider", "back"].includes(part.role),
    );
    const fronts = parts.filter((part) => part.role === "door" || part.role === "drawer-front");
    const drawerParts = parts.filter(
      (part) => part.role === "drawer-side" || part.role === "drawer-bottom",
    );

    structural.forEach((part, index) => {
      operations.push(
        op(instance, part.id, "confirmat", index, {
          face: "F1",
          notes: "Fixação estrutural do carcass; confirmar recuo do fundo antes da usinagem.",
        }),
      );
      operations.push(
        op(instance, part.id, "dowel", index, {
          face: "F1",
          notes: "Cavilha de alinhamento estrutural.",
        }),
      );
    });

    fronts.forEach((part, index) => {
      if (part.role === "door" && instance.moduleDefinitionId !== GOLDEN_MODULE_ID) {
        operations.push(
          op(instance, part.id, "hinge-cup", index, {
            hardwareId: instance.hardwareOverrides.hinge,
            positionMm: { x: 21.5, y: Math.max(80, part.dimensionsMm.height - 100) },
            notes: "Copo de dobradiça; repetir no topo e base da porta conforme altura.",
          }),
        );
        operations.push(
          op(instance, part.id, "hinge-fixing", index, {
            hardwareId: instance.hardwareOverrides.hinge,
            positionMm: { x: 37, y: Math.max(80, part.dimensionsMm.height - 100) },
          }),
        );
      }
      if (part.role === "drawer-front" && instance.hardwareOverrides.handle) {
        operations.push(
          op(instance, part.id, "handle-through", index, {
            hardwareId: instance.hardwareOverrides.handle,
            diameterMm: 5,
            depthMm: 18,
            tool: "broca-5",
            notes: "Furação do puxador conforme gabarito do fabricante.",
          }),
        );
      }
    });

    drawerParts.forEach((part, index) => {
      const slideOperation = op(instance, part.id, "slide-fixing", index, {
        hardwareId: part.hardwareId ?? instance.hardwareOverrides.slide,
        diameterMm: 5,
        depthMm: 12,
        tool: "broca-5",
        notes: "Furação da corrediça com paralelismo obrigatório.",
      });
      operations.push({ ...slideOperation, id: `${part.id}:slide-fixing-${index}` });
    });

    operations.push(...goldenConstructionOperations(instance));

    if (instance.moduleDefinitionId.includes("sink")) {
      const technical = parts.find((part) => part.volumeType === "technical");
      if (!technical)
        warnings.push(`${instance.name}: zona hidráulica sem volume técnico associado.`);
    }
  }

  return { operations, warnings };
}
