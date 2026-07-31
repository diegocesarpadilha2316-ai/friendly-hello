/**
 * ROOM ARCHITECTURE ENGINE — tipos.
 *
 * Camada de ARQUITETURA do ambiente. Não conhece móveis, materiais
 * realistas, iluminação nem render. Unidade oficial: milímetros.
 *
 * Sistema de coordenadas único do projeto:
 *  - X → largura (esquerda → direita)
 *  - Z → profundidade (frente → fundo)  [equivale ao `y` do Editor 2D]
 *  - Y → altura, com **topo do piso em Y = 0**
 *
 * O retângulo interno útil do cômodo é sempre `0..widthMm` × `0..depthMm`.
 * As paredes ficam FORA desse retângulo (face interna coincide com ele).
 */

export type RoomWallSide = "front" | "right" | "back" | "left";

export type RoomCeilingKind = "laje" | "forro" | "gesso" | "rebaixo";

export type RoomHeightMm = 2400 | 2500 | 2600 | 2700 | 2800 | 3000;

export const ROOM_HEIGHTS_MM: readonly RoomHeightMm[] = [2400, 2500, 2600, 2700, 2800, 3000];

export type RoomWallThicknessMm = 70 | 90 | 100 | 120 | 150 | 180 | 200;

export const ROOM_WALL_THICKNESSES_MM: readonly RoomWallThicknessMm[] = [
  70, 90, 100, 120, 150, 180, 200,
];

export interface RoomPoint {
  x: number;
  z: number;
}

export interface RoomBaseboardSpec {
  heightMm: number;
  thicknessMm: number;
  /** recuo em relação ao início/fim de cada parede (mm) */
  recessMm?: number;
  materialId?: string;
  /** quando `false`, o rodapé não é gerado nas paredes com portas */
  continuous?: boolean;
}

export interface RoomDoorSpec {
  id?: string;
  wall: RoomWallSide;
  /** distância do início da parede até a borda esquerda do vão (mm) */
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  /** sentido de abertura */
  swing?: "in" | "out";
  hinge?: "left" | "right";
  leafThicknessMm?: number;
  frameMm?: number;
  materialId?: string;
}

export interface RoomWindowSpec {
  id?: string;
  wall: RoomWallSide;
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  /** altura do peitoril a partir do piso (mm) */
  sillHeightMm: number;
  sillDepthMm?: number;
  sillThicknessMm?: number;
  frameMm?: number;
  materialId?: string;
}

export interface RoomMaterialsSpec {
  floor?: string;
  wall?: string;
  ceiling?: string;
  baseboard?: string;
}

export interface RoomArchitectureSpec {
  id?: string;
  /** dimensões INTERNAS úteis */
  widthMm: number;
  depthMm: number;
  /** pé-direito (piso → face inferior do teto) */
  heightMm: number;
  wallThicknessMm: number;
  floorThicknessMm?: number;
  ceilingThicknessMm?: number;
  ceilingKind?: RoomCeilingKind;
  /** rebaixo do forro (mm) — reduz a altura livre quando `ceilingKind = "rebaixo"` */
  ceilingDropMm?: number;
  baseboard?: RoomBaseboardSpec | null;
  doors?: readonly RoomDoorSpec[];
  windows?: readonly RoomWindowSpec[];
  materials?: RoomMaterialsSpec;
  /** origem do ambiente no mundo (default 0,0) */
  originMm?: RoomPoint;
}

export interface RoomWallCutout {
  id: string;
  kind: "door" | "window";
  /** ao longo da parede, a partir de `wall.start` */
  startMm: number;
  endMm: number;
  bottomMm: number;
  topMm: number;
}

export interface RoomWall {
  id: string;
  side: RoomWallSide;
  lengthMm: number;
  heightMm: number;
  thicknessMm: number;
  /** graus, 0 = eixo X, 90 = eixo Z */
  orientationDeg: number;
  start: RoomPoint;
  end: RoomPoint;
  center: RoomPoint;
  /**
   * Extensão útil da face interna (mm). Vãos de porta/janela são medidos
   * SEMPRE nesta faixa: `0 .. openingSpanMm`, a partir do início da face
   * interna (x=0 nas paredes horizontais, z=0 nas verticais).
   */
  openingSpanMm: number;
  /** normal apontando para DENTRO do ambiente */
  innerNormal: RoomPoint;
  /** coordenada da face interna (x para paredes verticais, z para horizontais) */
  innerFaceMm: number;
  outerFaceMm: number;
  /** quinas (footprint, sentido horário) */
  corners: readonly RoomPoint[];
  /** ids das paredes que encontram esta */
  joints: readonly string[];
  materialId?: string;
  cutouts: readonly RoomWallCutout[];
}

