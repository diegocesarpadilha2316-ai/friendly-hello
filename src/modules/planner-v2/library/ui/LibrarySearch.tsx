import { Search } from "lucide-react";

export function LibrarySearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="library-search">
      <Search size={14} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar móveis, acessórios..."
      />
    </label>
  );
}
