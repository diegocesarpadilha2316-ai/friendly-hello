/**
 * Fase 3.10 — Branding / finalização.
 */
import type { VideoBranding } from "../types";

export const DEFAULT_BRANDING: VideoBranding = {
  enabled: true,
  companyName: "Dioris",
  endCardDurationSec: 3,
  position: "bottom-right",
  opacity: 0.75,
};

export function withBranding(patch: Partial<VideoBranding>): VideoBranding {
  return { ...DEFAULT_BRANDING, ...patch };
}

export function buildQrPayload(input: {
  companyName?: string;
  phone?: string;
  instagram?: string;
  website?: string;
}): string {
  const lines: string[] = [];
  if (input.companyName) lines.push(`FN:${input.companyName}`);
  if (input.phone) lines.push(`TEL:${input.phone}`);
  if (input.instagram) lines.push(`X-SOCIALPROFILE;TYPE=instagram:${input.instagram}`);
  if (input.website) lines.push(`URL:${input.website}`);
  return lines.join("\n");
}
