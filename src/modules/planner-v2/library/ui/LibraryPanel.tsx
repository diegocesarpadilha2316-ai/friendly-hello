import { useMemo, useState } from "react";
import type { FamilyId } from "../contracts/FamilyDefinition";
import { FamilyRegistry } from "../registry/FamilyRegistry";
import { ModuleRegistry } from "../registry/ModuleRegistry";
import { usePlannerStore } from "../../pkg/state/usePlannerStore";
import { LibraryCategoryList } from "./LibraryCategoryList";
import { LibraryModuleCard } from "./LibraryModuleCard";
import { LibrarySearch } from "./LibrarySearch";
import "../../library";

export function LibraryPanel() {
  const [activeFamily, setActiveFamily] = useState<FamilyId>("kitchen");
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const [query, setQuery] = useState("");
  const addFurnitureInstance = usePlannerStore((s) => s.addFurnitureInstance);
  const lastLibraryError = usePlannerStore((s) => s.lastLibraryError);
  const clearLibraryError = usePlannerStore((s) => s.clearLibraryError);
  const setDragPreview = usePlannerStore((s) => s.setDragPreview);
  const clearDragPreview = usePlannerStore((s) => s.clearDragPreview);

  const families = useMemo(() => FamilyRegistry.list(), []);
  const family = FamilyRegistry.get(activeFamily);

  const familyModules = useMemo(() => ModuleRegistry.listByFamily(activeFamily), [activeFamily]);
  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(familyModules.map((module) => module.category)))],
    [familyModules],
  );
  const modules = useMemo(() => {
    const term = query.trim().toLowerCase();
    return familyModules.filter(
      (module) =>
        (activeCategory === "Todas" || module.category === activeCategory) &&
        (term
          ? `${module.name} ${module.category} ${module.subcategory ?? ""} ${module.kind ?? ""}`
              .toLowerCase()
              .includes(term)
          : true),
    );
  }, [activeCategory, familyModules, query]);

  return (
    <div className="library-panel">
      <LibrarySearch value={query} onChange={setQuery} />
      <LibraryCategoryList
        families={families}
        activeId={activeFamily}
        onSelect={(familyId) => {
          setActiveFamily(familyId);
          setActiveCategory("Todas");
        }}
      />
      <div className="library-subcategories" role="tablist" aria-label="Categorias da biblioteca">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={activeCategory === category ? "active" : ""}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {lastLibraryError && (
        <div className="library-error" onClick={clearLibraryError}>
          {lastLibraryError}
        </div>
      )}

      {family && !family.enabled ? (
        <p className="library-empty">Em breve: módulos especializados para esta família.</p>
      ) : modules.length === 0 ? (
        <p className="library-empty">Não encontramos módulos com este nome.</p>
      ) : (
        <div className="library-cards">
          {modules.map((definition) => (
            <LibraryModuleCard
              key={definition.id}
              definition={definition}
              onAdd={addFurnitureInstance}
              onDragStart={(moduleId) => setDragPreview(moduleId, { x: 0, y: 0, z: 0 })}
              onDragEnd={clearDragPreview}
              onTouchStart={(moduleId) => setDragPreview(moduleId, { x: 0, y: 0, z: 0 })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
