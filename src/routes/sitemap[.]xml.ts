import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

const routes = [
  { path: "/", priority: "1.0", changefreq: "weekly" as const },
  { path: "/sobre", priority: "0.8" },
  { path: "/produtos", priority: "0.9" },
  { path: "/produtos/planner", priority: "0.9" },
  { path: "/produtos/criador", priority: "0.9" },
  { path: "/planos", priority: "0.9" },
  { path: "/recursos", priority: "0.8" },
  { path: "/integracoes", priority: "0.7" },
  { path: "/docs", priority: "0.7" },
  { path: "/blog", priority: "0.7" },
  { path: "/faq", priority: "0.6" },
  { path: "/contato", priority: "0.6" },
  { path: "/status", priority: "0.5" },
  { path: "/termos", priority: "0.3" },
  { path: "/privacidade", priority: "0.3" },
  { path: "/cookies", priority: "0.3" },
  { path: "/reembolso", priority: "0.3" },
  { path: "/seguranca", priority: "0.6" },
  { path: "/auth", priority: "0.5" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = routes.map((r) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${r.path}</loc>`,
            r.changefreq ? `    <changefreq>${r.changefreq}</changefreq>` : null,
            `    <priority>${r.priority}</priority>`,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});