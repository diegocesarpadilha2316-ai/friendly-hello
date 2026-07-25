# Operação — Agendamento de Workers (Cron)

Este guia liga o `pg_cron` do Supabase externo aos endpoints públicos
`/api/public/v1/workers/email` e `/api/public/v1/workers/render`, para
que a fila de e-mails e a fila de renders sejam processadas a cada 1
minuto sem intervenção humana.

## 1. Habilitar extensões

No painel Supabase → Database → Extensions, habilite:

- `pg_cron`
- `pg_net`

## 2. Configurar GUCs (uma vez)

No SQL Editor, rodar (substituindo `<SECRET>` pelo valor de
`WORKERS_CRON_SECRET` armazenado nas Secrets do projeto):

```sql
alter database postgres set app.workers_base_url =
  'https://hello-world-buddy-2446.lovable.app';
alter database postgres set app.workers_cron_secret = '<SECRET>';
```

Reconecte a sessão para o novo `current_setting` ficar disponível.

## 3. Aplicar a migration

Rodar `db/migrations/044_workers_cron.sql` no SQL Editor. Ela:

- cria a função `public.trigger_worker(text)` (SECURITY DEFINER, só
  `service_role` pode executar);
- agenda `dioris_worker_email` e `dioris_worker_render` a cada minuto;
- é idempotente — pode ser rodada múltiplas vezes.

## 4. Verificação

```sql
-- Ver jobs ativos
select jobname, schedule, active from cron.job
 where jobname like 'dioris_worker_%';

-- Últimas execuções (200)
select jobid, status, return_message, start_time
  from cron.job_run_details
 order by start_time desc
 limit 20;
```

Após 1–2 minutos, `notification_deliveries` e `render_jobs` devem
começar a ser processados automaticamente.

## 5. Desativar temporariamente

```sql
update cron.job set active = false
 where jobname in ('dioris_worker_email', 'dioris_worker_render');
```