import type { AIProvider } from "../types";

export async function embedTexts(
  provider: AIProvider,
  inputs: readonly string[],
): Promise<readonly (readonly number[])[]> {
  if (!provider.embed) {
    throw new Error(`[ai] provider '${provider.config.id}' não suporta embeddings`);
  }
  return provider.embed(inputs);
}