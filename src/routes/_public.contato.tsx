import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquare, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Dioris" },
      { name: "description", content: "Fale com o time da Dioris por email, WhatsApp ou formulário." },
      { property: "og:title", content: "Contato Dioris" },
      { property: "og:description", content: "Fale conosco." },
      { property: "og:url", content: "/contato" },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
  }),
  component: Page,
});

function Page() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Mensagem enviada! Retornaremos em até 1 dia útil.");
    setForm({ name: "", email: "", company: "", message: "" });
  };
  const fields: { key: keyof typeof form; label: string; type?: string }[] = [
    { key: "name", label: "Nome" },
    { key: "email", label: "Email", type: "email" },
    { key: "company", label: "Empresa" },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal>
          <SectionEyebrow>Contato</SectionEyebrow>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            Vamos <GradientText>conversar</GradientText>.
          </h1>
          <p className="mt-6 text-lg text-foreground/70">Estamos aqui para responder, demonstrar e apoiar sua adoção.</p>
          <div className="mt-10 space-y-4">
            {[
              { icon: Mail, t: "Email", v: "contato@dioris.com" },
              { icon: MessageSquare, t: "WhatsApp", v: "+55 (11) 99999-9999" },
              { icon: MapPin, t: "Escritório", v: "São Paulo · Brasil" },
            ].map((c) => (
              <div key={c.t} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/30">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.t}</div>
                  <div className="mt-0.5 font-semibold">{c.v}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="text-2xl font-bold">Envie uma mensagem</h2>
            <div className="mt-6 space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    required
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Mensagem</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-background/40 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/40">
                Enviar <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </div>
  );
}