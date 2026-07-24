/**
 * Catálogo de máquinas CNC suportadas — Homag, Biesse, SCM, Rover,
 * Morbidelli, Weeke, Holzher, Vitap e Genérico GCode.
 */
import type { CncMachine } from "./types";

export const CNC_MACHINE_CATALOG: readonly CncMachine[] = [
  {
    id: "homag-centateq-p-210",
    brand: "homag",
    model: "CENTATEQ P-210",
    axes: 5,
    formats: ["mpr", "dxf", "xml"],
    bedX: 3050, bedY: 1550, bedZ: 250,
    maxRpm: 24000, maxFeed: 45000,
    toolChanger: true,
    notes: "Centro CNC 5 eixos — MPR nativo",
  },
  {
    id: "biesse-rover-a",
    brand: "biesse",
    model: "Rover A",
    axes: 5,
    formats: ["bpp", "cix", "dxf", "xml"],
    bedX: 3120, bedY: 1600, bedZ: 240,
    maxRpm: 24000, maxFeed: 40000,
    toolChanger: true,
  },
  {
    id: "scm-morbidelli-x200",
    brand: "morbidelli",
    model: "Morbidelli X200",
    axes: 5,
    formats: ["xml", "dxf", "gcode"],
    bedX: 3660, bedY: 1620, bedZ: 300,
    maxRpm: 24000, maxFeed: 60000,
    toolChanger: true,
  },
  {
    id: "scm-tech-z5",
    brand: "scm",
    model: "TECH Z5",
    axes: 5,
    formats: ["xml", "dxf", "cix"],
    bedX: 3050, bedY: 1500, bedZ: 260,
    maxRpm: 24000, maxFeed: 40000,
    toolChanger: true,
  },
  {
    id: "rover-plast",
    brand: "rover",
    model: "Rover Plast",
    axes: 4,
    formats: ["bpp", "dxf"],
    bedX: 3050, bedY: 1300, bedZ: 200,
    maxRpm: 18000, maxFeed: 25000,
    toolChanger: true,
  },
  {
    id: "weeke-vantage-100",
    brand: "weeke",
    model: "Vantage 100",
    axes: 5,
    formats: ["mpr", "dxf", "xml"],
    bedX: 3050, bedY: 1550, bedZ: 250,
    maxRpm: 24000, maxFeed: 35000,
    toolChanger: true,
  },
  {
    id: "holzher-pro-master-7225",
    brand: "holzher",
    model: "Pro-Master 7225",
    axes: 5,
    formats: ["nc", "dxf", "xml"],
    bedX: 3050, bedY: 1550, bedZ: 250,
    maxRpm: 24000, maxFeed: 45000,
    toolChanger: true,
  },
  {
    id: "vitap-point-k2",
    brand: "vitap",
    model: "Point K2",
    axes: 3,
    formats: ["cid3", "dxf"],
    bedX: 2800, bedY: 1300, bedZ: 180,
    maxRpm: 18000, maxFeed: 25000,
    toolChanger: false,
  },
  {
    id: "generic-3axis",
    brand: "generic",
    model: "Generic 3-Axis",
    axes: 3,
    formats: ["gcode", "dxf", "nc"],
    bedX: 2500, bedY: 1250, bedZ: 150,
    maxRpm: 18000, maxFeed: 20000,
    toolChanger: false,
  },
];

export function findCncMachine(id: string): CncMachine | undefined {
  return CNC_MACHINE_CATALOG.find((m) => m.id === id);
}
