-- ============================================================================
-- Dioris Planner — Etapa 2: Snapshot rolling (autosave) por projeto.
-- Adiciona coluna `snapshot jsonb` na tabela `planner_projects` para
-- persistir o estado completo do editor (última versão sincronizada).
-- Versões nomeadas continuam em `planner_project_versions` (016).
-- Idempotente.
-- ============================================================================

alter table public.planner_projects
  add column if not exists snapshot jsonb;

-- Sanidade: se preenchido, deve ser objeto.
do $$ begin
  alter table public.planner_projects
    add constraint planner_projects_snapshot_object
    check (snapshot is null or jsonb_typeof(snapshot) = 'object');
exception when duplicate_object then null; end $$;

create index if not exists idx_planner_projects_snapshot_notnull
  on public.planner_projects (company_id)
  where snapshot is not null;