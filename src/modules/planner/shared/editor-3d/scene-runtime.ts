export interface SceneRuntimeEvidence {
  readonly itemId: string;
  readonly renderer: string;
  readonly pieces: number;
  readonly visible: boolean;
  readonly framed: boolean;
  readonly recordedAt: number;
}

const evidence = new Map<string, SceneRuntimeEvidence>();
const listeners = new Set<() => void>();

export function reportSceneRuntime(next: SceneRuntimeEvidence): void {
  const current = evidence.get(next.itemId);
  if (
    current?.renderer === next.renderer &&
    current.pieces === next.pieces &&
    current.visible === next.visible &&
    current.framed === next.framed
  ) return;
  evidence.set(next.itemId, next);
  for (const listener of listeners) listener();
}

export function sceneRuntimeEvidence(itemId: string): SceneRuntimeEvidence | null {
  return evidence.get(itemId) ?? null;
}

export async function waitForSceneRuntime(
  itemIds: readonly string[],
  timeoutMs = 8_000,
): Promise<{ ok: true; evidence: readonly SceneRuntimeEvidence[] } | { ok: false; reason: string }> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "O viewport 3D não está disponível para validar a criação." };
  }
  const read = () => itemIds.map(sceneRuntimeEvidence);
  const valid = (rows: readonly (SceneRuntimeEvidence | null)[]): rows is readonly SceneRuntimeEvidence[] =>
    rows.every((row) => Boolean(row?.visible && row.pieces > 0));
  const current = read();
  if (valid(current)) return { ok: true, evidence: current };

  return new Promise((resolve) => {
    const finish = () => {
      const rows = read();
      if (!valid(rows)) return false;
      cleanup();
      resolve({ ok: true, evidence: rows });
      return true;
    };
    const listener = () => void finish();
    const timer = window.setTimeout(() => {
      cleanup();
      const missing = itemIds.filter((id) => {
        const row = sceneRuntimeEvidence(id);
        return !row?.visible || row.pieces <= 0;
      });
      resolve({
        ok: false,
        reason: `O móvel foi salvo, mas o viewport não confirmou visibilidade: ${missing.join(", ")}.`,
      });
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timer);
      listeners.delete(listener);
    };
    listeners.add(listener);
    finish();
  });
}