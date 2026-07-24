-- =====================================================================
-- 017 — Biblioteca Dioris (Planner): materiais e ferragens oficiais
-- =====================================================================
-- Migração 100% ADITIVA:
--   • Não altera tabelas existentes.
--   • Não remove nenhum dado.
--   • Não interfere em projetos, móveis, orçamentos ou render atuais.
--   • Cria apenas duas tabelas novas + índices + RLS + GRANTs.
-- Fonte: biblioteca massiva Dioris (4.184 chapas + 1.120 ferragens).
-- =====================================================================

-- --------------------------------------------------------------------
-- Tabela: planner_materials (chapas / materiais paramétricos)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_materials (
  id                text PRIMARY KEY,                   -- ex.: DUR-DES-CAR-18
  fabricante        text NOT NULL,                      -- Duratex, Arauco...
  marca             text NOT NULL,                      -- alias do fabricante
  linha             text,                               -- Design, Essencial...
  categoria         text NOT NULL DEFAULT 'chapa',      -- chapa | macico | vidro | ...
  padrao            text,                               -- Carvalho Dian, Branco TX...
  cor_nome          text,
  cor_hex           text,
  textura_url       text,
  espessura_mm      numeric(6,2) NOT NULL,
  largura_mm        numeric(8,2),
  comprimento_mm    numeric(8,2),
  sentido_veio      text CHECK (sentido_veio IN ('vertical','horizontal','livre')),
  preco_m2          numeric(12,2),
  ativo             boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_planner_materials_fabricante ON public.planner_materials (fabricante);
CREATE INDEX IF NOT EXISTS ix_planner_materials_categoria  ON public.planner_materials (categoria);
CREATE INDEX IF NOT EXISTS ix_planner_materials_padrao     ON public.planner_materials (padrao);
CREATE INDEX IF NOT EXISTS ix_planner_materials_espessura  ON public.planner_materials (espessura_mm);
CREATE INDEX IF NOT EXISTS ix_planner_materials_ativo      ON public.planner_materials (ativo);

-- GRANTs obrigatórios (Data API/PostgREST)
GRANT SELECT ON public.planner_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_materials TO authenticated;
GRANT ALL ON public.planner_materials TO service_role;

ALTER TABLE public.planner_materials ENABLE ROW LEVEL SECURITY;

-- Biblioteca oficial: leitura pública (só itens ativos).
DROP POLICY IF EXISTS "planner_materials_read_public" ON public.planner_materials;
CREATE POLICY "planner_materials_read_public"
  ON public.planner_materials
  FOR SELECT
  USING (ativo = true);

-- Escrita restrita ao service_role (seed/admin). Sem policy = nada de write via anon/authenticated.

-- --------------------------------------------------------------------
-- Tabela: planner_hardware (ferragens)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_hardware (
  id                text PRIMARY KEY,                   -- ex.: FER-BLU-DOB-001
  fabricante        text NOT NULL,
  marca             text NOT NULL,
  categoria         text NOT NULL,                      -- Dobradiça, Corrediça, Puxador...
  modelo            text NOT NULL,
  descricao         text,
  imagem_url        text,
  preco_unitario    numeric(12,2),
  parametros_cnc    jsonb NOT NULL DEFAULT '{}'::jsonb, -- payload completo do CNC
  furacao           numeric(6,2),                       -- diâmetro do furo (mm)
  profundidade      numeric(6,2),                       -- profundidade (mm)
  folga             numeric(6,2),                       -- folga lateral (mm)
  ativo             boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_planner_hardware_fabricante ON public.planner_hardware (fabricante);
CREATE INDEX IF NOT EXISTS ix_planner_hardware_categoria  ON public.planner_hardware (categoria);
CREATE INDEX IF NOT EXISTS ix_planner_hardware_modelo     ON public.planner_hardware (modelo);
CREATE INDEX IF NOT EXISTS ix_planner_hardware_ativo      ON public.planner_hardware (ativo);
CREATE INDEX IF NOT EXISTS ix_planner_hardware_cnc_gin    ON public.planner_hardware USING GIN (parametros_cnc);

GRANT SELECT ON public.planner_hardware TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_hardware TO authenticated;
GRANT ALL ON public.planner_hardware TO service_role;

ALTER TABLE public.planner_hardware ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planner_hardware_read_public" ON public.planner_hardware;
CREATE POLICY "planner_hardware_read_public"
  ON public.planner_hardware
  FOR SELECT
  USING (ativo = true);

-- =====================================================================
-- Compatibilidade:
--   • Tabelas 001–016 permanecem intactas.
--   • IDs semente antigos (mat-mdf-15-branco, blum-clip-top, etc.) continuam
--     válidos no código como fallback — as novas tabelas coexistem.
--   • Nenhuma FK aponta para essas tabelas nesta migração (aditivo puro).
-- =====================================================================