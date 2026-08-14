import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "dioris.cookie-consent.v1";

type Choice = "accepted" | "rejected";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) setVisible(true);
    } catch {
      /* SSR/storage bloqueado */
    }
  }, []);

  const decide = (choice: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-live="polite"
          aria-label="Aviso de cookies"
          className="fixed inset-x-3 bottom-3 z-[60] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-background/90 p-4 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30">
                <Cookie className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Cookies e privacidade</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Usamos cookies essenciais para operar a plataforma e cookies analíticos opcionais
                  para melhorar a experiência. Você pode aceitar ou recusar os opcionais. Saiba mais
                  em{" "}
                  <Link
                    to="/cookies"
                    className="text-foreground underline decoration-primary/50 underline-offset-2 hover:decoration-primary"
                  >
                    Política de Cookies
                  </Link>
                  .
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => decide("accepted")}
                    className="inline-flex items-center rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]"
                  >
                    Aceitar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => decide("rejected")}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    Somente essenciais
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => decide("rejected")}
                aria-label="Fechar"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
