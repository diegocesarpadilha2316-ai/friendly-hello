import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Layers,
  Wand2,
  Users,
  Wallet,
  Store,
  Workflow,
  Brain,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
} from "lucide-react";
import diorisLogo from "@/assets/dioris-logo.png";

const productLinks = [
  { to: "/produtos/planner", label: "Planner", icon: Layers, badge: "Em breve", desc: "Projeto 3D + IA + Produção" },
  { to: "/produtos/criador", label: "Criador Universal", icon: Wand2, badge: "Em breve", desc: "Sites, sistemas e apps com IA" },
  { to: "/produtos#crm", label: "CRM", icon: Users, badge: "Em desenvolvimento", desc: "Clientes e pipeline" },
  { to: "/produtos#financeiro", label: "Financeiro", icon: Wallet, badge: "Em desenvolvimento", desc: "Faturamento e fluxo" },
  { to: "/produtos#marketplace", label: "Marketplace", icon: Store, badge: "Em desenvolvimento", desc: "Ecossistema de plugins" },
  { to: "/produtos#automacao", label: "Automação", icon: Workflow, badge: "Em desenvolvimento", desc: "Workflows inteligentes" },
  { to: "/produtos#ia", label: "IA", icon: Brain, badge: "Ativo", desc: "Gateway central multi-modelo" },
];

const primaryNav = [
  { to: "/produtos", label: "Produtos", hasMenu: true },
  { to: "/recursos", label: "Recursos" },
  { to: "/planos", label: "Planos" },
  { to: "/integracoes", label: "Integrações" },
  { to: "/docs", label: "Docs" },
  { to: "/blog", label: "Blog" },
];

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
    setProductsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={diorisLogo} alt="Dioris" className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) =>
            item.hasMenu ? (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => setProductsOpen(true)}
                onMouseLeave={() => setProductsOpen(false)}
              >
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Link>
                <AnimatePresence>
                  {productsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 top-full w-[640px] -translate-x-1/2 pt-3"
                    >
                      <div className="rounded-2xl border border-white/10 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
                        <div className="grid grid-cols-2 gap-2">
                          {productLinks.map((p) => (
                            <Link
                              key={p.to}
                              to={p.to}
                              className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/5"
                            >
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30">
                                <p.icon className="h-5 w-5 text-foreground" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">{p.label}</span>
                                  <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {p.badge}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/auth"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Entrar
          </Link>
          <Link
            to="/auth"
            search={{ redirect: "/workspace" }}
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Começar agora
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground lg:hidden"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 px-4 py-4 sm:px-6">
              {primaryNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-white/5 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
                <Link
                  to="/auth"
                  className="flex-1 rounded-md border border-white/10 px-3 py-2 text-center text-sm font-medium text-foreground"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth"
                  search={{ redirect: "/workspace" }}
                  className="flex-1 rounded-md bg-gradient-to-r from-primary via-secondary to-accent px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
                >
                  Começar agora
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function PublicFooter() {
  const cols = [
    {
      title: "Produtos",
      links: [
        { to: "/produtos/planner", label: "Planner" },
        { to: "/produtos/criador", label: "Criador Universal" },
        { to: "/produtos", label: "CRM" },
        { to: "/produtos", label: "Financeiro" },
        { to: "/produtos", label: "Marketplace" },
        { to: "/produtos", label: "Automação" },
        { to: "/produtos", label: "IA" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { to: "/sobre", label: "Sobre a Dioris" },
        { to: "/blog", label: "Blog" },
        { to: "/contato", label: "Contato" },
        { to: "/status", label: "Status" },
      ],
    },
    {
      title: "Recursos",
      links: [
        { to: "/recursos", label: "Recursos" },
        { to: "/planos", label: "Planos" },
        { to: "/integracoes", label: "Integrações" },
        { to: "/faq", label: "FAQ" },
      ],
    },
    {
      title: "Desenvolvedores",
      links: [
        { to: "/docs", label: "Documentação" },
        { to: "/docs", label: "API" },
        { to: "/docs", label: "SDK" },
        { to: "/status", label: "Status API" },
      ],
    },
    {
      title: "Legal",
      links: [
        { to: "/termos", label: "Termos de uso" },
        { to: "/privacidade", label: "Privacidade" },
        { to: "/privacidade", label: "LGPD" },
        { to: "/reembolso", label: "Reembolso" },
      ],
    },
  ];

  const social = [
    { icon: Github, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Linkedin, href: "#" },
    { icon: Youtube, href: "#" },
    { icon: Instagram, href: "#" },
  ];

  return (
    <footer className="relative mt-24 border-t border-white/10 bg-background/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <img src={diorisLogo} alt="Dioris" className="h-9 w-auto" />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Inteligência que conecta tudo. A Dioris é um ecossistema modular para
              projetar, criar, vender, gerir e automatizar — impulsionado por IA.
            </p>
            <div className="mt-6 flex gap-2">
              {social.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-foreground/70 transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l, i) => (
                  <li key={i}>
                    <Link to={l.to} className="text-sm text-foreground/70 transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dioris. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Inteligência que conecta tudo.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function PublicBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.25_0.15_285_/_0.35),_transparent_60%)]" />
      <div className="absolute -left-40 top-1/3 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="absolute -right-40 top-1/2 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[140px]" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground antialiased">
      <PublicBackground />
      <PublicHeader />
      <main className="pt-16">{children ?? <Outlet />}</main>
      <PublicFooter />
    </div>
  );
}

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
      {children}
    </span>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-foreground/80 backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-accent" />
      {children}
    </div>
  );
}