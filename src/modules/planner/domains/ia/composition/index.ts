/**
 * Inteligencia de Composicao do Ambiente — barrel.
 * Analise -> Composicao -> Decoracao -> Controle de qualidade.
 */
export * from "./types";
export { analyzeRoom, describeAnalysis, readOpenings } from "./analyze";
export { composeLayout, classifyPiece } from "./compose";
export { composeDecor } from "./decor";
export { evaluateComposition, rebalanceComposition, describeQuality } from "./quality";
export { STYLE_PROFILES, resolveStyle, styleProfile } from "./styles";
export type { StyleProfile } from "./styles";