# Correção cirúrgica do deploy SSR

## Script identificado

O script responsável pelas mensagens `patched_ssr_chunks` era `scripts/patch_nitro_ssr_cycle.py`. Ele era executado obrigatoriamente pelo script `build` em `package.json`:

```json
"build": "vite build && python3 scripts/patch_nitro_ssr_cycle.py"
```

A lógica anterior imprimia `patched_ssr_chunks=0` e encerrava com erro por meio de:

```python
if patched == 0:
    raise SystemExit('No SSR export cycle found to patch')
```

Esse comportamento tratava “nenhum ciclo encontrado” como falha, embora zero patches possa significar que o output já está compatível.

## Correção

O arquivo `scripts/patch_nitro_ssr_cycle.py` foi corrigido sem alterar o Planner, Kitchen, render, vídeo, banco ou SSR. Agora ele:

1. valida que o output Nitro esperado existe;
2. valida a presença do handler `fetch` e do módulo SSR;
3. corrige o ciclo conhecido quando o padrão defeituoso existe;
4. retorna exit 0 quando nenhum patch é necessário;
5. retorna exit 1 somente quando o output esperado está ausente, incompleto ou quando um marcador defeituoso foi encontrado mas não pôde ser corrigido.

Quando executado novamente sobre um output já corrigido, o resultado foi:

```text
patched_ssr_chunks=0
SSR output already compatible; no patch required.
SECOND_PATCH_EXIT=0
```

## Por que houve 5 patches localmente e 0 na Vercel

A primeira compilação limpa local gerou cinco chunks SSR com o ciclo conhecido, portanto exibiu `patched_ssr_chunks=5`. Depois da correção, uma segunda execução encontrou o output já compatível e exibiu zero. O log da Vercel também exibiu zero porque o output produzido naquele build não continha o padrão defeituoso. O erro não era “zero patches”; era o script considerar zero como falha.

## Validações

| Verificação | Resultado |
|---|---:|
| PNPM utilizado | `11.20.0` |
| `pnpm install --frozen-lockfile` após limpeza | PASSOU, exit 0 |
| `pnpm exec tsc --noEmit` | PASSOU, exit 0 |
| `pnpm exec vitest run` | 38 arquivos, 533 testes aprovados |
| `pnpm run build` | PASSOU, exit 0 |
| Primeiro build limpo | `patched_ssr_chunks=5` |
| Segunda execução idempotente | `patched_ssr_chunks=0`, exit 0 |
| Smoke SSR `/` | HTTP 200, HTML gerado |
| Smoke SSR `/auth` | HTTP 200, HTML gerado |
| Smoke SSR `/planner-v2` | HTTP 200, HTML gerado |

O smoke test foi implementado em `scripts/smoke_test_ssr.mjs`.

## Commit e Vercel

O próximo commit deve conter apenas a correção do script SSR, o smoke test e este relatório. Depois dele, a Vercel deve ser reavaliada com o novo commit. O deployment anterior não deve ser usado como prova. Se a Vercel continuar retornando 403, isso será um bloqueio de permissão da equipe, separado da correção de build.
