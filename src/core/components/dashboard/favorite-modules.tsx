import { DashboardCard } from "./dashboard-card";
import { ModuleCard } from "@/core/components/ui-kit/module-card";
import { modules } from "@/core/config";
import { useNavigate } from "@tanstack/react-router";

export interface FavoriteModulesProps {
  /** IDs preferidos — futuro: vêm da preferência do usuário. */
  favorites?: ReadonlyArray<string>;
  title?: string;
  emptyMessage?: string;
}

export function FavoriteModules({
  favorites,
  title = "Módulos favoritos",
  emptyMessage = "Defina módulos favoritos para acesso rápido.",
}: FavoriteModulesProps) {
  const navigate = useNavigate();
  const list = favorites?.length
    ? modules.filter((m) => favorites.includes(m.id))
    : modules.slice(0, 4);
  return (
    <DashboardCard title={title} description={favorites?.length ? undefined : emptyMessage}>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((m) => (
          <ModuleCard
            key={m.id}
            name={m.label}
            description={m.description}
            icon={<m.icon className="h-5 w-5" />}
            status={{ label: m.status, tone: "neutral" }}
            onOpen={() => navigate({ to: m.path })}
          />
        ))}
      </div>
    </DashboardCard>
  );
}
