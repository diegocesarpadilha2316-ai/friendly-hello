import { useQuery } from "@tanstack/react-query";
import { aiHealthQuery, aiMetricsQuery, aiModelsQuery } from "./queries";

export function useAIHealth() {
  return useQuery(aiHealthQuery());
}
export function useAIMetrics() {
  return useQuery(aiMetricsQuery());
}
export function useAIModels() {
  return useQuery(aiModelsQuery());
}
