# Baseline do banco de produção — Dioris Planner

Este diretório guarda a **fotografia (snapshot) do schema de produção**.

## Arquivo

`db/baseline/20260730113835_remote_schema.sql`

> O arquivo SQL é fornecido separadamente (gerado no GitHub Actions e publicado
> como artifact). Ele **não foi inventado nem reconstruído** aqui. Se ainda não
> estiver presente neste diretório, basta adicioná-lo com exatamente este nome.

## Origem

- Gerado em **30/07/2026**
- Comando: `supabase db pull --schema public`
- Nome original: `20260730113835_remote_schema.sql`

## Regras de uso (obrigatórias)

- Este arquivo representa **apenas uma fotografia do banco de produção**.
- É **documental** — referência para auditoria e comparação de drift.
- **Não é uma migration.**
- **Não deve ser executado** em nenhum ambiente.
- **Não deve ser movido** para `supabase/migrations/` nem para `db/migrations/`.
- **Não deve ser aplicado** por `supabase db push`.

Qualquer correção de schema deve ser feita por uma migration nova, versionada e
revisada — nunca reaplicando este baseline.
