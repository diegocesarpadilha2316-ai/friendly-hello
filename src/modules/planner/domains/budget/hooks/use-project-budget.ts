/**
 * Etapa 12 — Hook único do Orçamento Profissional.
 *
 * Não cria provider nem store novos: lê o projeto do `PlannerEditorProvider`,
 * as quantidades físicas do motor de produção existente e persiste apenas o
 * orçamento (overrides + revisões) no `localStorage` isolado por tenant.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTenant } from "@/core/providers/TenantProvider";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { loadRules } from "@/modules/planner/shared/engineering/company-rules";
import { buildProductionReport } from "@/modules/planner/domains/production/services/report";
import { listMaterials } from "@/modules/planner/domains/catalog/materials";
import { getCachedLibraryMaterial } from "@/modules/planner/domains/catalog/services/library-supabase";
import type {
  BudgetItem,
  BudgetOverrides,
  BudgetSettings,
  ProjectBudget,
} from "../types";
import {
  DEFAULT_BUDGET_SETTINGS,
  EMPTY_OVERRIDES,
  calculateBudget,
  commitRevision,
  loadBudgetRecord,
  mergeSettings,
  projectSignature,
  saveCurrentBudget,
  saveOverrides,
  saveSettings,
  subscribeBudget,
  type QuantifyHardware,
  type QuantifyPart,
} from "../services";

/** Resolve R$/m² de um material pelo nome — Biblioteca Dioris, depois semente. */
function materialPriceResolver(): (material: string) => number | null {
  const seeds = listMaterials();
  return (material: string) => {
    const key = material.trim().toLowerCase();
    if (!key) return null;
    const lib = getCachedLibraryMaterial(key);
    if (lib?.pricePerM2) return lib.pricePerM2;
    const seed = seeds.find(
      (m) => m.name.toLowerCase() === key || key.includes(m.name.toLowerCase()),
    );
    return seed?.pricePerM2 ?? null;
  };
}

export interface UseProjectBudgetResult {
  readonly hasProject: boolean;
  readonly budget: ProjectBudget | null;
  readonly saved: ProjectBudget | null;
  readonly settings: BudgetSettings;
  readonly overrides: BudgetOverrides;
  readonly revisions: ReturnType<typeof loadBudgetRecord>["revisions"];
  /** O projeto mudou depois do último orçamento salvo. */
  readonly outdated: boolean;
  readonly recalculate: () => void;
  readonly updateSettings: (patch: Partial<BudgetSettings>) => void;
  readonly setItemPrice: (id: string, price: number | null) => void;
  readonly setItemQuantity: (id: string, qty: number | null) => void;
  readonly setItemWaste: (id: string, pct: number | null) => void;
  readonly toggleItem: (id: string) => void;
  readonly addExtra: (item: BudgetItem) => void;
  readonly saveRevision: (label: string) => void;
  readonly resetOverrides: () => void;
}

export function useProjectBudget(): UseProjectBudgetResult {
  const { state } = usePlannerEditor();
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const project = state.project;
  const projectId = project?.id ?? "none";

  const record = useSyncExternalStore(
    useCallback((fn) => subscribeBudget(tenantId, projectId, fn), [tenantId, projectId]),
    () => loadBudgetRecord(tenantId, projectId),
    () => loadBudgetRecord(tenantId, projectId),
  );

  const settings = useMemo(
    () => mergeSettings(DEFAULT_BUDGET_SETTINGS, record.settings),
    [record.settings],
  );
  const overrides = record.overrides ?? EMPTY_OVERRIDES;

  const signature = useMemo(() => (project ? projectSignature(project) : ""), [project]);

  const budget = useMemo<ProjectBudget | null>(() => {
    if (!project) return null;
    const rules = loadRules(tenantId);
    const report = buildProductionReport(project, rules);
    const parts: QuantifyPart[] = report.parts.map((p) => ({
      kind: p.kind,
      category: p.category,
      label: p.label,
      material: p.material,
      finish: p.finish,
      qty: p.qty,
      areaM2: p.areaM2,
      edgeMeters: p.edgeMeters,
      furnitureLabel: p.furnitureLabel,
      roomLabel: p.roomLabel,
    }));
    const hardware: QuantifyHardware[] = report.hardware.map((h) => ({
      kind: h.kind,
      brand: h.brand,
      code: h.code,
      label: h.label,
      qty: h.qty,
      unit: h.unit,
      unitPrice: h.unitPrice,
    }));
    return calculateBudget({
      tenantId,
      projectId: project.id,
      projectName: project.name,
      clientName: project.client ?? project.name,
      projectSignature: signature,
      settings,
      overrides,
      parts,
      hardware,
      boardsCount: report.cuttingPlan.totals.boardsCount,
      time: report.time,
      materialPricePerM2: materialPriceResolver(),
      previous: record.current,
    });
  }, [project, tenantId, settings, overrides, signature, record.current]);

  const recalculate = useCallback(() => {
    if (budget) saveCurrentBudget(tenantId, projectId, budget);
  }, [budget, tenantId, projectId]);

  const patchOverrides = useCallback(
    (patch: Partial<BudgetOverrides>) => {
      saveOverrides(tenantId, projectId, { ...overrides, ...patch });
    },
    [tenantId, projectId, overrides],
  );

  const numericPatch = useCallback(
    (field: "unitCost" | "quantity" | "wastePct", id: string, value: number | null) => {
      const next = { ...overrides[field] } as Record<string, number>;
      if (value == null) delete next[id];
      else next[id] = value;
      patchOverrides({ [field]: next } as Partial<BudgetOverrides>);
    },
    [overrides, patchOverrides],
  );

  return {
    hasProject: Boolean(project),
    budget,
    saved: record.current,
    settings,
    overrides,
    revisions: record.revisions,
    outdated: Boolean(record.current && record.current.projectSignature !== signature),
    recalculate,
    updateSettings: (patch) => saveSettings(tenantId, projectId, mergeSettings(settings, patch)),
    setItemPrice: (id, price) => numericPatch("unitCost", id, price),
    setItemQuantity: (id, qty) => numericPatch("quantity", id, qty),
    setItemWaste: (id, pct) => numericPatch("wastePct", id, pct),
    toggleItem: (id) => {
      const set = new Set(overrides.excluded);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      patchOverrides({ excluded: [...set] });
    },
    addExtra: (item) => patchOverrides({ extras: [...overrides.extras, item] }),
    saveRevision: (label) => {
      if (budget) commitRevision(tenantId, projectId, budget, label);
    },
    resetOverrides: () => saveOverrides(tenantId, projectId, EMPTY_OVERRIDES),
  };
}