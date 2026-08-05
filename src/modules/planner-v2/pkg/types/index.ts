export type RightTab = "chat" | "inspector" | "materials" | "hardware";
export type ToolMode = "orbit" | "pan" | "select" | "measure";
export type SheetHeight = 25 | 50 | 100;

export interface FurnitureItem {
  id: string;
  name: string;
  kind: "base" | "upper" | "tower" | "island" | "drawer";
  visible: boolean;
  selected: boolean;
  position: [number, number, number];
  rotationY: number;
  size: [number, number, number];
  material: string;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  time: string;
}
