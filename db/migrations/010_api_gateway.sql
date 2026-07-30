-- Fase 1.15 — API Gateway Enterprise (Dioris Hub)

-- ---------------------------------------------------------------------------
-- api_keys: a tabela é criada UMA ÚNICA VEZ na migration 006
-- (006_global_configuration.sql), que já adota o formato canônico de produção.
--
-- Compatibilidade histórica: esta migration criava a mesma tabela com um
-- CREATE TABLE IF NOT EXISTS divergente (`key_hash`/`status`/`allowed_ips`
-- contra `hashed_key`/`revoked_at` da 006). Em banco novo vencia a 006; em
-- produção vigorava o formato desta. Para eliminar a definição dupla sem
-- destruir nada, o bloco virou apenas ALTER TABLE ... ADD COLUMN IF NOT EXISTS:
-- é idempotente, funciona em banco novo e em banco onde a tabela já existe,
-- não recria a tabela, não faz DROP e não altera dados nem chaves existentes.
-- ---------------------------------------------------------------------------
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS allowed_ips TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- UNIQUE (prefix): criado como índice único idempotente. Em produção a
-- constraint já existe (nome gerado pelo Postgres), então o índice abaixo é
-- redundante mas inofensivo; em banco novo a 006 já o garante.
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_prefix_unique ON public.api_keys (prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_company ON public.api_keys (company_id);

CREATE TABLE IF NOT EXISTS public.api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT 'v1',
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  module TEXT NOT NULL,
  summary TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  request_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  deprecated BOOLEAN NOT NULL DEFAULT false,
  public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (version, method, path)
);

CREATE TABLE IF NOT EXISTS public.api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  api_key_id UUID,
  user_id UUID,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1',
  status INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  ip TEXT,
  user_agent TEXT,
  request_id TEXT,
  correlation_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_requests_company_created ON public.api_requests (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  scope_key TEXT NOT NULL,
  window_seconds INTEGER NOT NULL DEFAULT 60,
  max_requests INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, scope, scope_key)
);

CREATE TABLE IF NOT EXISTS public.api_rate_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (company_id, bucket_key, window_start)
);

CREATE TABLE IF NOT EXISTS public.api_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  max_requests INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  resets_at TIMESTAMPTZ NOT NULL,
  UNIQUE (company_id, period)
);

CREATE TABLE IF NOT EXISTS public.api_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES public.api_webhook_endpoints(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  status_code INTEGER,
  error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_wh_del_company ON public.api_webhook_deliveries (company_id, created_at DESC);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.api_keys, public.api_endpoints, public.api_requests, public.api_rate_limits,
  public.api_rate_counters, public.api_quotas, public.api_webhook_endpoints,
  public.api_webhook_deliveries TO authenticated;
GRANT ALL ON
  public.api_keys, public.api_endpoints, public.api_requests, public.api_rate_limits,
  public.api_rate_counters, public.api_quotas, public.api_webhook_endpoints,
  public.api_webhook_deliveries TO service_role;

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'api_keys','api_requests','api_rate_limits','api_rate_counters','api_quotas',
    'api_webhook_endpoints','api_webhook_deliveries'
  ]
  LOOP
    EXECUTE format($p$
      CREATE POLICY %I ON public.%I FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.company_members m
        WHERE m.company_id = %I.company_id AND m.user_id = auth.uid() AND m.status = 'active'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.company_members m
        WHERE m.company_id = %I.company_id AND m.user_id = auth.uid() AND m.status = 'active'));
    $p$, t || '_tenant', t, t, t);
  END LOOP;
END $$;

-- api_endpoints: catálogo global (company_id NULL) legível a autenticados;
-- entradas por tenant seguem RLS padrão.
CREATE POLICY api_endpoints_read ON public.api_endpoints FOR SELECT TO authenticated
  USING (
    company_id IS NULL OR EXISTS (
      SELECT 1 FROM public.company_members m
      WHERE m.company_id = api_endpoints.company_id AND m.user_id = auth.uid() AND m.status = 'active'
    )
  );
CREATE POLICY api_endpoints_write ON public.api_endpoints FOR ALL TO authenticated
  USING (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.company_members m
      WHERE m.company_id = api_endpoints.company_id AND m.user_id = auth.uid() AND m.status = 'active'
    )
  )
  WITH CHECK (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.company_members m
      WHERE m.company_id = api_endpoints.company_id AND m.user_id = auth.uid() AND m.status = 'active'
    )
  );