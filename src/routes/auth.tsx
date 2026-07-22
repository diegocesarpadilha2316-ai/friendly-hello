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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={diorisLogo}
            alt={`${app.name} — Inteligência que conecta tudo`}
            className="h-14 w-auto"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Inteligência que conecta tudo
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Plataforma modular · acesso restrito
          </p>
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
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}