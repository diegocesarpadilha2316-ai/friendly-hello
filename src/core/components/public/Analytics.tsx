import { useEffect, useState } from "react";

/**
 * Analytics público opt-in — carrega Plausible somente quando o usuário
 * aceitou cookies analíticos via CookieConsent (LGPD).
 *
 * Configuração: defina VITE_PLAUSIBLE_DOMAIN no ambiente (ex.: "dioris.app").
 * Sem essa variável, o componente não injeta nada — comportamento privacy-first.
 */
const STORAGE_KEY = "dioris.cookie-consent.v1";
const SCRIPT_ID = "plausible-analytics";

function readChoice(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { choice?: string };
    return parsed.choice ?? null;
  } catch {
    return null;
  }
}

export function Analytics() {
  const [choice, setChoice] = useState<string | null>(null);
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;

  useEffect(() => {
    setChoice(readChoice());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setChoice(readChoice());
    };
    window.addEventListener("storage", onStorage);
    const interval = window.setInterval(() => setChoice(readChoice()), 2000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!domain || choice !== "accepted") return;
    if (document.getElementById(SCRIPT_ID)) return;
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.defer = true;
    s.src = "https://plausible.io/js/script.js";
    s.setAttribute("data-domain", domain);
    document.head.appendChild(s);
  }, [choice, domain]);

  return null;
}
