import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  notificationsArchive,
  notificationsMarkAllRead,
  notificationsMarkRead,
} from "./notifications.functions";
import {
  notificationAuditQuery,
  notificationDeliveriesQuery,
  notificationPreferencesQuery,
  notificationRulesQuery,
  notificationTemplatesQuery,
  notificationsListQuery,
  notificationsMetricsQuery,
  notificationsQueryKeys,
} from "./queries";

export const useNotifications = () => useQuery(notificationsListQuery());
export const useNotificationMetrics = () => useQuery(notificationsMetricsQuery());
export const useNotificationTemplates = () => useQuery(notificationTemplatesQuery());
export const useNotificationRules = () => useQuery(notificationRulesQuery());
export const useNotificationPreferences = () => useQuery(notificationPreferencesQuery());
export const useNotificationDeliveries = () => useQuery(notificationDeliveriesQuery());
export const useNotificationAudit = () => useQuery(notificationAuditQuery());

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const fn = useServerFn(notificationsMarkRead);
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationsQueryKeys.list() });
      qc.invalidateQueries({ queryKey: notificationsQueryKeys.metrics() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const fn = useServerFn(notificationsMarkAllRead);
  return useMutation({
    mutationFn: () => fn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationsQueryKeys.list() });
      qc.invalidateQueries({ queryKey: notificationsQueryKeys.metrics() });
    },
  });
}

export function useArchiveNotification() {
  const qc = useQueryClient();
  const fn = useServerFn(notificationsArchive);
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationsQueryKeys.list() });
      qc.invalidateQueries({ queryKey: notificationsQueryKeys.metrics() });
    },
  });
}
