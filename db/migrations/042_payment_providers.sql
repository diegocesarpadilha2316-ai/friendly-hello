-- 042 — Payment Providers (platform-wide config, admin-only)
-- Cada linha representa um provedor de pagamento suportado pela plataforma.
-- Chaves reais (secrets) NÃO ficam aqui — apenas metadata, public keys e status.

CREATE TABLE IF NOT EXISTS public.payment_providers (
  code              text PRIMARY KEY,
  name              text NOT NULL,
  region            text NOT NULL,
  enabled           boolean NOT NULL DEFAULT false,
  mode              text NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox','live')),
  public_key        text,
  webhook_url       text,
  secret_env_names  text[] NOT NULL DEFAULT '{}',
  methods           text[] NOT NULL DEFAULT '{}',
  status            text NOT NULL DEFAULT 'not_configured'
                    CHECK (status IN ('not_configured','test','live','error','disabled')),
  notes             text,
  sort_order        int NOT NULL DEFAULT 100,
  updated_by        uuid,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_providers TO authenticated;
GRANT ALL ON public.payment_providers TO service_role;

ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_admin_select" ON public.payment_providers;
CREATE POLICY "pp_admin_select" ON public.payment_providers
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "pp_admin_write" ON public.payment_providers;
CREATE POLICY "pp_admin_write" ON public.payment_providers
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Seed inicial: provedores suportados
INSERT INTO public.payment_providers (code, name, region, methods, secret_env_names, sort_order) VALUES
  ('mercadopago', 'Mercado Pago',       'BR',     ARRAY['pix','boleto','card','subscription'], ARRAY['MP_ACCESS_TOKEN','MP_PUBLIC_KEY','MP_WEBHOOK_SECRET'], 10),
  ('asaas',       'Asaas',              'BR',     ARRAY['pix','boleto','card','subscription'], ARRAY['ASAAS_API_KEY'], 20),
  ('efi',         'Efí (Gerencianet)',  'BR',     ARRAY['pix','boleto','card'],                ARRAY['EFI_CLIENT_ID','EFI_CLIENT_SECRET'], 30),
  ('pagarme',     'Pagar.me',           'BR',     ARRAY['pix','boleto','card','subscription'], ARRAY['PAGARME_API_KEY'], 40),
  ('pagseguro',   'PagSeguro',          'BR',     ARRAY['pix','boleto','card'],                ARRAY['PAGSEGURO_TOKEN'], 50),
  ('cielo',       'Cielo',              'BR',     ARRAY['card'],                               ARRAY['CIELO_MERCHANT_ID','CIELO_MERCHANT_KEY'], 60),
  ('stripe',      'Stripe',             'Global', ARRAY['card','subscription'],                ARRAY['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'], 70),
  ('paddle',      'Paddle',             'Global', ARRAY['card','subscription'],                ARRAY['PADDLE_API_KEY','PADDLE_WEBHOOK_SECRET'], 80)
ON CONFLICT (code) DO NOTHING;