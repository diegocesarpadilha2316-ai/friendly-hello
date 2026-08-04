import { useState } from "react";
import type { PlannerUIState } from "./planner-ui";

const DEFAULT_STATE: PlannerUIState = {
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: 284,
  rightWidth: 364,
  leftTab: "structure",
  rightTab: "chat",
  viewMode: "presentation",
  toolMode: "orbit",
  gridVisible: false,
  lightingEnabled: true,
  mobileExplorerOpen: false,
  mobileCopilotOpen: false,
  mobileCopilotHeight: 50,
  selectedFurnitureId: null
};

export function usePlannerUIState(initial?: Partial<PlannerUIState>) {
  const [state, setState] = useState<PlannerUIState>({
    ...DEFAULT_STATE,
    ...initial
  });

  const patch = (next: Partial<PlannerUIState>) =>
    setState((current) => ({ ...current, ...next }));

  return { state, patch };
}
