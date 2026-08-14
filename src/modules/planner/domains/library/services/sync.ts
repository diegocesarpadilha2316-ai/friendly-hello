import type { LibraryHardware, LibraryMaterial } from "../types";

export interface LibrarySyncEnvelope {
  readonly source: "supabase" | "marketplace" | "erp" | "manual";
  readonly generatedAt: string;
  readonly materials: readonly LibraryMaterial[];
  readonly hardware: readonly LibraryHardware[];
  readonly checksum: string;
}
function hashOf(mat: readonly LibraryMaterial[], hw: readonly LibraryHardware[]): string {
  let h = 0;
  const push = (s: string) => {
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  };
  for (const m of mat) push(`${m.id}:${m.pricePerM2 ?? 0}`);
  for (const x of hw) push(`${x.id}:${x.unitPrice ?? 0}`);
  return `lib-${(h >>> 0).toString(16)}`;
}
export function buildEnvelope(
  source: LibrarySyncEnvelope["source"],
  materials: readonly LibraryMaterial[],
  hardware: readonly LibraryHardware[],
): LibrarySyncEnvelope {
  return {
    source,
    generatedAt: new Date().toISOString(),
    materials,
    hardware,
    checksum: hashOf(materials, hardware),
  };
}
export function verifyEnvelope(env: LibrarySyncEnvelope): boolean {
  return env.checksum === hashOf(env.materials, env.hardware);
}
