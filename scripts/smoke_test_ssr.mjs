const mod = await import('../.output/server/index.mjs');
const handler = mod.default ?? mod;
const routes = ['/', '/auth', '/planner-v2'];
for (const route of routes) {
  const response = await handler.fetch(
    new Request(`http://localhost${route}`),
    {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    },
    { waitUntil() {} },
  );
  const body = await response.text();
  console.log(`${route} status=${response.status} bytes=${body.length} html=${body.includes('<!DOCTYPE html>') || body.includes('<!doctype html>')}`);
  if (response.status >= 500 || body.includes('"unhandled":true')) process.exitCode = 1;
}
