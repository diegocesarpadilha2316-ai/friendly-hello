/**
 * ROOM ARCHITECTURE ENGINE — ponto único de entrada.
 * Todo projeto nasce dentro de um cômodo real: piso, paredes com
 * espessura, teto, rodapés arquitetônicos, portas, janelas e peitoris.
 */
export * from "./types";
export { ROOM_DEFAULTS, buildRoomArchitecture, pointOnWall, roomClearHeightMm } from "./engine";
export { createRoomQuery, type RoomQuery } from "./query";
export { roomArchitectureSpecFrom, roomFurnitureBoxesFrom } from "./from-room";
export { validateRoom, validateRoomFurniture } from "./collisions";
export { ROOM_PRESETS, roomPresetFor, type RoomPreset } from "./presets";
export {
  buildRoomDiagnostics,
  publishRoomDiagnostics,
  type RoomDiagnostics,
} from "./diagnostics";