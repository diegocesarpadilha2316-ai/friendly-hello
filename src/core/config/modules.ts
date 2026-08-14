import {
  CalendarRange,
  LayoutTemplate,
  Boxes,
  Users,
  Wallet,
  ShoppingBag,
  Workflow,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AppModule } from "./app";

export interface ModuleDefinition {
  id: AppModule;
  slug: string; // segmento de URL
  path: string; // rota absoluta
  label: string; // rótulo pt-BR
  description: string;
  icon: LucideIcon;
  status: "planejado" | "em-desenvolvimento" | "disponivel";
}

export const modules: readonly ModuleDefinition[] = [
  {
    id: "planner",
    slug: "planner",
    path: "/planner",
    label: "Planner",
    description: "Planejamento, tarefas e cronogramas colaborativos.",
    icon: CalendarRange,
    status: "planejado",
  },
  {
    id: "sites",
    slug: "sites",
    path: "/sites",
    label: "Sites",
    description: "Criação e gestão de sites da operação.",
    icon: LayoutTemplate,
    status: "planejado",
  },
  {
    id: "systems",
    slug: "sistemas",
    path: "/sistemas",
    label: "Sistemas",
    description: "Sistemas internos e ferramentas customizadas.",
    icon: Boxes,
    status: "planejado",
  },
  {
    id: "crm",
    slug: "crm",
    path: "/crm",
    label: "CRM",
    description: "Relacionamento com clientes, leads e pipeline.",
    icon: Users,
    status: "planejado",
  },
  {
    id: "finance",
    slug: "financeiro",
    path: "/financeiro",
    label: "Financeiro",
    description: "Faturamento, contas e conciliação.",
    icon: Wallet,
    status: "planejado",
  },
  {
    id: "marketplace",
    slug: "marketplace",
    path: "/marketplace",
    label: "Marketplace",
    description: "Catálogo e vendas em canais externos.",
    icon: ShoppingBag,
    status: "planejado",
  },
  {
    id: "automation",
    slug: "automacao",
    path: "/automacao",
    label: "Automação",
    description: "Fluxos, gatilhos e orquestração de processos.",
    icon: Workflow,
    status: "planejado",
  },
  {
    id: "ai",
    slug: "ia",
    path: "/ia",
    label: "IA",
    description: "Recursos de inteligência artificial da plataforma.",
    icon: Sparkles,
    status: "planejado",
  },
] as const;

export const moduleById = Object.fromEntries(modules.map((m) => [m.id, m])) as Record<
  AppModule,
  ModuleDefinition
>;
