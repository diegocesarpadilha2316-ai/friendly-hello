/**
 * Dashboard — tipos canônicos (Core).
 * Toda camada visual (widgets, cards, grid) consome estes tipos.
 * Módulos NUNCA definem tipos paralelos — sempre estendem daqui.
 */
import type { Permission } from "@/core/types/rbac";
import type { LucideIcon } from "lucide-react";

/** Slot semântico de um widget na grid. */
export type WidgetSize = "sm" | "md" | "lg" | "xl";

export type WidgetTone = "neutral" | "brand" | "positive" | "warning" | "danger";

/** Estados universais consumidos por qualquer widget assíncrono. */
export type WidgetState<TData> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; data: TData };

/** Descriptor declarativo de um widget — registry-driven, ocultável via RBAC. */
export interface WidgetDescriptor {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly size: WidgetSize;
  readonly permission?: Permission;
  /** Módulo dono (ai, planner, crm, …). Usado por filtros e favoritos. */
  readonly owner?: string;
  /** Ordem sugerida — usuário pode sobrescrever no futuro (personalização). */
  readonly order?: number;
  /** Render puro — nenhuma lógica de dados aqui. */
  render: () => React.ReactNode;
}

/** DTOs canônicos — cada domínio popula um subconjunto. */
export interface CreditsSummary {
  readonly available: number;
  readonly used: number;
  readonly resetsAt: string | null;
}

export interface PlanSummary {
  readonly key: string;
  readonly label: string;
  readonly status: "active" | "trial" | "past_due" | "canceled";
  readonly renewsAt: string | null;
}

export interface AiUsageToday {
  readonly requests: number;
  readonly creditsSpent: number;
  readonly byCapability: ReadonlyArray<{ capability: string; count: number }>;
}

export interface RecentProject {
  readonly id: string;
  readonly name: string;
  readonly module: string;
  readonly updatedAt: string;
  readonly href?: string;
}

export interface ActivityEntry {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly target?: string;
  readonly at: string;
  readonly icon?: LucideIcon;
}

export interface UpcomingTask {
  readonly id: string;
  readonly title: string;
  readonly dueAt: string | null;
  readonly module?: string;
}

export interface UsageMetric {
  readonly label: string;
  readonly used: number;
  readonly total: number;
  readonly unit: string;
}

export interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly to: string;
  readonly icon?: LucideIcon;
  readonly permission?: Permission;
}

export interface KpiPoint {
  readonly label: string;
  readonly value: number;
  readonly delta?: number;
  readonly tone?: WidgetTone;
  readonly hint?: string;
}

/** Série pronta para consumo por gráficos (agnóstica de biblioteca). */
export interface ChartSeries {
  readonly name: string;
  readonly points: ReadonlyArray<{ x: string | number; y: number }>;
}

/** Snapshot completo — payload que o loader devolve para o dashboard. */
export interface DashboardSnapshot {
  readonly credits: CreditsSummary;
  readonly plan: PlanSummary;
  readonly aiToday: AiUsageToday;
  readonly recentProjects: ReadonlyArray<RecentProject>;
  readonly activity: ReadonlyArray<ActivityEntry>;
  readonly upcoming: ReadonlyArray<UpcomingTask>;
  readonly usage: ReadonlyArray<UsageMetric>;
  readonly kpis: ReadonlyArray<KpiPoint>;
  readonly charts: ReadonlyArray<{ id: string; title: string; series: ReadonlyArray<ChartSeries> }>;
  readonly meta: {
    readonly tenantId: string;
    readonly generatedAt: string;
    readonly warming: boolean;
  };
}
