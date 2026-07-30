/**
 * Etapa 12 — Assinatura do projeto: detecta orçamento desatualizado.
 *
 * Hash estável e barato sobre o que altera quantidade/custo (móveis,
 * dimensões, materiais e cômodos). Alterou o projeto ⇒ assinatura muda ⇒
 * o orçamento salvo é marcado como "desatualizado" (nunca recalcula sozinho).
 */
import type { PlannerProject } from "@/modules/planner/shared";

function hash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function projectSignature(project: PlannerProject): string {
  const parts: string[] = [project.id];
  for (const env of project.environments ?? []) {
    for (const room of env.rooms ?? []) {
      const d = room.dimensions;
      parts.push(`r:${room.id}:${d.width}x${d.depth}x${d.height}`);
      for (const nodeId of room.nodeOrder ?? []) {
        const node = room.nodes[nodeId];
        if (!node) continue;
        const p = node.params ?? {};
        const keys = Object.keys(p).sort();
        parts.push(
          `n:${node.id}:${node.kind}:${keys.map((k) => `${k}=${String(p[k])}`).join(",")}`,
        );
      }
    }
  }
  return hash(parts.join("|"));
}