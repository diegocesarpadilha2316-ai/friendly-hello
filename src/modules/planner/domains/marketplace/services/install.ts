/**
 * Fase 3.25 — Instalação/remocao session-only via localStorage.
 *
 * Não cria stores/providers/managers. Apenas leitura/escrita de um vetor
 * imutável em `localStorage` (client-only). Toda inserção de nós no projeto
 * continua acontecendo via `updateProject()` do PlannerEditorProvider.
 */
import type {
  MarketplaceInstalledRecord,
  MarketplaceInstalledState,
  MarketplaceInstallStatus,
  MarketplaceItem,
} from "../types";
import { MARKETPLACE_ITEMS, getItem } from "./publish";

const KEY = "dioris.planner.marketplace.installed.v1";
const EMPTY: MarketplaceInstalledState = { records: [] };

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readInstalled(): MarketplaceInstalledState {
  const storage = safeStorage();
  if (!storage) return EMPTY;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as MarketplaceInstalledState;
    if (!parsed || !Array.isArray(parsed.records)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

function writeInstalled(state: MarketplaceInstalledState): MarketplaceInstalledState {
  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }
  return state;
}

export function install(itemId: string): MarketplaceInstalledState {
  const item = getItem(itemId);
  if (!item) return readInstalled();
  const current = readInstalled();
  const now = new Date().toISOString();
  const record: MarketplaceInstalledRecord = {
    itemId,
    version: item.version,
    installedAt: now,
    updatedAt: now,
  };
  const others = current.records.filter((r) => r.itemId !== itemId);
  return writeInstalled({ records: [...others, record] });
}

export function uninstall(itemId: string): MarketplaceInstalledState {
  const current = readInstalled();
  return writeInstalled({ records: current.records.filter((r) => r.itemId !== itemId) });
}

export function reinstall(itemId: string): MarketplaceInstalledState {
  uninstall(itemId);
  return install(itemId);
}

export function statusOf(itemId: string): MarketplaceInstallStatus {
  const record = readInstalled().records.find((r) => r.itemId === itemId);
  if (!record) return "not_installed";
  const item = getItem(itemId);
  if (!item) return "removed";
  return record.version === item.version ? "installed" : "update_available";
}

export function installedItems(): readonly MarketplaceItem[] {
  const ids = new Set(readInstalled().records.map((r) => r.itemId));
  return MARKETPLACE_ITEMS.filter((i) => ids.has(i.id));
}
