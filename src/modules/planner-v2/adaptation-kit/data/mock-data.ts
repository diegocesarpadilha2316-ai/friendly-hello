import type { ChatMessage, ProjectTreeItem } from "../types/planner-ui";

export const mockTree: ProjectTreeItem[] = [
  {
    id: "room-kitchen",
    name: "Sala Cozinha",
    kind: "room",
    visible: true,
    children: [
      { id: "walls", name: "Paredes", kind: "wall", visible: true },
      { id: "floor", name: "Piso", kind: "floor", visible: true },
      { id: "ceiling", name: "Teto", kind: "ceiling", visible: true },
      {
        id: "furniture",
        name: "Móveis",
        kind: "group",
        visible: true,
        children: [
          { id: "base-cabinet", name: "Armário Base", kind: "furniture", visible: true },
          { id: "upper-cabinet", name: "Armário Aéreo", kind: "furniture", visible: true },
          { id: "hot-tower", name: "Torre Quente", kind: "furniture", visible: true },
          { id: "drawer-unit", name: "Gaveteiro", kind: "furniture", visible: true },
          { id: "island", name: "Ilha Central", kind: "furniture", visible: true }
        ]
      },
      { id: "materials", name: "Materiais", kind: "material", visible: true },
      { id: "lighting", name: "Iluminação", kind: "lighting", visible: true },
      { id: "hardware", name: "Ferragens", kind: "hardware", visible: true },
      { id: "decoration", name: "Decoração", kind: "decoration", visible: true }
    ]
  }
];

export const mockMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Analisei sua cozinha. Sugiro adicionar iluminação embutida no balcão superior. Posso aplicar?",
    timestamp: "10:24"
  },
  {
    id: "m2",
    role: "user",
    content: "Sim, aplique LED quente nos aéreos.",
    timestamp: "10:25"
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "Pronto! Adicionei fitas LED 3000K nos aéreos superiores.",
    timestamp: "10:26"
  }
];
