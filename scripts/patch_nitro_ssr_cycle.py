from __future__ import annotations

import json
from pathlib import Path

HELPER = '''var __exportAll = (all, no_symbols) => {
\tlet target = {};
\tfor (var name in all) Object.defineProperty(target, name, { get: all[name], enumerable: true });
\tif (!no_symbols) Object.defineProperty(target, Symbol.toStringTag, { value: "Module" });
\treturn target;
};'''
KNOWN_CYCLE_IMPORT = 'import { n as __exportAll } from "./server-'


def discover_ssr_output() -> tuple[str, list[Path]]:
    """Discover the active Nitro output instead of assuming one preset layout."""
    vercel_root = Path('.vercel/output')
    nitro_manifest = vercel_root / 'nitro.json'
    if nitro_manifest.is_file():
        try:
            json.loads(nitro_manifest.read_text())
        except json.JSONDecodeError as exc:
            raise SystemExit(f'Invalid Vercel Nitro manifest: {nitro_manifest}: {exc}') from exc
        chunks = sorted(
            path
            for path in (vercel_root / 'functions').rglob('*.mjs')
            if path.is_file() and '_ssr' in path.parts
        )
        if not chunks:
            raise SystemExit('Vercel Nitro manifest exists but no SSR chunks were found')
        return 'vercel', chunks

    local_root = Path('.output/server')
    if local_root.is_dir():
        chunks = sorted(path for path in local_root.rglob('*.mjs') if path.is_file())
        if not chunks:
            raise SystemExit('Local Nitro server output exists but contains no JavaScript modules')
        return 'local', chunks

    raise SystemExit('No recognized Nitro output found: expected .vercel/output/nitro.json or .output/server')


def validate_output(kind: str, chunks: list[Path]) -> None:
    if kind == 'local':
        server_entry = Path('.output/server/index.mjs')
        if not server_entry.is_file():
            raise SystemExit(f'Local Nitro output missing entrypoint: {server_entry}')
        source = server_entry.read_text()
        if 'fetch' not in source or 'nitroApp.fetch' not in source:
            raise SystemExit('Local Nitro output validation failed: fetch handler not found')
    else:
        manifest = Path('.vercel/output/nitro.json')
        if not manifest.is_file():
            raise SystemExit('Vercel Nitro output validation failed: nitro.json not found')
    if not any('fetch' in path.read_text() for path in chunks):
        raise SystemExit(f'{kind} Nitro output validation failed: no SSR fetch code found')


def main() -> None:
    kind, chunks = discover_ssr_output()
    validate_output(kind, chunks)
    patched = 0
    for path in chunks:
        source = path.read_text()
        if KNOWN_CYCLE_IMPORT not in source:
            continue
        start = source.find(KNOWN_CYCLE_IMPORT)
        end = source.find(';', start) + 1
        if start < 0 or end <= start:
            raise SystemExit(f'SSR cycle marker found but could not be patched: {path}')
        path.write_text(source[:start] + HELPER + source[end:])
        patched += 1

    print(f'ssr_output={kind}')
    print(f'ssr_chunks_discovered={len(chunks)}')
    print(f'patched_ssr_chunks={patched}')
    if patched == 0:
        print('SSR output already compatible; no patch required.')


if __name__ == '__main__':
    main()
