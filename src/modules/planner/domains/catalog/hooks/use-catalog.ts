/**
 * Fase 3.24 — Hook orquestrador do Catálogo Paramétrico.
 *
 * Estado session-only. Não cria providers/stores/managers/banco. Toda
 * mutação persistente continua indo pelo `updateProject()` do
 * PlannerEditorProvider (Fase 3.1) — preservando Undo/Redo/Autosave.
 */
import { useCallback, useMemo, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { listItems, getItem, itemsByCategory } from "../catalog";
import { searchItems, suggest } from "../search";
import { listManufacturers } from "../manufacturers";
import { listCollections } from "../collections";
import { listMaterials } from "../materials";
import { listHandles } from "../handles";
import { listHinges } from "../hinges";
import { listSlides } from "../drawers";
import { listProfiles } from "../profiles";
import { listGlass } from "../glass";
import { listMirrors } from "../mirrors";
import { listLeds } from "../led";
import { listAccessories } from "../accessories";
import { createVariant } from "../parametric";
import { priceVariant } from "../pricing";
import { evaluateRules } from "../rules";
import { readFavorites, toggleFavorite, clearFavorites } from "../favorites";
import { readRecents, pushRecent, clearRecents } from "../recents";
import { CATALOG_PREVIEW_MODES } from "../preview";
import type {
  CatalogItem,
  CatalogPreviewMode,
  CatalogSearchFilters,
  CatalogVariant,
  CatalogFavoritesState,
  CatalogRecentsState,
} from "../types";

export interface UseCatalog {
  readonly items: readonly CatalogItem[];
  readonly manufacturers: ReturnType<typeof listManufacturers>;
  readonly collections: ReturnType<typeof listCollections>;
  readonly materials: ReturnType<typeof listMaterials>;
  readonly handles: ReturnType<typeof listHandles>;
  readonly hinges: ReturnType<typeof listHinges>;
  readonly slides: ReturnType<typeof listSlides>;
  readonly profiles: ReturnType<typeof listProfiles>;
  readonly glass: ReturnType<typeof listGlass>;
  readonly mirrors: ReturnType<typeof listMirrors>;
  readonly leds: ReturnType<typeof listLeds>;
  readonly accessories: ReturnType<typeof listAccessories>;
  readonly previewModes: readonly CatalogPreviewMode[];
  readonly filters: CatalogSearchFilters;
  readonly filtered: readonly CatalogItem[];
  readonly selectedId: string | null;
  readonly selected: CatalogItem | null;
  readonly variant: CatalogVariant | null;
  readonly favorites: CatalogFavoritesState;
  readonly recents: CatalogRecentsState;
  readonly canInsert: boolean;
  readonly setFilters: (patch: Partial<CatalogSearchFilters>) => void;
  readonly select: (itemId: string | null) => void;
  readonly updateVariant: (patch: Partial<Omit<CatalogVariant, "id" | "itemId">>) => void;
  readonly toggleFavorite: (itemId: string) => void;
  readonly clearFavorites: () => void;
  readonly clearRecents: () => void;
  readonly itemsByCategory: typeof itemsByCategory;
  readonly suggest: (query: string, limit?: number) => readonly CatalogItem[];
  readonly insertSelected: () => boolean;
}

export function useCatalog(): UseCatalog {
  const editor = usePlannerEditor();
  const [filters, setFiltersState] = useState<CatalogSearchFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [variant, setVariant] = useState<CatalogVariant | null>(null);
  const [favorites, setFavorites] = useState<CatalogFavoritesState>(() => readFavorites());
  const [recents, setRecents] = useState<CatalogRecentsState>(() => readRecents());

  const filtered = useMemo(() => searchItems(filters), [filters]);
  const selected = useMemo(() => (selectedId ? (getItem(selectedId) ?? null) : null), [selectedId]);

  const setFilters = useCallback((patch: Partial<CatalogSearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const select = useCallback((itemId: string | null) => {
    setSelectedId(itemId);
    if (!itemId) {
      setVariant(null);
      return;
    }
    const item = getItem(itemId);
    if (item) {
      setVariant(createVariant(item, {}));
      setRecents(pushRecent(itemId));
    }
  }, []);

  const updateVariant = useCallback(
    (patch: Partial<Omit<CatalogVariant, "id" | "itemId">>) => {
      if (!selected) return;
      setVariant((prev) => createVariant(selected, { ...(prev ?? {}), ...patch }));
    },
    [selected],
  );

  const handleToggleFav = useCallback((itemId: string) => {
    setFavorites(toggleFavorite(itemId));
  }, []);

  const handleClearFav = useCallback(() => {
    setFavorites(clearFavorites());
  }, []);

  const handleClearRecents = useCallback(() => {
    setRecents(clearRecents());
  }, []);

  const canInsert = Boolean(
    editor.state.project && editor.state.selectedRoomId && selected && variant,
  );

  const insertSelected = useCallback((): boolean => {
    const roomId = editor.state.selectedRoomId;
    if (!editor.state.project || !roomId || !selected || !variant) return false;
    const price = priceVariant(selected, variant);
    const rules = evaluateRules(selected, variant);
    const nodeId = `catalog-${variant.id}`;
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
                  itemId: selected.id,
                  sku: selected.sku,
                  variantId: variant.id,
                  widthMm: variant.widthMm,
                  heightMm: variant.heightMm,
                  depthMm: variant.depthMm,
                  materialId: variant.materialId ?? null,
                  handleId: variant.handleId ?? null,
                  price: price.total,
                  warnings: rules.map((r) => r.message).join(" | "),
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
    return true;
  }, [editor, selected, variant]);

  return {
    items: listItems(),
    manufacturers: listManufacturers(),
    collections: listCollections(),
    materials: listMaterials(),
    handles: listHandles(),
    hinges: listHinges(),
    slides: listSlides(),
    profiles: listProfiles(),
    glass: listGlass(),
    mirrors: listMirrors(),
    leds: listLeds(),
    accessories: listAccessories(),
    previewModes: CATALOG_PREVIEW_MODES,
    filters,
    filtered,
    selectedId,
    selected,
    variant,
    favorites,
    recents,
    canInsert,
    setFilters,
    select,
    updateVariant,
    toggleFavorite: handleToggleFav,
    clearFavorites: handleClearFav,
    clearRecents: handleClearRecents,
    itemsByCategory,
    suggest,
    insertSelected,
  };
}
