import type { ImporterEntity } from "../types";

/** Remove pontos duplicados consecutivos e polilinhas degeneradas. */
export function optimizeEntities(entities: readonly ImporterEntity[]): readonly ImporterEntity[] {
  const out: ImporterEntity[] = [];
  for (const e of entities) {
    const cleaned: (readonly [number, number])[] = [];
    for (const p of e.points) {
      const last = cleaned[cleaned.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) cleaned.push(p);
    }
    if (cleaned.length < 1) continue;
    out.push({ ...e, points: cleaned });
  }
  return out;
}

export function mergeCollinearWalls(
  entities: readonly ImporterEntity[],
  tolerance = 5,
): readonly ImporterEntity[] {
  // Mescla apenas polilinhas contínuas do mesmo layer/wall.
  const walls = entities.filter((e) => e.role === "wall");
  const others = entities.filter((e) => e.role !== "wall");
  const merged: ImporterEntity[] = [];
  for (const w of walls) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.layerId === w.layerId &&
      last.points.length > 0 &&
      w.points.length > 0 &&
      Math.hypot(
        last.points[last.points.length - 1]![0] - w.points[0]![0],
        last.points[last.points.length - 1]![1] - w.points[0]![1],
      ) < tolerance
    ) {
      merged[merged.length - 1] = { ...last, points: [...last.points, ...w.points.slice(1)] };
    } else {
      merged.push(w);
    }
  }
  return [...merged, ...others];
}
