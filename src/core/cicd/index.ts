/**
 * Fase 1.19 — CI/CD Enterprise
 * CIManager único (pipelines, builds, deploys, releases, artefatos,
 * ambientes, aprovações). Reutiliza Auth, Tenant, RBAC, Storage,
 * API Gateway, SDK, Jobs, Cache, IA, Security, Observability e
 * Event Center. Sem motores paralelos.
 */
export * from "./types";
export { cicdKeys, cicdSnapshotQuery } from "./queries";
export {
  useCicdSnapshot,
  useUpsertEnvironment, useDeleteEnvironment,
  useUpsertPipeline, useDeletePipeline,
  useRecordBuild,
  useRecordDeploy, useRollbackDeploy,
  useUpsertRelease, useDeleteRelease,
  useRecordArtifact,
  useDecideApproval,
  type EnvironmentInput, type PipelineInput, type BuildInput,
  type DeployInput, type ReleaseInput, type ArtifactInput,
  type ApprovalDecisionInput,
} from "./use-cicd";
