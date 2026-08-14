import type { FamilyDefinition, FamilyId } from "../contracts/FamilyDefinition";

export function LibraryCategoryList({
  families,
  activeId,
  onSelect,
}: {
  families: FamilyDefinition[];
  activeId: FamilyId;
  onSelect: (id: FamilyId) => void;
}) {
  return (
    <div className="library-families">
      {families.map((family) => (
        <button
          key={family.id}
          type="button"
          className={`library-family ${activeId === family.id ? "active" : ""} ${
            family.enabled ? "" : "opacity-50 grayscale cursor-not-allowed"
          }`}
          onClick={() => family.enabled && onSelect(family.id)}
        >
          <span>{family.name}</span>
          <span className="library-badge">{family.enabled ? family.moduleIds.length : "—"}</span>
        </button>
      ))}
    </div>
  );
}
