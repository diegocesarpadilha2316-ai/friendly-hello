/**
 * Assets Enterprise — API pública única.
 * Nenhum módulo deve importar providers/manager/pipeline diretamente.
 */
export * from "./types";
export { ASSETS_CONFIG, classifyMime } from "./config";
export {
  assetsCreateUpload,
  assetsCompleteUpload,
  assetsSignDownload,
  assetsSoftDelete,
  assetsRestore,
  assetsHardDelete,
  assetsList,
  assetsStats,
  assetsListJobs,
  assetsListAudit,
  assetsConfig,
} from "./assets.functions";
export * from "./queries";
export * from "./use-assets";
