-- =====================================================================
-- 018 — Platform Admin (Dioris) + write policies da Biblioteca Dioris
-- =====================================================================
-- Migração 100% ADITIVA:
--   • Cria tabela `platform_admins` (proprietários da plataforma).
--   • Cria função `is_platform_admin(uuid)` (SECURITY DEFINER, sem recursão).
--   • Adiciona policies de INSERT/UPDATE/DELETE em `planner_materials` e
--     `planner_hardware` restritas a platform_admins.
--   • Não altera estruturas existentes. Leitura pública (ativo=true) preservada.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at   timestamptz NOT NULL DEFAULT now(),
  note         text
);

GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL    ON public.platform_admins TO service_role;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Cada usuário pode ler apenas a própria linha (para checar se é admin).
DROP POLICY IF EXISTS "platform_admins_self_read" ON public.platform_admins;
CREATE POLICY "platform_admins_self_read"
  ON public.platform_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Escrita restrita ao service_role (sem policy para authenticated).

-- --------------------------------------------------------------------
-- Função de verificação (SECURITY DEFINER — bypass de RLS)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = _user
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;

-- --------------------------------------------------------------------
-- Bootstrap: promover o admin oficial da plataforma (idempotente).
-- --------------------------------------------------------------------
INSERT INTO public.platform_admins (user_id, note)
SELECT u.id, 'bootstrap: admin oficial Dioris'
FROM auth.users u
WHERE u.email = 'admin@dioris.local'
ON CONFLICT (user_id) DO NOTHING;

-- --------------------------------------------------------------------
-- Policies de escrita — planner_materials
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "planner_materials_admin_insert" ON public.planner_materials;
CREATE POLICY "planner_materials_admin_insert"
  ON public.planner_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "planner_materials_admin_update" ON public.planner_materials;
CREATE POLICY "planner_materials_admin_update"
  ON public.planner_materials
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "planner_materials_admin_delete" ON public.planner_materials;
CREATE POLICY "planner_materials_admin_delete"
  ON public.planner_materials
  FOR DELETE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Admin pode ler mesmo itens inativos.
DROP POLICY IF EXISTS "planner_materials_admin_read_all" ON public.planner_materials;
CREATE POLICY "planner_materials_admin_read_all"
  ON public.planner_materials
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- --------------------------------------------------------------------
-- Policies de escrita — planner_hardware
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "planner_hardware_admin_insert" ON public.planner_hardware;
CREATE POLICY "planner_hardware_admin_insert"
  ON public.planner_hardware
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "planner_hardware_admin_update" ON public.planner_hardware;
CREATE POLICY "planner_hardware_admin_update"
  ON public.planner_hardware
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "planner_hardware_admin_delete" ON public.planner_hardware;
CREATE POLICY "planner_hardware_admin_delete"
  ON public.planner_hardware
  FOR DELETE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "planner_hardware_admin_read_all" ON public.planner_hardware;
CREATE POLICY "planner_hardware_admin_read_all"
  ON public.planner_hardware
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- =====================================================================
-- Resumo do modelo de permissão da Biblioteca Dioris:
--
--   • anon           → SELECT itens ativos (leitura pública).
--   • authenticated  → SELECT itens ativos (uso em projetos).
--   • platform_admin → SELECT/INSERT/UPDATE/DELETE completo.
--   • service_role   → bypass (bootstrap/seed).
--
-- Usuários comuns NÃO podem importar, editar preços, alterar texturas,
-- alterar parâmetros CNC, adicionar fabricantes nem remover itens: sem
-- policy `is_platform_admin`, o PostgREST bloqueia toda mutação por RLS.
-- =====================================================================