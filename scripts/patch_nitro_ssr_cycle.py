from __future__ import annotations

from pathlib import Path

SSR_DIR = Path('.output/server/_ssr')
SERVER_DIR = Path('.output/server')
HELPER = '''var __exportAll = (all, no_symbols) => {
\tlet target = {};
\tfor (var name in all) Object.defineProperty(target, name, { get: all[name], enumerable: true });
\tif (!no_symbols) Object.defineProperty(target, Symbol.toStringTag, { value: "Module" });
\treturn target;
};'''
KNOWN_CYCLE_IMPORT = 'import { n as __exportAll } from "./server-'


def validate_ssr_output() -> None:
    """Fail only when the expected Nitro SSR output is actually missing or malformed."""
    required = [SERVER_DIR / 'index.mjs', SSR_DIR / 'ssr.mjs']
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise SystemExit(f'SSR output missing: {", ".join(missing)}')

    index_source = (SERVER_DIR / 'index.mjs').read_text()
    if 'fetch' not in index_source or 'nitroApp.fetch' not in index_source:
        raise SystemExit('SSR output validation failed: Nitro fetch handler not found')

    ssr_source = (SSR_DIR / 'ssr.mjs').read_text()
    if 'fetch' not in ssr_source:
        raise SystemExit('SSR output validation failed: SSR fetch module is incomplete')



def main() -> None:
    validate_ssr_output()
    patched = 0
    for path in SSR_DIR.glob('*.mjs'):
        source = path.read_text()
        if KNOWN_CYCLE_IMPORT not in source:
            continue
        start = source.find(KNOWN_CYCLE_IMPORT)
        end = source.find(';', start) + 1
        if start < 0 or end <= start:
            raise SystemExit(f'SSR cycle marker found but could not be patched: {path}')
        path.write_text(source[:start] + HELPER + source[end:])
        patched += 1

    print(f'patched_ssr_chunks={patched}')
    if patched == 0:
        print('SSR output already compatible; no patch required.')


if __name__ == '__main__':
    main()
