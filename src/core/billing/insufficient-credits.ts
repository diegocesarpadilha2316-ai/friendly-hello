/**
 * Utilitário client-side para reconhecer o erro 402 "insufficient_credits"
 * lançado por `debitCreditsOrThrow` e transformar em CTA amigável.
 */
export interface InsufficientCreditsPayload {
  code: "insufficient_credits";
  balance: number;
  need: number;
}

export function parseInsufficientCredits(err: unknown): InsufficientCreditsPayload | null {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!msg || !msg.includes("insufficient_credits")) return null;
  try {
    const start = msg.indexOf("{");
    const end = msg.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(msg.slice(start, end + 1));
    if (parsed && parsed.code === "insufficient_credits") {
      return {
        code: "insufficient_credits",
        balance: Number(parsed.balance ?? 0),
        need: Number(parsed.need ?? 0),
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}
