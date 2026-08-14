/**
 * Integrations — API pública única.
 * Gateway central para OAuth, APIs, Webhooks, SDKs e conectores.
 * Nenhum módulo pode acessar APIs externas fora deste ponto.
 */
export * from "./types";
export * from "./config";
export * from "./queries";
export * from "./use-integrations";
export {
  integrationsProviders,
  integrationsList,
  integrationsSnapshot,
  integrationsHealthList,
  integrationsLogsList,
  integrationsWebhooksList,
  integrationsSyncsList,
  integrationsEventsList,
  integrationUpsert,
  integrationDelete,
  integrationTest,
  integrationsExport,
  webhookRegister,
  webhookDelete,
} from "./integrations.functions";
