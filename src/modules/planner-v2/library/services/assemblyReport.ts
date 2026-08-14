import type { FurnitureInstance } from "../contracts/FurnitureInstance";

export type AssemblyStep = {
  id: string;
  moduleInstanceId: string;
  order: number;
  title: string;
  requiredPartIds: string[];
  hardwareIds: string[];
  instruction: string;
};

export type AssemblyReport = {
  moduleCount: number;
  steps: AssemblyStep[];
  warnings: string[];
};

export function buildAssemblyReport(instances: FurnitureInstance[]): AssemblyReport {
  const steps: AssemblyStep[] = [];
  const warnings: string[] = [];
  let order = 1;

  for (const instance of instances) {
    const physical = instance.parts.filter(
      (part) =>
        part.role !== "decorative" && part.role !== "hardware" && part.volumeType !== "technical",
    );
    const hardware = instance.parts.filter((part) => part.role === "hardware");
    const fronts = instance.parts.filter(
      (part) => part.role === "door" || part.role === "drawer-front",
    );
    const drawerParts = instance.parts.filter(
      (part) => part.role === "drawer-side" || part.role === "drawer-bottom",
    );

    if (physical.length === 0)
      warnings.push(`${instance.name}: sem peças estruturais para montagem.`);
    if (hardware.some((part) => !part.hardwareId))
      warnings.push(`${instance.name}: existe ferragem sem ID de catálogo.`);

    steps.push({
      id: `${instance.id}-carcass`,
      moduleInstanceId: instance.id,
      order: order++,
      title: `Montar carcass — ${instance.name}`,
      requiredPartIds: physical
        .filter(
          (part) =>
            part.role !== "door" &&
            part.role !== "drawer-front" &&
            part.role !== "drawer-side" &&
            part.role !== "drawer-bottom",
        )
        .map((part) => part.id),
      hardwareIds: [],
      instruction:
        "Esquadre laterais, base, topo, divisórias e fundo conforme a furação do módulo; confirme diagonais antes de fixar definitivamente.",
    });

    if (drawerParts.length > 0) {
      steps.push({
        id: `${instance.id}-drawers`,
        moduleInstanceId: instance.id,
        order: order++,
        title: `Instalar caixas e corrediças — ${instance.name}`,
        requiredPartIds: drawerParts.map((part) => part.id),
        hardwareIds: hardware
          .filter((part) => part.hardwareId?.includes("slide"))
          .map((part) => part.hardwareId!)
          .filter((id, index, ids) => ids.indexOf(id) === index),
        instruction:
          "Monte as caixas, alinhe as corrediças paralelas e regule o amortecimento antes de instalar as frentes.",
      });
    }

    if (fronts.length > 0) {
      steps.push({
        id: `${instance.id}-fronts`,
        moduleInstanceId: instance.id,
        order: order++,
        title: `Regular portas e frentes — ${instance.name}`,
        requiredPartIds: fronts.map((part) => part.id),
        hardwareIds: hardware
          .filter(
            (part) =>
              part.hardwareId?.includes("hinge") ||
              part.hardwareId?.includes("handle") ||
              part.hardwareId?.includes("gola") ||
              part.hardwareId?.includes("cava"),
          )
          .map((part) => part.hardwareId!)
          .filter((id, index, ids) => ids.indexOf(id) === index),
        instruction:
          "Instale puxadores/ferragens, deixe folgas uniformes e verifique abertura completa sem colisão com módulos vizinhos.",
      });
    }

    steps.push({
      id: `${instance.id}-qa`,
      moduleInstanceId: instance.id,
      order: order++,
      title: `Inspeção final — ${instance.name}`,
      requiredPartIds: instance.parts.map((part) => part.id),
      hardwareIds: hardware
        .map((part) => part.hardwareId)
        .filter((id): id is string => Boolean(id)),
      instruction:
        "Conferir dimensões, esquadro, nivelamento, fixação, bordas, veio, funcionamento e zonas técnicas antes da entrega.",
    });
  }

  return { moduleCount: instances.length, steps, warnings };
}
