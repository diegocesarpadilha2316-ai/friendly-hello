-- ============================================================================
-- 019 — Histórico de importações da Biblioteca Dioris (aditivo)
-- ============================================================================
-- Registra cada importação executada por administradores da plataforma:
-- quem importou, quando, qual arquivo, qual tipo (materiais/ferragens), e o
-- relatório resumido (adicionados/atualizados/erros).
-- Nenhuma tabela existente é alterada.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.planner_library_imports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              text NOT NULL CHECK (kind IN ('materials','hardware')),
  filename          text,
  total_rows        integer NOT NULL DEFAULT 0,
  inserted_count    integer NOT NULL DEFAULT 0,
  updated_count     integer NOT NULL DEFAULT 0,
  skipped_count     integer NOT NULL DEFAULT 0,
  error_count       integer NOT NULL DEFAULT 0,
  errors            jsonb  NOT NULL DEFAULT '[]'::jsonb,
  admin_user_id     uuid   NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email       text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lib_imports_created_at
  ON public.planner_library_imports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lib_imports_admin
  ON public.planner_library_imports (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_lib_imports_kind
  ON public.planner_library_imports (kind);

GRANT SELECT ON public.planner_library_imports TO authenticated;
GRANT ALL    ON public.planner_library_imports TO service_role;

ALTER TABLE public.planner_library_imports ENABLE ROW LEVEL SECURITY;

-- Somente administradores da plataforma leem/escrevem o histórico.
DROP POLICY IF EXISTS lib_imports_admin_select ON public.planner_library_imports;
CREATE POLICY lib_imports_admin_select
  ON public.planner_library_imports
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS lib_imports_admin_insert ON public.planner_library_imports;
CREATE POLICY lib_imports_admin_insert
  ON public.planner_library_imports
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS lib_imports_admin_delete ON public.planner_library_imports;
CREATE POLICY lib_imports_admin_delete
  ON public.planner_library_imports
  FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));