import { describe, expect, it } from "vitest";
import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import { parseProject, serializeProject } from "./projectPersistence";

const instance: FurnitureInstance = {
  id: "furniture-1",
  moduleDefinitionId: "kitchen-base-2-doors",
  familyId: "kitchen",
  name: "Balcão 2 Portas",
  dimensionsMm: { width: 800, height: 870, depth: 580 },
  positionMm: { x: 100, y: 0, z: -1500 },
  rotationDeg: { x: 0, y: 0, z: 0 },
  materialOverrides: { body: "mdf-white" },
  hardwareOverrides: { hinge: "hinge-soft-close" },
  parts: [],
  visible: true,
  locked: false,
  selected: true,
  openStates: { "furniture-1:door-1": 1 },
};

describe("projectPersistence V4", () => {
  it("serializa e restaura o envelope completo do projeto", () => {
    const project = serializeProject({
      planner: {
        furniture: [],
        instances: [instance],
        selectedId: instance.id,
        gridVisible: true,
        lightsEnabled: true,
        snapEnabled: true,
      },
      room: {
        width: 5200,
        depth: 4000,
        height: 2800,
        wallThickness: 80,
        openings: [
          {
            id: "window-1",
            type: "window",
            wall: "back",
            offset: 0,
            width: 1200,
            height: 950,
            sill: 1050,
          },
        ],
        referenceImage: null,
        referenceName: null,
        referenceStyle: "natural",
      },
      immersive: { qualityMode: "presentation", autoOcclusion: true },
    });

    const parsed = parseProject(JSON.stringify(project));
    expect(parsed?.version).toBe(4);
    expect(parsed?.planner.instances[0].positionMm).toEqual(instance.positionMm);
    expect(parsed?.planner.instances[0].openStates).toEqual(instance.openStates);
    expect(parsed?.room.openings[0].wall).toBe("back");
    expect(parsed?.immersive.qualityMode).toBe("presentation");
  });

  it("rejeita schema ou versão incompatíveis", () => {
    expect(parseProject(JSON.stringify({ schema: "other", version: 4 }))).toBeNull();
    expect(
      parseProject(JSON.stringify({ schema: "dioris.planner-v2.project", version: 3 })),
    ).toBeNull();
    expect(parseProject("not-json")).toBeNull();
  });
});
