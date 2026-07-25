-- =====================================================================
-- Migration 044 — Agendamento automático dos workers (pg_cron + pg_net)
-- ---------------------------------------------------------------------
-- Agenda tick automático dos workers de e-mail e render a cada 1 minuto,
-- chamando os endpoints públicos protegidos por WORKERS_CRON_SECRET.
--
-- Requisitos:
--   * Extensões `pg_cron` e `pg_net` habilitadas no projeto Supabase.
--   * Configurar os GUCs abaixo (uma vez) via `ALTER DATABASE ... SET`:
--       app.workers_base_url = 'https://hello-world-buddy-2446.lovable.app'
--       app.workers_cron_secret = '<mesmo valor de WORKERS_CRON_SECRET>'
--
-- Segurança: o secret nunca trafega no corpo; vai apenas no header.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------------------------------------------------------------------
-- Helper: dispara POST autenticado em endpoint /api/public/v1/workers/*
-- ---------------------------------------------------------------------
create or replace function public.trigger_worker(worker_name text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  base_url text := current_setting('app.workers_base_url', true);
  secret   text := current_setting('app.workers_cron_secret', true);
  req_id   bigint;
begin
  if base_url is null or secret is null then
    raise notice 'workers_cron: GUCs ausentes; pulando %', worker_name;
    return null;
  end if;
  select net.http_post(
    url := base_url || '/api/public/v1/workers/' || worker_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-workers-secret', secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  ) into req_id;
  return req_id;
end;
$$;

revoke all on function public.trigger_worker(text) from public, anon, authenticated;
grant execute on function public.trigger_worker(text) to service_role;

-- ---------------------------------------------------------------------
-- Schedules (idempotentes) — remove antigos antes de reagendar
-- ---------------------------------------------------------------------
do $$
declare
  j record;
begin
  for j in select jobid, jobname from cron.job
           where jobname in ('dioris_worker_email', 'dioris_worker_render')
  loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

select cron.schedule(
  'dioris_worker_email',
  '* * * * *',
  $$select public.trigger_worker('email');$$
);

select cron.schedule(
  'dioris_worker_render',
  '* * * * *',
  $$select public.trigger_worker('render');$$
);

-- ---------------------------------------------------------------------
-- Consulta rápida de status (últimas execuções)
-- ---------------------------------------------------------------------
comment on function public.trigger_worker(text) is
  'Dispara worker público autenticado. Use via pg_cron. Ver cron.job_run_details.';