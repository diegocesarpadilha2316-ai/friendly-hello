import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  securityCreateIncident,
  securityDeleteMfa,
  securityEnrollMfa,
  securityGlobalLogout,
  securityRevokeSession,
  securitySetDeviceTrust,
  securityToggleMfa,
  securityUpdateIncident,
  securityUpdatePolicy,
} from "./security.functions";
import { securityKeys, securitySnapshotQuery } from "./queries";
import type {
  IncidentSeverity,
  IncidentStatus,
  MfaMethod,
  SecurityPolicy,
} from "./types";

export function useSecuritySnapshot() {
  return useSuspenseQuery(securitySnapshotQuery());
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: securityKeys.all });
}

export type PolicyInput = Omit<SecurityPolicy, "id" | "updatedAt">;

export function useUpdatePolicy() {
  const fn = useServerFn(securityUpdatePolicy);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: PolicyInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useRevokeSession() {
  const fn = useServerFn(securityRevokeSession);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { sessionId: string; reason?: string }) =>
      fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useGlobalLogout() {
  const fn = useServerFn(securityGlobalLogout);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { userId?: string }) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useSetDeviceTrust() {
  const fn = useServerFn(securitySetDeviceTrust);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { deviceId: string; trusted: boolean }) =>
      fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useEnrollMfa() {
  const fn = useServerFn(securityEnrollMfa);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { method: MfaMethod; label?: string }) =>
      fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useToggleMfa() {
  const fn = useServerFn(securityToggleMfa);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { id: string; enabled: boolean }) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteMfa() {
  const fn = useServerFn(securityDeleteMfa);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export function useCreateIncident() {
  const fn = useServerFn(securityCreateIncident);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: {
      severity: IncidentSeverity;
      category: string;
      title: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateIncident() {
  const fn = useServerFn(securityUpdateIncident);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { id: string; status: IncidentStatus }) =>
      fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}