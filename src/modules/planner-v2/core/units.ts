/**
 * Centralizes unit conversion for the Planner V2.
 * Convention: Domain logic and Store use Millimeters (mm).
 * Three.js Renderer uses Meters (m).
 */

export const mmToM = (mm: number): number => mm / 1000;
export const mToMm = (m: number): number => m * 1000;

export const mmToScene = (mm: number): number => mmToM(mm);
