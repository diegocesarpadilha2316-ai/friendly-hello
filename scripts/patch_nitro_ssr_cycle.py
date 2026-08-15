from pathlib import Path

SSR_DIR = Path('.output/server/_ssr')
HELPER = '''var __exportAll = (all, no_symbols) => {
\tlet target = {};
\tfor (var name in all) Object.defineProperty(target, name, { get: all[name], enumerable: true });
\tif (!no_symbols) Object.defineProperty(target, Symbol.toStringTag, { value: "Module" });
\treturn target;
};'''

patched = 0
for path in SSR_DIR.glob('*.mjs'):
    source = path.read_text()
    if 'import { n as __exportAll } from "./server-' not in source:
        continue
    start = source.find('import { n as __exportAll } from "./server-')
    end = source.find(';', start) + 1
    if start < 0 or end <= start:
        continue
    path.write_text(source[:start] + HELPER + source[end:])
    patched += 1
print(f'patched_ssr_chunks={patched}')
if patched == 0:
    raise SystemExit('No SSR export cycle found to patch')
