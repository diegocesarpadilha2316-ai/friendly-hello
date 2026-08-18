from __future__ import annotations

import json
from pathlib import Path

ROOT = Path('/home/ubuntu/dioris-audit-repo/.output/server')
PROJECT_ROOT = Path(__file__).resolve().parents[1]
modules = sorted(p for p in ROOT.rglob('*.mjs') if p.is_file())
env_values = {}
for line in (PROJECT_ROOT / '.env.local').read_text().splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        key, value = line.split('=', 1)
        env_values[key.strip()] = value.strip()
bindings = [
    {'type': 'plain_text', 'name': key, 'text': env_values[key]}
    for key in ('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY')
    if env_values.get(key)
]
parts = [{'name': 'worker.js', 'content': '''export default { fetch: async (request, env, ctx) => {
  const url = new URL(request.url);
  const assetPath = url.pathname;
  if (assetPath.startsWith('/assets/') || assetPath === '/dioris-favicon.png' || assetPath === '/dioris-logo.png' || assetPath.startsWith('/src/assets/')) {
    const     assetResponse = await fetch(`https://raw.githubusercontent.com/diegocesarpadilha2316-ai/friendly-hello/gh-pages${assetPath}?v=20260816-r2`);
    const headers = new Headers(assetResponse.headers);
    if (assetPath.endsWith('.js')) headers.set('content-type', 'application/javascript; charset=utf-8');
    if (assetPath.endsWith('.css')) headers.set('content-type', 'text/css; charset=utf-8');
    return new Response(assetResponse.body, { status: assetResponse.status, headers });
  }
  try {
    const mod = await import('./index.mjs');
    const handler = mod.default || mod;
    return await handler.fetch(request, env, ctx);
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error), stack: error?.stack || null }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
} };'''}]
for path in modules:
    rel = path.relative_to(ROOT).as_posix()
    parts.append({'name': rel, 'content': path.read_text()})
parts_js = json.dumps(parts)
code = f'''async () => {{
  const boundary = `DiorisWorker${{Date.now()}}`;
  const modules = {parts_js};
  const metadata = {{
    main_module: 'worker.js',
    bindings: {json.dumps(bindings)},
    compatibility_date: '2026-08-14',
    compatibility_flags: ['nodejs_compat']
  }};
  const chunks = [
    `--${{boundary}}`,
    'Content-Disposition: form-data; name="metadata"',
    'Content-Type: application/json',
    '',
    JSON.stringify(metadata)
  ];
  for (const mod of modules) {{
    chunks.push(`--${{boundary}}`);
    chunks.push(`Content-Disposition: form-data; name="files"; filename="${{mod.name}}"`);
    chunks.push('Content-Type: application/javascript+module');
    chunks.push('');
    chunks.push(mod.content);
  }}
  chunks.push(`--${{boundary}}--`);
  const body = chunks.join('\\r\\n');
  return cloudflare.request({{
    method: 'PUT',
    path: `/accounts/${{accountId}}/workers/scripts/dioris-planner-v2`,
    body,
    contentType: `multipart/form-data; boundary=${{boundary}}`,
    rawBody: true
  }});
}}'''
Path('/home/ubuntu/cloudflare-worker-full-input.json').write_text(json.dumps({'code': code}))
print(f'modules={len(modules)} input_bytes={Path("/home/ubuntu/cloudflare-worker-full-input.json").stat().st_size}')
