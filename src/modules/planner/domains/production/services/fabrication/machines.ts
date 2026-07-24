import type { FabricationMachine } from "./types";

/**
 * Catálogo estendido de máquinas CAM/CNC.
 * Descritivo — não conecta a nenhuma máquina real.
 */
export const FABRICATION_MACHINES: readonly FabricationMachine[] = [
  // Homag
  {
    id: "homag-sawteq-b",
    vendor: "Homag",
    model: "SAWTEQ B-300",
    family: "seccionadora",
    formats: ["xxl", "cid3", "dxf"],
    workAreaMm: { x: 4300, y: 2200, z: 100 },
    status: "planejado",
    tags: ["seccionadora", "guilhotina", "corte"],
  },
  {
    id: "homag-edgeteq-s",
    vendor: "Homag",
    model: "EDGETEQ S-500",
    family: "coladeira",
    formats: ["cid3", "cix"],
    workAreaMm: { x: 4000, y: 800, z: 60 },
    status: "planejado",
    tags: ["coladeira", "fita", "borda"],
  },
  {
    id: "homag-cnc-centateq",
    vendor: "Homag",
    model: "CENTATEQ P-210",
    family: "centro-usinagem",
    formats: ["mpr", "gcode", "dxf"],
    workAreaMm: { x: 3050, y: 1550, z: 200 },
    spindleRpm: 24000,
    toolChanger: true,
    status: "beta",
    tags: ["nesting", "furação", "usinagem"],
  },
  // Biesse
  {
    id: "biesse-selco-wna",
    vendor: "Biesse",
    model: "Selco WNA 6",
    family: "seccionadora",
    formats: ["xxl", "dxf"],
    workAreaMm: { x: 4500, y: 2200, z: 100 },
    status: "planejado",
    tags: ["seccionadora", "corte"],
  },
  {
    id: "biesse-akron-1400",
    vendor: "Biesse",
    model: "Akron 1400",
    family: "coladeira",
    formats: ["cix"],
    workAreaMm: { x: 4200, y: 600, z: 60 },
    status: "planejado",
    tags: ["coladeira", "fita"],
  },
  {
    id: "biesse-rover-k",
    vendor: "Biesse",
    model: "Rover K FT",
    family: "router",
    formats: ["gcode", "dxf", "cix", "iso"],
    workAreaMm: { x: 3050, y: 1600, z: 180 },
    spindleRpm: 24000,
    toolChanger: true,
    status: "beta",
    tags: ["router", "nesting"],
  },
  {
    id: "biesse-rover-a",
    vendor: "Biesse",
    model: "Rover A Smart",
    family: "centro-usinagem",
    formats: ["cix", "gcode", "iso"],
    workAreaMm: { x: 3650, y: 1300, z: 200 },
    spindleRpm: 18000,
    toolChanger: true,
    status: "planejado",
    tags: ["furação", "usinagem"],
  },
  // SCM
  {
    id: "scm-gabbiani",
    vendor: "SCM",
    model: "Gabbiani Galaxy",
    family: "seccionadora",
    formats: ["xxl", "dxf"],
    workAreaMm: { x: 4300, y: 2200, z: 100 },
    status: "planejado",
    tags: ["seccionadora"],
  },
  {
    id: "scm-morbidelli",
    vendor: "SCM",
    model: "Morbidelli M100",
    family: "centro-usinagem",
    formats: ["gcode", "dxf", "iso"],
    workAreaMm: { x: 3050, y: 1550, z: 200 },
    spindleRpm: 24000,
    toolChanger: true,
    status: "beta",
    tags: ["nesting", "usinagem"],
  },
  {
    id: "scm-startech",
    vendor: "SCM",
    model: "Startech CN",
    family: "furadeira",
    formats: ["cix", "dxf"],
    workAreaMm: { x: 3000, y: 1200, z: 60 },
    status: "planejado",
    tags: ["furadeira", "minifix"],
  },
  // Router / genéricos
  {
    id: "cnc-router-3axis",
    vendor: "Genérico",
    model: "Router 3 eixos",
    family: "router",
    formats: ["gcode", "dxf", "nc"],
    workAreaMm: { x: 2500, y: 1250, z: 150 },
    status: "planejado",
    tags: ["router", "compatível"],
  },
  {
    id: "cnc-nesting-4x8",
    vendor: "Genérico",
    model: "Nesting 4x8",
    family: "nesting",
    formats: ["gcode", "dxf", "nc", "bpp"],
    workAreaMm: { x: 2500, y: 1300, z: 100 },
    status: "planejado",
    tags: ["nesting"],
  },
];

export function findMachine(id: string): FabricationMachine | undefined {
  return FABRICATION_MACHINES.find((m) => m.id === id);
}

export function machinesByFamily(family: string): readonly FabricationMachine[] {
  return FABRICATION_MACHINES.filter((m) => m.family === family);
}