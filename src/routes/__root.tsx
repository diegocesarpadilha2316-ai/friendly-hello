import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "Dioris ERP" }, { name: "description", content: "ERP multicanal para vender, controlar estoque e crescer." }], links: [{ rel: "stylesheet", href: appCss }] }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <div className="grid min-h-screen place-items-center"><div><p className="text-sm text-muted-foreground">Página não encontrada.</p><Link to="/" className="text-primary underline">Voltar para o início</Link></div></div>,
});

function RootShell({ children }: { children: React.ReactNode }) { return <html lang="pt-BR" className="dark"><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }
function RootComponent() { return <><Outlet /></>; }
