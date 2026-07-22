-- 007_integrations.sql — Integrations Enterprise (Fase 1.12)
-- Tabelas multi-tenant com RLS baseada em company_members.

CREATE TABLE IF NOT EXISTS public.integrations_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  provider text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'generic',
  auth_type text NOT NULL DEFAULT 'api_key',
  status text NOT NULL DEFAULT 'inactive',
  version text NOT NULL DEFAULT '1.0.0',
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  rate_limit jsonb NOT NULL DEFAULT '{}'::jsonb,
  retry_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, provider)
);

CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations_registry(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  kind text NOT NULL,
  ciphertext text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations_registry(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  scope text,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  integration_id uuid REFERENCES public.integrations_registry(id) ON DELETE SET NULL,
  provider text NOT NULL,
  action text NOT NULL,
  status text NOT NULL,
  duration_ms integer,
  request jsonb NOT NULL DEFAULT '{}'::jsonb,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  integration_id uuid NOT NULL REFERENCES public.integrations_registry(id) ON DELETE CASCADE,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  priority integer NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  integration_id uuid REFERENCES public.integrations_registry(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event text NOT NULL,
  url text NOT NULL,
  secret text,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  integration_id uuid REFERENCES public.integrations_registry(id) ON DELETE SET NULL,
  provider text NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature text,
  verified boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  integration_id uuid NOT NULL REFERENCES public.integrations_registry(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'unknown',
  latency_ms integer,
  last_error text,
  last_sync_at timestamptz,
  last_check_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_int_reg_company ON public.integrations_registry(company_id);
CREATE INDEX IF NOT EXISTS idx_int_logs_company ON public.integration_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_int_sync_status ON public.integration_sync(company_id, status);
CREATE INDEX IF NOT EXISTS idx_int_events_provider ON public.integration_events(company_id, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_int_health_int ON public.integration_health(integration_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_sync TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_webhooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_health TO authenticated;
GRANT ALL ON public.integrations_registry, public.integration_credentials,
  public.integration_tokens, public.integration_logs, public.integration_sync,
  public.integration_webhooks, public.integration_events, public.integration_health TO service_role;

ALTER TABLE public.integrations_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_health ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'integrations_registry','integration_credentials','integration_tokens',
    'integration_logs','integration_sync','integration_webhooks',
    'integration_events','integration_health'
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