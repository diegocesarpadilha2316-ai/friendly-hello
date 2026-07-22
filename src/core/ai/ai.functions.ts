/**
 * Server functions do AI Gateway.
 * Todos os módulos consomem AI EXCLUSIVAMENTE via estas funções.
 * Débito de créditos passa obrigatoriamente pelo credit_ledger (billing).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import { AI_MODEL_CATALOG } from "./catalog";
import { AI_GATEWAY_CONFIG } from "./config";
import type {
  AICapability,
  AIGatewayMetrics,
  AIModel,
  AIProviderHealth,
  AIResponse,
} from "./types";

const taskSchema = z.object({
  type: z.enum(["text", "json", "image", "embedding", "audio", "video"]),
  quality: z.enum(["draft", "standard", "premium", "frontier"]).optional(),
  speed: z.enum(["fast", "balanced", "slow"]).optional(),
  cost: z.enum(["cheap", "balanced", "premium"]).optional(),
  stream: z.boolean().optional(),
  preferProvider: z.string().optional(),
  preferModel: z.string().optional(),
});

const requestSchema = z.object({
  task: taskSchema,
  system: z.string().max(20_000).optional(),
  prompt: z.string().max(200_000).optional(),
  input: z.union([z.string(), z.array(z.string())]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(32_000).optional(),
  reason: z.string().min(1).max(120).default("ai:generate"),
  reference: z.string().max(120).optional(),
});

async function debitCredits(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  amount: number,
  reason: string,
  reference: string | undefined,
) {
  if (amount <= 0) return;
  await supabase.from("credit_ledger").insert({
    company_id: tenantId,
    kind: "consume",
    amount: -Math.abs(amount),
    reason,
    reference: reference ?? null,
    actor_id: userId,
  });
}

export const aiGenerateText = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => requestSchema.parse(raw))
  .handler(async ({ context, data }): Promise<AIResponse<string>> => {
    const { AIManager } = await import("./manager.server");
    const out = await AIManager.generateText({
      task: { ...data.task, type: "text" },
      system: data.system,
      prompt: data.prompt,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
    });
    await debitCredits(
      context.supabase,
      context.tenantId,
      context.userId,
      out.usage.credits,
      data.reason,
      data.reference,
    );
    return out;
  });

export const aiGenerateJson = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => requestSchema.parse(raw))
  .handler(async ({ context, data }): Promise<AIResponse<unknown>> => {
    const { AIManager } = await import("./manager.server");
    const out = await AIManager.generateJson({
      task: { ...data.task, type: "json" },
      system: data.system,
      prompt: data.prompt,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
    });
    await debitCredits(
      context.supabase,
      context.tenantId,
      context.userId,
      out.usage.credits,
      data.reason,
      data.reference,
    );
    return out;
  });

export const aiGenerateEmbedding = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => requestSchema.parse(raw))
  .handler(async ({ context, data }): Promise<AIResponse<readonly number[][]>> => {
    const { AIManager } = await import("./manager.server");
    const out = await AIManager.generateEmbedding({
      task: { ...data.task, type: "embedding" },
      input: data.input,
    });
    await debitCredits(
      context.supabase,
      context.tenantId,
      context.userId,
      out.usage.credits,
      data.reason,
      data.reference,
    );
    return out;
  });

export const aiHealthAll = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async (): Promise<readonly AIProviderHealth[]> => {
    const { AIManager } = await import("./manager.server");
    return AIManager.healthAll();
  });

export const aiMetrics = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async (): Promise<AIGatewayMetrics> => {
    const { AIManager } = await import("./manager.server");
    return AIManager.getMetrics();
  });

export const aiListModels = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler((): {
    models: readonly AIModel[];
    defaultProvider: string;
    priority: readonly string[];
    capabilities: readonly AICapability[];
    featureFlags: typeof AI_GATEWAY_CONFIG.featureFlags;
  } => ({
    models: AI_MODEL_CATALOG,
    defaultProvider: AI_GATEWAY_CONFIG.defaultProvider,
    priority: AI_GATEWAY_CONFIG.providerPriority,
    capabilities: [
      "text",
      "json",
      "stream",
      "image",
      "embedding",
      "audio",
      "video",
      "tools",
      "multimodal",
      "mcp",
    ],
    featureFlags: AI_GATEWAY_CONFIG.featureFlags,
  }));
