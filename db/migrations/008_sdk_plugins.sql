-- 008_sdk_plugins.sql — SDK, Plugins e Marketplace (Fase 1.13)
-- Multi-tenant com RLS via company_members.

CREATE TABLE IF NOT EXISTS public.plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  author text,
  category text NOT NULL DEFAULT 'generic',
  version text NOT NULL DEFAULT '0.1.0',
  status text NOT NULL DEFAULT 'installed',
  enabled boolean NOT NULL DEFAULT false,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

CREATE TABLE IF NOT EXISTS public.plugin_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  version text NOT NULL,
  changelog text,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  released_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plugin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  scope text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  granted_by uuid,
  granted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plugin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plugin_id, key)
);

CREATE TABLE IF NOT EXISTS public.plugin_storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  namespace text NOT NULL DEFAULT 'default',
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plugin_id, namespace, key)
);

CREATE TABLE IF NOT EXISTS public.plugin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  plugin_id uuid REFERENCES public.plugins(id) ON DELETE SET NULL,
  level text NOT NULL DEFAULT 'info',
  action text NOT NULL,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plugin_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'plugin',
  author text,
  version text NOT NULL DEFAULT '1.0.0',
  price_cents integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  downloads integer NOT NULL DEFAULT 0,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plugin_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id uuid NOT NULL REFERENCES public.plugin_marketplace(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  user_id uuid,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plugin_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id uuid NOT NULL REFERENCES public.plugin_marketplace(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  plugin_id uuid REFERENCES public.plugins(id) ON DELETE SET NULL,
  version text NOT NULL,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plugin_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  from_version text NOT NULL,
  to_version text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_plugins_company ON public.plugins(company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_logs_company ON public.plugin_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugin_updates_status ON public.plugin_updates(company_id, status);
CREATE INDEX IF NOT EXISTS idx_plugin_market_cat ON public.plugin_marketplace(category, featured);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_storage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_logs TO authenticated;
GRANT SELECT ON public.plugin_marketplace TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_downloads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_updates TO authenticated;
GRANT ALL ON public.plugins, public.plugin_versions, public.plugin_permissions,
  public.plugin_settings, public.plugin_storage, public.plugin_logs,
  public.plugin_marketplace, public.plugin_reviews, public.plugin_downloads,
  public.plugin_updates TO service_role;

ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_updates ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'plugins','plugin_versions','plugin_permissions','plugin_settings',
    'plugin_storage','plugin_logs','plugin_reviews','plugin_downloads',
    'plugin_updates'
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

CREATE POLICY "marketplace_read" ON public.plugin_marketplace
  FOR SELECT TO authenticated, anon USING (true);

CREATE OR REPLACE FUNCTION public.touch_plugins_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_plugins_touch ON public.plugins;
CREATE TRIGGER trg_plugins_touch BEFORE UPDATE ON public.plugins
  FOR EACH ROW EXECUTE FUNCTION public.touch_plugins_updated_at();

INSERT INTO public.plugin_marketplace (slug, name, description, category, author, version, featured)
VALUES
  ('planner-cnc-pro','Planner CNC Pro','Otimização avançada de corte CNC para o Planner.','planner','Dioris','1.0.0',true),
  ('crm-whatsapp','CRM WhatsApp','Integração de leads via WhatsApp no CRM.','crm','Dioris','1.0.0',true),
  ('ai-render-boost','AI Render Boost','Aceleração de renderizações via IA.','ai','Dioris','1.0.0',true),
  ('theme-obsidian','Tema Obsidian','Tema escuro premium para toda a plataforma.','theme','Dioris','1.0.0',false),
  ('template-marceneiro','Template Marceneiro','Template completo para marcenarias.','template','Dioris','1.0.0',false)
ON CONFLICT (slug) DO NOTHING;