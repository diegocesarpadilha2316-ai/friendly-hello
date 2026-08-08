import type { FamilyDefinition } from "../../contracts/FamilyDefinition";
import { KitchenBaseCabinet } from "../../modules/kitchen/KitchenBaseCabinet";
import { KitchenUpperCabinet } from "../../modules/kitchen/KitchenUpperCabinet";
import { KitchenDrawerCabinet } from "../../modules/kitchen/KitchenDrawerCabinet";

export const kitchenModules = [
  KitchenBaseCabinet,
  KitchenUpperCabinet,
  KitchenDrawerCabinet,
];

export const kitchenFamily: FamilyDefinition = {
  id: "kitchen",
  name: "Cozinha",
  description: "Cozinhas planejadas com balcões, aéreos e gaveteiros.",
  icon: "cooking-pot",
  categories: ["Inferiores", "Aéreos", "Torres", "Cantos", "Eletrodomésticos"],
  moduleIds: kitchenModules.map((m) => m.id),
  enabled: true,
  version: 1,
};
