import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { PartDefinition } from "../contracts/PartDefinition";

export type FabricationCutItem = {
  key: string;
  partIds: string[];
  moduleIds: string[];
  names: string[];
  role: PartDefinition["role"];
  materialId: string;
  quantity: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  grainDirection: PartDefinition["grainDirection"];
  edgeBanding: Partial<Record<"top" | "bottom" | "left" | "right" | "front" | "back", string>>;
  volumeType: PartDefinition["volumeType"];
};

export type FabricationHardwareItem = {
  hardwareId: string;
  quantity: number;
  partIds: string[];
  moduleIds: string[];
};

export type FabricationModuleSummary = {
  instanceId: string;
  moduleDefinitionId: string;
  name: string;
  dimensionsMm: FurnitureInstance["dimensionsMm"];
  partCount: number;
  physicalPartCount: number;
  hardwarePartCount: number;
  technicalPartCount: number;
  warningCount: number;
};

export type FabricationReport = {
  generatedAt: string;
  moduleCount: number;
  cutItems: FabricationCutItem[];
  hardwareItems: FabricationHardwareItem[];
  modules: FabricationModuleSummary[];
  warnings: string[];
};

const EDGE_ORDER = ["top", "bottom", "left", "right", "front", "back"] as const;

function normalizedEdgeBanding(part: PartDefinition) {
  return EDGE_ORDER.reduce<Record<string, string>>((result, edge) => {
    const materialId = part.edgeBanding?.[edge];
    if (materialId) result[edge] = materialId;
    return result;
  }, {});
}

function isPhysicalCutPart(part: PartDefinition) {
  return part.role !== "hardware" && part.role !== "decorative" && part.volumeType !== "technical";
}

function cutKey(part: PartDefinition) {
  return JSON.stringify({
    role: part.role,
    materialId: part.materialId,
    widthMm: part.dimensionsMm.width,
    heightMm: part.dimensionsMm.height,
    depthMm: part.dimensionsMm.depth,
    grainDirection: part.grainDirection ?? "none",
    edgeBanding: normalizedEdgeBanding(part),
    volumeType: part.volumeType ?? "physical",
  });
}

export function buildFabricationReport(instances: FurnitureInstance[]): FabricationReport {
  const cutMap = new Map<string, FabricationCutItem>();
  const hardwareMap = new Map<string, FabricationHardwareItem>();
  const modules: FabricationModuleSummary[] = [];
  const warnings: string[] = [];

  for (const instance of instances) {
    const physicalParts = instance.parts.filter(isPhysicalCutPart);
    const hardwareParts = instance.parts.filter((part) => part.role === "hardware");
    const technicalParts = instance.parts.filter((part) => part.volumeType === "technical" || part.volumeType === "opening");
    let warningCount = 0;

    if (!instance.thicknessMm?.panelMm) {
      warnings.push(`${instance.name}: espessura de painel não definida.`);
      warningCount += 1;
    }
    if (physicalParts.length === 0) {
      warnings.push(`${instance.name}: nenhuma peça física foi gerada.`);
      warningCount += 1;
    }

    modules.push({
      instanceId: instance.id,
      moduleDefinitionId: instance.moduleDefinitionId,
      name: instance.name,
      dimensionsMm: instance.dimensionsMm,
      partCount: instance.parts.length,
      physicalPartCount: physicalParts.length,
      hardwarePartCount: hardwareParts.length,
      technicalPartCount: technicalParts.length,
      warningCount,
    });

    for (const part of physicalParts) {
      const key = cutKey(part);
      const current = cutMap.get(key);
      if (current) {
        current.quantity += 1;
        current.partIds.push(part.id);
        if (!current.moduleIds.includes(instance.moduleDefinitionId)) current.moduleIds.push(instance.moduleDefinitionId);
        if (!current.names.includes(part.name)) current.names.push(part.name);
        continue;
      }
      cutMap.set(key, {
        key,
        partIds: [part.id],
        moduleIds: [instance.moduleDefinitionId],
        names: [part.name],
        role: part.role,
        materialId: part.materialId,
        quantity: 1,
        widthMm: part.dimensionsMm.width,
        heightMm: part.dimensionsMm.height,
        depthMm: part.dimensionsMm.depth,
        grainDirection: part.grainDirection,
        edgeBanding: normalizedEdgeBanding(part),
        volumeType: part.volumeType ?? "physical",
      });
    }

    for (const part of hardwareParts) {
      if (!part.hardwareId) {
        warnings.push(`${instance.name}: ferragem sem hardwareId na peça ${part.name}.`);
        warningCount += 1;
        continue;
      }
      const current = hardwareMap.get(part.hardwareId);
      if (current) {
        current.quantity += 1;
        current.partIds.push(part.id);
        if (!current.moduleIds.includes(instance.moduleDefinitionId)) current.moduleIds.push(instance.moduleDefinitionId);
      } else {
        hardwareMap.set(part.hardwareId, {
          hardwareId: part.hardwareId,
          quantity: 1,
          partIds: [part.id],
          moduleIds: [instance.moduleDefinitionId],
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    moduleCount: instances.length,
    cutItems: [...cutMap.values()],
    hardwareItems: [...hardwareMap.values()],
    modules,
    warnings,
  };
}

export function fabricationReportToCsv(report: FabricationReport) {
  const header = ["quantidade", "largura_mm", "altura_mm", "profundidade_mm", "funcao", "material", "veio", "fita_topo", "fita_base", "fita_esquerda", "fita_direita", "fita_frente", "fita_fundo", "nomes"].join(",");
  const rows = report.cutItems.map((item) => [
    item.quantity,
    item.widthMm,
    item.heightMm,
    item.depthMm,
    item.role,
    item.materialId,
    item.grainDirection ?? "none",
    item.edgeBanding.top ?? "",
    item.edgeBanding.bottom ?? "",
    item.edgeBanding.left ?? "",
    item.edgeBanding.right ?? "",
    item.edgeBanding.front ?? "",
    item.edgeBanding.back ?? "",
    item.names.join(" / "),
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return [header, ...rows].join("\n");
}
