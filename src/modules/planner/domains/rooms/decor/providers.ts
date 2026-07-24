/**
 * Fase 3.8 — IA Decoradora: registro de providers.
 *
 * Interface comum para qualquer IA decoradora (GPT/Gemini/Claude/OSS).
 * Nesta fase todos os providers delegam ao motor de regras local
 * `generateDecorPlan`. Ao plugar IA real, substitua a implementação sem
 * alterar consumidores.
 */
import type { PlannerRoom } from "@/modules/planner/shared/types/project";
import { generateDecorPlan, type GeneratePlanOptions } from "./rules";
import type { DecorPlan, DecorStyleId } from "./types";

export interface DecoratorAnalyzeInput {
  room: PlannerRoom;
  styleId: DecorStyleId;
  options?: GeneratePlanOptions;
  signal?: AbortSignal;
}

export interface DecoratorProvider {
  id: string;
  name: string;
  vendor: "openai" | "google" | "anthropic" | "oss" | "local";
  description: string;
  requiresApiKey: boolean;
  available: boolean;
  suggest(input: DecoratorAnalyzeInput): Promise<DecorPlan>;
}

function stub(
  id: string,
  name: string,
  vendor: DecoratorProvider["vendor"],
  description: string,
): DecoratorProvider {
  return {
    id,
    name,
    vendor,
    description,
    requiresApiKey: vendor !== "local",
    available: vendor === "local",
    async suggest({ room, styleId, options }) {
      return generateDecorPlan(room, styleId, { ...options, provider: id });
    },
  };
}

export const DECORATOR_PROVIDERS: readonly DecoratorProvider[] = [
  stub("dioris.local", "Dioris Decorator (local)", "local",
    "Motor heurístico determinístico — offline, sem credenciais externas."),
  stub("openai.gpt-decor", "GPT Decorator", "openai",
    "Sugestões amplas com contexto multimodal do OpenAI."),
  stub("google.gemini-decor", "Gemini Decorator", "google",
    "Sugestões multimodais com forte compreensão de composição."),
  stub("anthropic.claude-decor", "Claude Decorator", "anthropic",
    "Sugestões explicáveis, alinhadas a briefings extensos."),
  stub("oss.decor", "Open Source Decorator", "oss",
    "Modelos abertos executados em infraestrutura própria."),
];

export function getDecoratorProvider(id: string): DecoratorProvider {
  return DECORATOR_PROVIDERS.find((p) => p.id === id) ?? DECORATOR_PROVIDERS[0];
}

export const DEFAULT_DECORATOR_PROVIDER_ID = DECORATOR_PROVIDERS[0].id;