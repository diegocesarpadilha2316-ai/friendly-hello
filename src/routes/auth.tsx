import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/core/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { app } from "@/core/config";
import diorisLogo from "@/assets/dioris-logo.png";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: `Entrar — ${app.name}` },
      { name: "description", content: `Acesse sua conta ${app.name}.` },
      { property: "og:title", content: `Entrar — ${app.name}` },
      { property: "og:description", content: `Acesse sua conta ${app.name}.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading, signInWithPassword, signUp, resetPassword, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: search.redirect ?? "/workspace", replace: true });
    }
  }, [loading, user, navigate, search.redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signin") {
        await signInWithPassword(email, password);
      } else if (tab === "signup") {
        await signUp(email, password, { display_name: name });
        toast.success("Conta criada. Verifique seu e-mail se necessário.");
      } else {
        await resetPassword(email);
        toast.success("Se o e-mail existir, enviamos as instruções.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      {/* Deep space backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.14_0.05_280),_oklch(0.07_0.03_270)_75%)]" />
      </div>

      {/* Floating bokeh orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden">
        <div className="dioris-orb h-[380px] w-[380px] -left-24 top-16 bg-[radial-gradient(circle,_oklch(0.72_0.22_300)_0%,_transparent_65%)]" />
        <div
          className="dioris-orb h-[300px] w-[300px] -right-16 top-28 bg-[radial-gradient(circle,_oklch(0.7_0.2_275)_0%,_transparent_65%)]"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="dioris-orb h-[260px] w-[260px] left-[18%] -bottom-10 bg-[radial-gradient(circle,_oklch(0.72_0.22_290)_0%,_transparent_65%)]"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="dioris-orb h-[340px] w-[340px] right-[10%] -bottom-20 bg-[radial-gradient(circle,_oklch(0.68_0.2_255)_0%,_transparent_65%)]"
          style={{ animationDelay: "6s" }}
        />
        <div
          className="dioris-orb h-24 w-24 left-[8%] top-[42%] bg-[radial-gradient(circle,_oklch(0.75_0.22_295)_0%,_transparent_65%)]"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="dioris-orb h-16 w-16 right-[24%] top-[30%] bg-[radial-gradient(circle,_oklch(0.78_0.2_270)_0%,_transparent_65%)]"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="dioris-orb h-20 w-20 left-[42%] top-[8%] bg-[radial-gradient(circle,_oklch(0.75_0.22_285)_0%,_transparent_65%)]"
          style={{ animationDelay: "5s" }}
        />
        <div
          className="dioris-orb h-14 w-14 right-[38%] bottom-[22%] bg-[radial-gradient(circle,_oklch(0.78_0.2_260)_0%,_transparent_65%)]"
          style={{ animationDelay: "7s" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo + Headline */}
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={diorisLogo}
            alt={`${app.name} — Inteligência que conecta tudo`}
            className="h-24 w-auto drop-shadow-[0_0_60px_rgba(139,92,246,0.55)] sm:h-28"
          />
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Bem-vindo ao Dioris Hub
          </h1>
          <p className="mt-2 text-sm text-foreground/60 sm:text-base">
            Inteligência que conecta tudo
          </p>
        </div>

        {/* Glassmorphic card */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-[1px] -z-10 rounded-[28px] bg-gradient-to-br from-primary/50 via-secondary/30 to-accent/50 opacity-60 blur-xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="mb-4 grid w-full grid-cols-3 bg-white/[0.04]">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar</TabsTrigger>
                <TabsTrigger value="reset">Recuperar</TabsTrigger>
              </TabsList>
              <form onSubmit={onSubmit} className="space-y-3">
                {tab === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="sr-only">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 rounded-xl border-white/10 bg-white/[0.03] px-4 text-base placeholder:text-foreground/40 focus-visible:border-primary/60 focus-visible:ring-primary/30"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="sr-only">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Seu e-mail profissional"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-white/10 bg-white/[0.03] px-4 text-base placeholder:text-foreground/40 focus-visible:border-primary/60 focus-visible:ring-primary/30"
                  />
                </div>
                {tab !== "reset" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="sr-only">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      autoComplete={tab === "signin" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      className="h-12 rounded-xl border-white/10 bg-white/[0.03] px-4 text-base placeholder:text-foreground/40 focus-visible:border-primary/60 focus-visible:ring-primary/30"
                    />
                  </div>
                )}
                <TabsContent value="signin" className="p-0" />
                <TabsContent value="signup" className="p-0" />
                <TabsContent value="reset" className="p-0" />
                <Button
                  type="submit"
                  disabled={busy}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-primary via-secondary to-accent text-base font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_rgba(139,92,246,0.6)] transition hover:brightness-110"
                >
                  {busy
                    ? "Aguarde…"
                    : tab === "signin"
                      ? "Entrar"
                      : tab === "signup"
                        ? "Criar conta"
                        : "Enviar instruções"}
                </Button>
              </form>
            </Tabs>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithOAuth("google");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "OAuth falhou");
                  }
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-foreground/80 transition hover:bg-white/[0.06]"
              >
                Continuar com Google
              </button>
              <p className="text-center text-sm text-foreground/60">
                Novo cliente?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="bg-gradient-to-r from-primary to-accent bg-clip-text font-semibold text-transparent hover:underline"
                >
                  Comece grátis
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-foreground/40 hover:text-foreground/70">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
