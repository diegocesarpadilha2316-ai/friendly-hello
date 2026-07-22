/**
 * Configuration — API pública única.
 * Único ponto de leitura/gravação de configurações da plataforma.
 * Módulos consomem exclusivamente daqui — proibido criar stores ou fetchers próprios.
 */
export * from "./types";
export * from "./queries";
export * from "./use-configuration";
export {
  platformGet,
  companySettingsGet,
  companySettingsUpsert,
  flagsList,
  flagUpsert,
  flagDelete,
  integrationsList,
  integrationUpsert,
  integrationTest,
  brandingGet,
  brandingUpsert,
  localizationGet,
  localizationUpsert,
  securityGet,
  securityUpsert,
  backupGet,
  backupUpsert,
  apiKeysList,
  apiKeyCreate,
  apiKeyRevoke,
  configurationSnapshot,
  configurationExport,
} from "./configuration.functions";