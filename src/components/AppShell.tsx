import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Boxes, ClipboardList, CreditCard, LayoutDashboard, Plug, Settings, ShoppingCart, Store, Users } from "lucide-react";

const nav = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/produtos", label: "Produtos", icon: Boxes },
  { to: "/estoque", label: "Estoque", icon: ClipboardList },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/canais", label: "Canais de venda", icon: Store },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <div className="min-h-screen bg-background text-foreground md:flex">
    <aside className="w-full border-b border-border bg-card md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3 px-5 py-5"><div className="dioris-gradient grid h-10 w-10 place-items-center rounded-xl text-lg font-black text-white">D</div><div><p className="font-bold tracking-tight">Dioris ERP</p><p className="text-[11px] text-muted-foreground">Operação multicanal</p></div></div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3"><p className="hidden px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:block">Operação</p>{nav.map(({ to, label, icon: Icon }) => { const active = location.pathname === to; return <Link key={to} to={to} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary/15 font-semibold text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon className="h-4 w-4" />{label}</Link>; })}</nav>
      <nav className="hidden space-y-1 px-3 md:block"><p className="px-3 pb-2 pt-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gestão</p><Link to="/assinatura" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><CreditCard className="h-4 w-4" />Assinatura</Link><Link to="/integracoes" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><Plug className="h-4 w-4" />Integrações</Link><Link to="/configuracoes" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><Settings className="h-4 w-4" />Configurações</Link></nav>
      <div className="mx-5 mt-8 hidden rounded-xl bg-secondary/70 p-4 md:block"><p className="text-xs font-semibold">Plano inicial</p><p className="mt-1 text-xs text-muted-foreground">14 dias de teste grátis</p><Link to="/assinatura" className="mt-3 block text-xs font-semibold text-primary">Ver planos →</Link></div>
    </aside>
    <main className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-border bg-card/80 px-5 py-4 backdrop-blur md:px-8"><div><p className="text-xs text-muted-foreground">Empresa principal</p><p className="font-semibold">Minha operação</p></div><div className="flex items-center gap-3"><div className="hidden rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground sm:block">⌘ K &nbsp; Buscar</div><div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">DC</div></div></header><div className="p-5 md:p-8">{children}</div></main>
  </div>;
}

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>{children}</div>;
