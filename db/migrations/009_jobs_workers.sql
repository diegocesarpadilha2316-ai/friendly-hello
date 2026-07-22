-- 009_jobs_workers.sql — Jobs, Filas, Workers e Cron (Fase 1.14)
-- Motor único de execução assíncrona da plataforma. Multi-tenant + RLS.

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  queue text NOT NULL DEFAULT 'default',
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  priority integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  progress integer NOT NULL DEFAULT 0,
  timeout_ms integer NOT NULL DEFAULT 60000,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  correlation_id text,
  parent_job_id uuid,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  heartbeat_at timestamptz,
  worker_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  concurrency integer NOT NULL DEFAULT 5,
  paused boolean NOT NULL DEFAULT false,
  rate_limit_per_min integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.job_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  kind text NOT NULL,
  queue text NOT NULL DEFAULT 'default',
  scheduled_at timestamptz NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cron_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  cron_expr text NOT NULL,
  kind text NOT NULL,
  queue text NOT NULL DEFAULT 'default',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  job_id uuid NOT NULL,
  kind text NOT NULL,
  status text NOT NULL,
  duration_ms integer,
  attempts integer NOT NULL DEFAULT 0,
  error text,
  finished_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  queue text NOT NULL DEFAULT 'default',
  bucket timestamptz NOT NULL,
  jobs_completed integer NOT NULL DEFAULT 0,
  jobs_failed integer NOT NULL DEFAULT 0,
  jobs_retried integer NOT NULL DEFAULT 0,
  avg_duration_ms integer NOT NULL DEFAULT 0,
  p95_duration_ms integer NOT NULL DEFAULT 0,
  UNIQUE (company_id, queue, bucket)
);

CREATE TABLE IF NOT EXISTS public.worker_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  hostname text,
  region text,
  status text NOT NULL DEFAULT 'idle',
  capacity integer NOT NULL DEFAULT 1,
  running_jobs integer NOT NULL DEFAULT 0,
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.distributed_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  key text NOT NULL,
  owner text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE (company_id, key)
);

CREATE TABLE IF NOT EXISTS public.dead_letter_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  job_id uuid NOT NULL,
  kind text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  moved_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  job_id uuid NOT NULL,
  attempt integer NOT NULL,
  next_run_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(company_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_queue ON public.jobs(company_id, queue, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_kind ON public.jobs(company_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_logs_job ON public.job_logs(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_history_company ON public.job_history(company_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_metrics_bucket ON public.job_metrics(company_id, queue, bucket DESC);
CREATE INDEX IF NOT EXISTS idx_worker_heartbeat ON public.worker_nodes(company_id, last_heartbeat_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_next ON public.cron_jobs(company_id, active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_dlq_moved ON public.dead_letter_queue(company_id, moved_at DESC);
CREATE INDEX IF NOT EXISTS idx_retry_next ON public.retry_queue(company_id, next_run_at);
CREATE INDEX IF NOT EXISTS idx_locks_expires ON public.distributed_locks(company_id, expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_schedule TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cron_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_nodes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.distributed_locks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dead_letter_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retry_queue TO authenticated;
GRANT ALL ON public.jobs, public.job_queue, public.job_schedule, public.cron_jobs,
  public.job_logs, public.job_history, public.job_metrics, public.worker_nodes,
  public.distributed_locks, public.dead_letter_queue, public.retry_queue TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributed_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retry_queue ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'jobs','job_queue','job_schedule','cron_jobs','job_logs','job_history',
    'job_metrics','worker_nodes','distributed_locks','dead_letter_queue','retry_queue'
  ]) LOOP
    EXECUTE format($f$
      CREATE POLICY "tenant_rw_%1$s" ON public.%1$I
      FOR ALL TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.company_members m
        WHERE m.company_id = %1$I.company_id
          AND m.user_id = auth.uid() AND m.active = true))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.company_members m
        WHERE m.company_id = %1$I.company_id
          AND m.user_id = auth.uid() AND m.active = true));
    $f$, t);
  END LOOP;
END $$;