/**
 * SDK Enterprise — API única para plugins/extensões da Dioris.
 * Nenhum plugin acessa Supabase/Storage/Billing/AI diretamente.
 */
export * from "./types";
export * from "./queries";
export * from "./use-sdk";
export { PluginRegistry, HookRegistry } from "./registry";
export { PluginEventBus } from "./plugin-events";
export { createClientSdkStub, type DiorisSDK } from "./sdk";
export {
  pluginsList,
  pluginLogs,
  pluginPermissionsList,
  pluginUpdatesList,
  marketplaceList,
  sdkSnapshot,
  pluginInstall,
  pluginEnable,
  pluginDisable,
  pluginUninstall,
  marketplaceInstall,
  sdkExport,
} from "./plugin-functions";
