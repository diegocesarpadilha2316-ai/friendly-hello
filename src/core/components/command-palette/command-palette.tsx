import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Building2,
  Command as CommandIcon,
  Database,
  Gauge,
  Globe2,
  HardDrive,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  Plug,
  Puzzle,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { modules } from "@/core/config";

/**
 * Command Palette global do Admin Center.
 * Fonte única de navegação/ações — consome apenas o Core (config.modules
 * + rotas já registradas no TanStack Router). Sem stores/queries paralelos.
 */

export type CommandEntry = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  to: string;
  group: "Admin" | "Módulos" | "Plataforma" | "Ações";
  keywords?: string[];
};

const ADMIN_ENTRIES: ReadonlyArray<CommandEntry> = [
  { id: "dash", label: "Dashboard Executivo", icon: LayoutDashboard, to: "/", group: "Admin", keywords: ["home", "kpi", "resumo"] },
  { id: "admin", label: "Admin Center", icon: CommandIcon, to: "/admin", group: "Admin", keywords: ["painel", "controle"] },
  { id: "empresas", label: "Empresas", icon: Building2, to: "/configuracoes/empresa", group: "Admin", keywords: ["tenants", "companies"] },
  { id: "users", label: "Usuários & Equipes", icon: Users, to: "/configuracoes", group: "Admin", keywords: ["members", "papéis"] },
];

const PLATFORM_ENTRIES: ReadonlyArray<CommandEntry> = [
  { id: "ai", label: "IA Gateway", icon: Sparkles, to: "/ia", group: "Plataforma" },
  { id: "storage", label: "Storage & Assets", icon: HardDrive, to: "/storage", group: "Plataforma" },
  { id: "notifs", label: "Notificações", icon: Bell, to: "/notificacoes", group: "Plataforma" },
  { id: "integr", label: "Integrações", icon: Plug, to: "/integracoes", group: "Plataforma" },
  { id: "sdk", label: "SDK & Plugins", icon: Puzzle, to: "/sdk", group: "Plataforma" },
  { id: "jobs", label: "Jobs & Workers", icon: ListTodo, to: "/jobs", group: "Plataforma" },
  { id: "gw", label: "API Gateway", icon: Globe2, to: "/api-gateway", group: "Plataforma" },
  { id: "cache", label: "Cache Distribuído", icon: Database, to: "/cache", group: "Plataforma" },
  { id: "sec", label: "Segurança", icon: ShieldCheck, to: "/security", group: "Plataforma" },
  { id: "qa", label: "Qualidade", icon: Gauge, to: "/quality", group: "Plataforma" },
  { id: "cicd", label: "CI/CD", icon: Rocket, to: "/cicd", group: "Plataforma" },
  { id: "rec", label: "Recovery", icon: LifeBuoy, to: "/recovery", group: "Plataforma" },
  { id: "obs", label: "Observabilidade", icon: Activity, to: "/observabilidade", group: "Plataforma" },
  { id: "cfg", label: "Configurações", icon: Settings, to: "/configuracoes", group: "Plataforma" },
];

const RECENT_STORAGE_KEY = "dioris.admin.command.recents";
const RECENT_LIMIT = 5;

function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string) {
  if (typeof window === "undefined") return;
  try {
    const list = [id, ...loadRecents().filter((x) => x !== id)].slice(0, RECENT_LIMIT);
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    if (open) setRecents(loadRecents());
  }, [open]);

  const moduleEntries = useMemo<CommandEntry[]>(
    () =>
      modules.map((m) => ({
        id: `mod-${m.id}`,
        label: m.label,
        hint: m.description,
        icon: m.icon,
        to: m.path,
        group: "Módulos" as const,
      })),
    [],
  );

  const all = useMemo<CommandEntry[]>(
    () => [...ADMIN_ENTRIES, ...moduleEntries, ...PLATFORM_ENTRIES],
    [moduleEntries],
  );
  const byId = useMemo(() => new Map(all.map((e) => [e.id, e] as const)), [all]);
  const recentEntries = recents.map((id) => byId.get(id)).filter(Boolean) as CommandEntry[];

  const run = (entry: CommandEntry) => {
    pushRecent(entry.id);
    onOpenChange(false);
    navigate({ to: entry.to });
  };

  const renderItem = (entry: CommandEntry) => {
    const Icon = entry.icon;
    return (
      <CommandItem
        key={entry.id}
        value={`${entry.label} ${entry.hint ?? ""} ${(entry.keywords ?? []).join(" ")}`}
        onSelect={() => run(entry)}
      >
        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="truncate">{entry.label}</span>
        {entry.hint ? (
          <span className="ml-auto truncate text-xs text-muted-foreground">{entry.hint}</span>
        ) : null}
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar empresas, usuários, módulos, configurações, logs…" />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        {recentEntries.length > 0 ? (
          <>
            <CommandGroup heading="Recentes">{recentEntries.map(renderItem)}</CommandGroup>
            <CommandSeparator />
          </>
        ) : null}
        <CommandGroup heading="Admin">{ADMIN_ENTRIES.map(renderItem)}</CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Módulos">{moduleEntries.map(renderItem)}</CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Plataforma">{PLATFORM_ENTRIES.map(renderItem)}</CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Atalho">
          <CommandItem disabled>
            <CommandIcon className="mr-2 h-4 w-4" /> Abra a qualquer momento
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}