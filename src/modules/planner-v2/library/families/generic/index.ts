import type { FamilyDefinition } from "../../contracts/FamilyDefinition";
import { DemoBaseCabinet } from "../../modules/demo/DemoBaseCabinet";
import { DemoUpperCabinet } from "../../modules/demo/DemoUpperCabinet";
import { DemoTallCabinet } from "../../modules/demo/DemoTallCabinet";

export const genericModules = [DemoBaseCabinet, DemoUpperCabinet, DemoTallCabinet];

export const genericFamily: FamilyDefinition = {
  id: "generic",
  name: "Genéricos",
  description: "Módulos demonstrativos que validam a arquitetura paramétrica.",
  icon: "box",
  categories: ["Demonstrativos"],
  moduleIds: genericModules.map((module) => module.id),
  enabled: true,
  version: 1,
};