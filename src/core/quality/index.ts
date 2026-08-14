/**
 * Fase 1.18 — Testes Automatizados & Qualidade Enterprise
 * API única (TestManager) consumida por todos os módulos da Dioris.
 * Reutiliza Auth, Tenant, RBAC, Storage, API Gateway, SDK, Jobs, Cache,
 * IA, Security, Observability e Event Center — sem motores paralelos.
 */
export * from "./types";
export { qualityKeys, qualitySnapshotQuery } from "./queries";
export {
  useQualitySnapshot,
  useUpsertSuite,
  useDeleteSuite,
  useRecordRun,
  useRecordCoverage,
  useUpsertGate,
  useDeleteGate,
  type SuiteInput,
  type RunInput,
  type CoverageInput,
  type GateInput,
} from "./use-quality";
