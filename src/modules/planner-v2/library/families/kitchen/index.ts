import type { FamilyDefinition } from "../../contracts/FamilyDefinition";
import { professionalKitchenModules } from "./professionalModules";

export const kitchenModules = professionalKitchenModules;

export const kitchenFamily: FamilyDefinition = {
  id: "kitchen",
  name: "Cozinha",
  description: "Biblioteca paramétrica profissional para cozinhas planejadas.",
  icon: "cooking-pot",
  categories: ["Inferiores", "Aéreos", "Torres", "Complementos", "Bancadas", "Cantos"],
  moduleIds: kitchenModules.map((module) => module.id),
  enabled: true,
  version: 2,
};
