import { queryOptions } from "@tanstack/react-query";
import {
  notificationAuditList,
  notificationDeliveriesList,
  notificationPreferencesList,
  notificationRulesList,
  notificationTemplatesList,
  notificationsList,
  notificationsMetrics,
} from "./notifications.functions";

export const notificationsQueryKeys = {
  all: ["core", "notifications"] as const,
  list: () => [...notificationsQueryKeys.all, "list"] as const,
  metrics: () => [...notificationsQueryKeys.all, "metrics"] as const,
  templates: () => [...notificationsQueryKeys.all, "templates"] as const,
  rules: () => [...notificationsQueryKeys.all, "rules"] as const,
  preferences: () => [...notificationsQueryKeys.all, "preferences"] as const,
  deliveries: () => [...notificationsQueryKeys.all, "deliveries"] as const,
  audit: () => [...notificationsQueryKeys.all, "audit"] as const,
};

export const notificationsListQuery = () =>
  queryOptions({
    queryKey: notificationsQueryKeys.list(),
    queryFn: () => notificationsList(),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

export const notificationsMetricsQuery = () =>
  queryOptions({
    queryKey: notificationsQueryKeys.metrics(),
    queryFn: () => notificationsMetrics(),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

export const notificationTemplatesQuery = () =>
  queryOptions({
    queryKey: notificationsQueryKeys.templates(),
    queryFn: () => notificationTemplatesList(),
    staleTime: 60_000,
  });

export const notificationRulesQuery = () =>
  queryOptions({
    queryKey: notificationsQueryKeys.rules(),
    queryFn: () => notificationRulesList(),
    staleTime: 30_000,
  });

export const notificationPreferencesQuery = () =>
  queryOptions({
    queryKey: notificationsQueryKeys.preferences(),
    queryFn: () => notificationPreferencesList(),
    staleTime: 30_000,
  });

export const notificationDeliveriesQuery = () =>
  queryOptions({
    queryKey: notificationsQueryKeys.deliveries(),
    queryFn: () => notificationDeliveriesList(),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

export const notificationAuditQuery = () =>
  queryOptions({
    queryKey: notificationsQueryKeys.audit(),
    queryFn: () => notificationAuditList(),
    staleTime: 30_000,
  });
