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
      navigate({ to: search.redirect ?? "/", replace: true });
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
      {/* Aurora + grid background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.16_0.06_285_/_0.9),_oklch(0.09_0.04_275)_75%)]" />
        <div className="dioris-aurora" />
        <div className="dioris-aurora-2" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 78%)",
          }}
        />
      </div>
      {/* Floating cubes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] hidden sm:block">
        <div
          className="dioris-cube left-[6%] top-[12%] h-28 w-28 lg:h-40 lg:w-40"
          style={{ transform: "rotate(-14deg)" }}
        />
        <div
          className="dioris-cube right-[7%] top-[16%] h-24 w-24 lg:h-36 lg:w-36"
          style={{ transform: "rotate(18deg)", animationDelay: "1.4s" }}
        />
        <div
          className="dioris-cube left-[8%] bottom-[10%] h-24 w-24 lg:h-36 lg:w-36"
          style={{ transform: "rotate(10deg)", animationDelay: "2.2s" }}
        />
        <div
          className="dioris-cube right-[6%] bottom-[12%] h-28 w-28 lg:h-40 lg:w-40"
          style={{ transform: "rotate(-20deg)", animationDelay: "0.7s" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glow behind card */}
        <div className="pointer-events-none absolute -inset-[2px] -z-10 rounded-[28px] bg-gradient-to-br from-primary/60 via-secondary/40 to-accent/60 opacity-70 blur-2xl" />
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
          {/* Top gradient hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          <div className="mb-8 flex flex-col items-center text-center">
            <img
              src={diorisLogo}
              alt={`${app.name} — Inteligência que conecta tudo`}
              className="h-16 w-auto drop-shadow-[0_0_28px_rgba(139,92,246,0.4)]"
            />
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.32em] text-foreground/70">
              Inteligência que conecta tudo
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-accent" />
              Plataforma modular · acesso restrito
            </div>
          </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar</TabsTrigger>
            <TabsTrigger value="reset">Recuperar</TabsTrigger>
          </TabsList>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            {tab === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {tab !== "reset" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            )}
            <TabsContent value="signin" className="p-0" />
            <TabsContent value="signup" className="p-0" />
            <TabsContent value="reset" className="p-0" />
            <Button type="submit" className="w-full" disabled={busy}>
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
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await signInWithOAuth("google");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "OAuth falhou");
              }
            }}
          >
            Continuar com Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Ao continuar você concorda com os termos da plataforma.
          </p>
          <Link to="/" className="text-center text-xs text-primary hover:underline">
            ← Voltar ao início
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}