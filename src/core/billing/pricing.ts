/**
 * Catálogo de preços internos em créditos por ação.
 * Fonte única — importado por todos os pontos de uso (IA, Render, Vídeo).
 * Ajustar aqui reflete no débito automático de wallets.
 */

export type CreditPriceKey =
  | "ai.message.assistant"
  | "ai.message.tokens_per_1k"
  | "ai.tool_call"
  | "render.image"
  | "render.video_per_sec"
  | "render.panorama"
  | "render.turntable";

export const CREDIT_PRICES: Record<CreditPriceKey, number> = {
  "ai.message.assistant": 1,
  "ai.message.tokens_per_1k": 1,
  "ai.tool_call": 2,
  "render.image": 20,
  "render.video_per_sec": 8,
  "render.panorama": 30,
  "render.turntable": 60,
};

export function priceRenderJob(input: {
  kind: "image" | "video" | "panorama" | "turntable";
  durationSec?: number | null;
  quality?: string | null;
}): number {
  const q = (input.quality ?? "").toLowerCase();
  const qualityMult = q === "ultra" ? 2 : q === "high" ? 1.5 : q === "draft" ? 0.5 : 1;
  let base = 0;
  if (input.kind === "image") base = CREDIT_PRICES["render.image"];
  else if (input.kind === "panorama") base = CREDIT_PRICES["render.panorama"];
  else if (input.kind === "turntable") base = CREDIT_PRICES["render.turntable"];
  else base = CREDIT_PRICES["render.video_per_sec"] * Math.max(1, input.durationSec ?? 8);
  return Math.max(1, Math.ceil(base * qualityMult));
}

export function priceAiAssistantMessage(input: { tokensIn?: number; tokensOut?: number }): number {
  const totalTokens = (input.tokensIn ?? 0) + (input.tokensOut ?? 0);
  const tokenCost = Math.ceil(totalTokens / 1000) * CREDIT_PRICES["ai.message.tokens_per_1k"];
  return CREDIT_PRICES["ai.message.assistant"] + tokenCost;
}
