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
  const [activeFamily, setActiveFamily] = useState<FamilyId>("generic");
  const [query, setQuery] = useState("");
  const addFurnitureInstance = usePlannerStore((s) => s.addFurnitureInstance);
  const lastLibraryError = usePlannerStore((s) => s.lastLibraryError);
  const clearLibraryError = usePlannerStore((s) => s.clearLibraryError);

  const families = useMemo(() => FamilyRegistry.list(), []);
  const family = FamilyRegistry.get(activeFamily);

  const modules = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ModuleRegistry.listByFamily(activeFamily).filter((module) =>
      term ? `${module.name} ${module.category}`.toLowerCase().includes(term) : true
    );
  }, [activeFamily, query]);

  return (
    <div className="library-panel">
      <LibrarySearch value={query} onChange={setQuery} />
      <LibraryCategoryList
        families={families}
        activeId={activeFamily}
        onSelect={setActiveFamily}
      />

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
            />
          ))}
        </div>
      )}
    </div>
  );
}