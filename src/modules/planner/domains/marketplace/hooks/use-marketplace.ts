/**
 * Fase 3.25 — Hook orquestrador do Marketplace.
 *
 * Session-only. Zero providers/stores/managers. Inserções continuam usando
 * `updateProject()` do PlannerEditorProvider (preserva Undo/Redo/Autosave/
 * Histórico/Versionamento). O blueprint do item Marketplace é reaproveitado
 * como `CatalogItem` (Fase 3.24) na hora de virar `PlannerParametricNode`.
 */
import { useCallback, useMemo, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import {
  MARKETPLACE_ITEMS,
  getItem,
  listItems,
  itemsByBrand,
  itemsByCategory,
} from "../services/publish";
import { listAuthors } from "../services/authors";
import { listCategories } from "../services/categories";
import { listCollections } from "../services/collections";
import { listLicenses } from "../services/licenses";
import { listTargets, buildManifest } from "../services/sync";
import { searchItems, suggest } from "../services/search";
import {
  featured,
  mostDownloaded,
  mostFavorited,
  highestRated,
  newest,
} from "../services/featured";
import { recommendationsFor, recommendationsForUser } from "../services/recommendations";
import { reviewsFor } from "../services/reviews";
import {
  install,
  uninstall,
  reinstall,
  readInstalled,
  statusOf,
  installedItems,
} from "../services/install";
import { pendingUpdates, applyUpdate, applyAllUpdates } from "../services/updates";
import { readFavorites, toggleFavorite, clearFavorites } from "../services/favorites";
import { snapshot } from "../services/analytics";
import { answer as aiAnswer } from "../services/ai-hooks";
import { priceLabel } from "../services/pricing";
import { exportItems } from "../services/export";
import { importMarketplace } from "../services/import";
import { createVariant } from "../../catalog/parametric";
import { priceVariant } from "../../catalog/pricing";
import type {
  MarketplaceFavoritesState,
  MarketplaceInstalledState,
  MarketplaceItem,
  MarketplaceSearchFilters,
} from "../types";

export interface UseMarketplace {
  readonly items: readonly MarketplaceItem[];
  readonly filters: MarketplaceSearchFilters;
  readonly filtered: readonly MarketplaceItem[];
  readonly featured: readonly MarketplaceItem[];
  readonly mostDownloaded: readonly MarketplaceItem[];
  readonly mostFavorited: readonly MarketplaceItem[];
  readonly highestRated: readonly MarketplaceItem[];
  readonly newest: readonly MarketplaceItem[];
  readonly authors: ReturnType<typeof listAuthors>;
  readonly categories: ReturnType<typeof listCategories>;
  readonly collections: ReturnType<typeof listCollections>;
  readonly licenses: ReturnType<typeof listLicenses>;
  readonly syncTargets: ReturnType<typeof listTargets>;
  readonly installed: MarketplaceInstalledState;
  readonly favorites: MarketplaceFavoritesState;
  readonly pendingUpdates: ReturnType<typeof pendingUpdates>;
  readonly analytics: ReturnType<typeof snapshot>;
  readonly selectedId: string | null;
  readonly selected: MarketplaceItem | null;
  readonly canInsert: boolean;
  readonly setFilters: (patch: Partial<MarketplaceSearchFilters>) => void;
  readonly select: (itemId: string | null) => void;
  readonly install: (itemId: string) => void;
  readonly uninstall: (itemId: string) => void;
  readonly reinstall: (itemId: string) => void;
  readonly updateOne: (itemId: string) => void;
  readonly updateAll: () => void;
  readonly toggleFavorite: (itemId: string) => void;
  readonly clearFavorites: () => void;
  readonly statusOf: (itemId: string) => ReturnType<typeof statusOf>;
  readonly installedItems: () => readonly MarketplaceItem[];
  readonly reviewsFor: typeof reviewsFor;
  readonly recommendationsFor: typeof recommendationsFor;
  readonly recommendationsForUser: typeof recommendationsForUser;
  readonly itemsByBrand: typeof itemsByBrand;
  readonly itemsByCategory: typeof itemsByCategory;
  readonly suggest: typeof suggest;
  readonly priceLabel: typeof priceLabel;
  readonly askAI: (question: string) => ReturnType<typeof aiAnswer>;
  readonly exportItems: typeof exportItems;
  readonly importMarketplace: typeof importMarketplace;
  readonly buildManifest: typeof buildManifest;
  readonly insertSelected: () => boolean;
}

export function useMarketplace(): UseMarketplace {
  const editor = usePlannerEditor();
  const [filters, setFiltersState] = useState<MarketplaceSearchFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [installedState, setInstalledState] = useState<MarketplaceInstalledState>(() =>
    readInstalled(),
  );
  const [favoritesState, setFavoritesState] = useState<MarketplaceFavoritesState>(() =>
    readFavorites(),
  );

  const filtered = useMemo(() => searchItems(filters), [filters]);
  const selected = useMemo(() => (selectedId ? (getItem(selectedId) ?? null) : null), [selectedId]);
  const analytics = useMemo(() => snapshot(), [installedState, favoritesState]);
  const updates = useMemo(() => pendingUpdates(), [installedState]);

  const setFilters = useCallback((patch: Partial<MarketplaceSearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleInstall = useCallback((itemId: string) => setInstalledState(install(itemId)), []);
  const handleUninstall = useCallback((itemId: string) => setInstalledState(uninstall(itemId)), []);
  const handleReinstall = useCallback((itemId: string) => setInstalledState(reinstall(itemId)), []);
  const handleUpdateOne = useCallback(
    (itemId: string) => setInstalledState(applyUpdate(itemId)),
    [],
  );
  const handleUpdateAll = useCallback(() => setInstalledState(applyAllUpdates()), []);
  const handleToggleFav = useCallback(
    (itemId: string) => setFavoritesState(toggleFavorite(itemId)),
    [],
  );
  const handleClearFav = useCallback(() => setFavoritesState(clearFavorites()), []);

  const canInsert = Boolean(editor.state.project && editor.state.selectedRoomId && selected);

  const insertSelected = useCallback((): boolean => {
    const roomId = editor.state.selectedRoomId;
    if (!editor.state.project || !roomId || !selected) return false;
    const variant = createVariant(selected.blueprint, {});
    const price = priceVariant(selected.blueprint, variant);
    const nodeId = `marketplace-${variant.id}`;
    editor.updateProject((project) => ({
      ...project,
      environments: project.environments.map((env) => ({
        ...env,
        rooms: env.rooms.map((room) => {
          if (room.id !== roomId) return room;
          return {
            ...room,
            nodes: {
              ...room.nodes,
              [nodeId]: {
                id: nodeId,
                kind: "module",
                label: selected.name,
                params: {
                  marketplaceId: selected.id,
                  brand: selected.brand,
                  version: selected.version,
                  itemId: selected.blueprint.id,
                  sku: selected.blueprint.sku,
                  variantId: variant.id,
                  widthMm: variant.widthMm,
                  heightMm: variant.heightMm,
                  depthMm: variant.depthMm,
                  materialId: variant.materialId ?? null,
                  handleId: variant.handleId ?? null,
                  price: price.total,
                  license: selected.license,
                  insertedAt: new Date().toISOString(),
                },
              },
            },
            nodeOrder: [...room.nodeOrder, nodeId],
            updatedAt: new Date().toISOString(),
          };
        }),
      })),
    }));
    if (statusOf(selected.id) === "not_installed") {
      setInstalledState(install(selected.id));
    }
    return true;
  }, [editor, selected]);

  return {
    items: listItems(),
    filters,
    filtered,
    featured: featured(),
    mostDownloaded: mostDownloaded(),
    mostFavorited: mostFavorited(),
    highestRated: highestRated(),
    newest: newest(),
    authors: listAuthors(),
    categories: listCategories(),
    collections: listCollections(),
    licenses: listLicenses(),
    syncTargets: listTargets(),
    installed: installedState,
    favorites: favoritesState,
    pendingUpdates: updates,
    analytics,
    selectedId,
    selected,
    canInsert,
    setFilters,
    select: setSelectedId,
    install: handleInstall,
    uninstall: handleUninstall,
    reinstall: handleReinstall,
    updateOne: handleUpdateOne,
    updateAll: handleUpdateAll,
    toggleFavorite: handleToggleFav,
    clearFavorites: handleClearFav,
    statusOf,
    installedItems,
    reviewsFor,
    recommendationsFor,
    recommendationsForUser,
    itemsByBrand,
    itemsByCategory,
    suggest,
    priceLabel,
    askAI: aiAnswer,
    exportItems,
    importMarketplace,
    buildManifest,
    insertSelected,
  };
}

// silence unused
void MARKETPLACE_ITEMS;
