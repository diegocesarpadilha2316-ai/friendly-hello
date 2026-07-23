-- Fase 1.14 — Jobs, Workers e Filas Distribuídas (Dioris Hub)
-- RLS multi-tenant via public.company_members.

CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  concurrency INTEGER NOT NULL DEFAULT 5,
  paused BOOLEAN NOT NULL DEFAULT false,
  rate_limit_per_min INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  queue TEXT NOT NULL DEFAULT 'default',
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 5,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  progress INTEGER NOT NULL DEFAULT 0,
  timeout_ms INTEGER NOT NULL DEFAULT 60000,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  correlation_id TEXT,
  parent_job_id UUID,
  worker_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_company_queue_status ON public.jobs (company_id, queue, status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON public.jobs (scheduled_at);

CREATE TABLE IF NOT EXISTS public.job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id UUID,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_logs_company_created ON public.job_logs (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_history_company_fin ON public.job_history (company_id, finished_at DESC);

CREATE TABLE IF NOT EXISTS public.job_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  queue TEXT NOT NULL DEFAULT 'default',
  bucket TIMESTAMPTZ NOT NULL,
  jobs_completed INTEGER NOT NULL DEFAULT 0,
  jobs_failed INTEGER NOT NULL DEFAULT 0,
  jobs_retried INTEGER NOT NULL DEFAULT 0,
  avg_duration_ms INTEGER NOT NULL DEFAULT 0,
  p95_duration_ms INTEGER NOT NULL DEFAULT 0,
  UNIQUE (company_id, queue, bucket)
);

CREATE TABLE IF NOT EXISTS public.cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cron_expr TEXT NOT NULL,
  kind TEXT NOT NULL,
  queue TEXT NOT NULL DEFAULT 'default',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.job_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  queue TEXT NOT NULL DEFAULT 'default',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  run_at TIMESTAMPTZ NOT NULL,
  dispatched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.worker_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hostname TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  capacity INTEGER NOT NULL DEFAULT 1,
  running_jobs INTEGER NOT NULL DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.distributed_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  owner TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (company_id, key)
);

CREATE TABLE IF NOT EXISTS public.dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL,
  kind TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  next_run_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs, public.job_queue, public.job_logs,
  public.job_history, public.job_metrics, public.cron_jobs, public.job_schedule,
  public.worker_nodes, public.distributed_locks, public.dead_letter_queue,
  public.retry_queue TO authenticated;
GRANT ALL ON public.jobs, public.job_queue, public.job_logs, public.job_history,
  public.job_metrics, public.cron_jobs, public.job_schedule, public.worker_nodes,
  public.distributed_locks, public.dead_letter_queue, public.retry_queue TO service_role;

-- RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributed_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retry_queue ENABLE ROW LEVEL SECURITY;

DO $jobs_workers_policies$
DECLARE
  t TEXT;
  policy_name TEXT;
  tables TEXT[] := ARRAY[
    'jobs','job_queue','job_logs','job_history','job_metrics','cron_jobs',
    'job_schedule','worker_nodes','distributed_locks','dead_letter_queue','retry_queue'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    policy_name := t || '_tenant';

    IF to_regclass('public.' || t) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = t
          AND policyname = policy_name
      )
    THEN
      EXECUTE 'CREATE POLICY ' || quote_ident(policy_name) ||
        ' ON public.' || quote_ident(t) ||
        ' FOR ALL TO authenticated' ||
        ' USING (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = ' || quote_ident(t) || '.company_id AND m.user_id = auth.uid() AND m.active = true))' ||
        ' WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = ' || quote_ident(t) || '.company_id AND m.user_id = auth.uid() AND m.active = true))';
    END IF;
  END LOOP;
END
$jobs_workers_policies$;