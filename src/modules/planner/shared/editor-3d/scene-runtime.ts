export interface SceneRuntimeEvidence {
  readonly itemId: string;
  readonly renderer: string;
  readonly pieces: number;
  readonly visible: boolean;
  readonly framed: boolean;
  readonly withinBounds: boolean;
  readonly scaleValid: boolean;
  readonly aboveFloor: boolean;
  readonly notBehindCamera: boolean;
  readonly recordedAt: number;
  readonly error?: string;
}

const evidence = new Map<string, SceneRuntimeEvidence>();
const listeners = new Set<() => void>();

export function reportSceneRuntime(next: SceneRuntimeEvidence): void {
  const current = evidence.get(next.itemId);
  if (
    current?.renderer === next.renderer &&
    current.pieces === next.pieces &&
    current.visible === next.visible &&
    current.framed === next.framed &&
    current.withinBounds === next.withinBounds &&
    current.scaleValid === next.scaleValid &&
    current.aboveFloor === next.aboveFloor &&
    current.notBehindCamera === next.notBehindCamera
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
    rows.every((row) => 
      Boolean(row?.visible && 
              row.pieces > 0 && 
              row.withinBounds && 
              row.scaleValid && 
              row.aboveFloor && 
              row.notBehindCamera &&
              row.framed)
    );
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
      const failures = itemIds.map(id => ({ id, evidence: sceneRuntimeEvidence(id) }))
        .filter(f => !f.evidence || !valid([f.evidence]));
      
      const reasons = failures.map(f => {
        if (!f.evidence) return `${f.id}: não encontrado na cena`;
        const e = f.evidence;
        if (e.pieces <= 0) return `${f.id}: sem peças geradas`;
        if (!e.visible) return `${f.id}: invisible = true ou fora da cena`;
        if (!e.scaleValid) return `${f.id}: escala zero ou inválida`;
        if (!e.withinBounds) return `${f.id}: fora dos limites do ambiente`;
        if (!e.aboveFloor) return `${f.id}: abaixo do nível do piso`;
        if (e.notBehindCamera === false) return `${f.id}: posicionado atrás da câmera`;
        if (!e.framed) return `${f.id}: fora do campo de visão (frustum)`;
        return `${f.id}: falha de validação visual desconhecida`;
      });

      resolve({
        ok: false,
        reason: `O móvel foi salvo, mas a validação visual falhou: ${reasons.join("; ")}.`,
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