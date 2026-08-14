import type { PremiumSyncState } from "../types";

export function initialSyncState(): PremiumSyncState {
  return { lastSyncAt: null, pending: 0, status: "idle", message: null };
}

export function markReady(state: PremiumSyncState): PremiumSyncState {
  return { ...state, status: "ready", message: "Pronto para sincronização" };
}
