-- 043 — Payment Orders (tenant-scoped) — Mercado Pago + demais provedores
-- Registra intenções de pagamento (Pix, boleto, cartão) e o status.
-- Créditos só são lançados no ledger quando um webhook aprovado é processado.

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider         text NOT NULL,                       -- 'mercadopago' | 'stripe' | ...
  method           text NOT NULL CHECK (method IN ('pix','boleto','card','subscription')),
  kind             text NOT NULL CHECK (kind IN ('credits','subscription')),
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','cancelled','expired','refunded')),
  amount_cents     integer NOT NULL CHECK (amount_cents > 0),
  currency         text NOT NULL DEFAULT 'BRL',
  credits          integer NOT NULL DEFAULT 0,
  pack_key         text,
  external_id      text,                                -- ID no provedor (MP payment.id)
  qr_code          text,                                -- Pix copia-e-cola
  qr_code_base64   text,                                -- Imagem do QR (base64)
  ticket_url       text,                                -- Boleto/checkout
  payer_email      text,
  payload          jsonb NOT NULL DEFAULT '{}'::jsonb,
  credited_at      timestamptz,
  expires_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_orders_company_idx ON public.payment_orders(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_orders_provider_ext_idx ON public.payment_orders(provider, external_id);
CREATE INDEX IF NOT EXISTS payment_orders_status_idx ON public.payment_orders(status);

GRANT SELECT, INSERT, UPDATE ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "po_member_select" ON public.payment_orders;
CREATE POLICY "po_member_select" ON public.payment_orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members m
      WHERE m.company_id = payment_orders.company_id
        AND m.user_id = auth.uid()
        AND m.active = true
    )
  );

-- Escrita apenas pelo service_role (server functions / webhooks).
DROP POLICY IF EXISTS "po_service_write" ON public.payment_orders;
CREATE POLICY "po_service_write" ON public.payment_orders
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

-- Catálogo público de pacotes de créditos
CREATE TABLE IF NOT EXISTS public.credit_packs (
  key           text PRIMARY KEY,
  label         text NOT NULL,
  credits       integer NOT NULL CHECK (credits > 0),
  price_cents   integer NOT NULL CHECK (price_cents > 0),
  currency      text NOT NULL DEFAULT 'BRL',
  bonus_pct     integer NOT NULL DEFAULT 0,
  is_public     boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 100,
  created_at    timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_packs TO authenticated, anon;
GRANT ALL ON public.credit_packs TO service_role;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cp_public_read" ON public.credit_packs;
CREATE POLICY "cp_public_read" ON public.credit_packs
  FOR SELECT USING (is_public = true);

INSERT INTO public.credit_packs (key, label, credits, price_cents, bonus_pct, sort_order) VALUES
  ('pack_100',   'Starter — 100 créditos',    100,   4900,  0,  10),
  ('pack_500',   'Pro — 500 créditos',        500,  19900, 10,  20),
  ('pack_2000',  'Studio — 2.000 créditos', 2000,  69900, 20,  30),
  ('pack_10000', 'Scale — 10.000 créditos',10000, 299900, 30,  40)
ON CONFLICT (key) DO NOTHING;