export interface RoomFloor {
  id: string;
  origin: RoomPoint;
  widthMm: number;
  depthMm: number;
  thicknessMm: number;
  /** cota da face superior (0 = origem do projeto) */
  levelMm: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  materialId?: string;
}

export interface RoomCeiling {
  id: string;
  kind: RoomCeilingKind;
  widthMm: number;
  depthMm: number;
  thicknessMm: number;
  /** cota da face inferior (altura livre real) */
  levelMm: number;
  materialId?: string;
}

export interface RoomBaseboardSegment {
  id: string;
  wallId: string;
  side: RoomWallSide;
  startMm: number;
  endMm: number;
  lengthMm: number;
  heightMm: number;
  thicknessMm: number;
  center: RoomPoint;
  orientationDeg: number;
  materialId?: string;
}

export interface RoomDoor {
  id: string;
  wallId: string;
  side: RoomWallSide;
  widthMm: number;
  heightMm: number;
  bottomMm: number;
  offsetMm: number;
  center: RoomPoint;
  orientationDeg: number;
  swing: "in" | "out";
  hinge: "left" | "right";
  leaf: { widthMm: number; heightMm: number; thicknessMm: number };
  frame: { widthMm: number; depthMm: number };
  materialId?: string;
}

export interface RoomWindow {
  id: string;
  wallId: string;
  side: RoomWallSide;
  widthMm: number;
  heightMm: number;
  sillHeightMm: number;
  offsetMm: number;
  center: RoomPoint;
  orientationDeg: number;
  frame: { widthMm: number; depthMm: number };
  materialId?: string;
}

export interface RoomSill {
  id: string;
  windowId: string;
  wallId: string;
  side: RoomWallSide;
  widthMm: number;
  depthMm: number;
  thicknessMm: number;
  /** cota da face superior do peitoril */
  levelMm: number;
  center: RoomPoint;
  orientationDeg: number;
  materialId?: string;
}

export type RoomIssueCode =
  | "invalid-dimension"
  | "invalid-height"
  | "invalid-thickness"
  | "door-out-of-wall"
  | "window-out-of-wall"
  | "window-above-ceiling"
  | "door-above-ceiling"
  | "openings-overlap"
  | "wall-without-joint"
  | "floor-out-of-room"
  | "ceiling-out-of-room"
  | "baseboard-crosses-door"
  | "furniture-through-wall"
  | "furniture-outside-room"
  | "furniture-through-window"
  | "furniture-through-door"
  | "furniture-floating"
  | "furniture-above-ceiling";

export interface RoomIssue {
  code: RoomIssueCode;
  message: string;
  targetId?: string;
  severity: "error" | "warning";
}

export interface RoomArchitecture {
  id: string;
  spec: RoomArchitectureSpec;
  /** origem única compartilhada por piso, paredes, teto e móveis */
  origin: { room: RoomPoint; floor: RoomPoint; walls: RoomPoint; furniture: RoomPoint; levelMm: number };
  walls: readonly RoomWall[];
  floor: RoomFloor;
  ceiling: RoomCeiling;
  baseboards: readonly RoomBaseboardSegment[];
  doors: readonly RoomDoor[];
  windows: readonly RoomWindow[];
  sills: readonly RoomSill[];
  /** limites internos úteis (onde os móveis podem existir) */
  inner: { minX: number; maxX: number; minZ: number; maxZ: number; heightMm: number };
  /** limites externos (com paredes) */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxY: number };
  issues: readonly RoomIssue[];
}

/** Caixa de móvel consultada pelo validador de colisões (mm, eixo-alinhada). */
export interface RoomFurnitureBox {
  id: string;
  x: number;
  z: number;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  bottomMm: number;
  /** módulos suspensos legítimos (aéreo, nicho) não acusam "flutuando" */
  suspended?: boolean;
}