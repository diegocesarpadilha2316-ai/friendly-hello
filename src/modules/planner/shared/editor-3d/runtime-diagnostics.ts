export function plannerDiagnosticsEnabled(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  return (
    (window as unknown as { __DIORIS_DIAGNOSTICS__?: boolean }).__DIORIS_DIAGNOSTICS__ === true
  );
}
