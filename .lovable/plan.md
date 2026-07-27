# Módulo 05 — Biblioteca Profissional de Móveis

A base atual já existe (`src/modules/planner/shared/library/*` e domínio `catalog/*`). Vou **estender** esses arquivos — não reescrever — respeitando o ciclo *implementar → integrar → testar → validar* (memória `planner-stability-first`).

## Etapas (na ordem de execução)

### 1. Taxonomia e enriquecimento do catálogo
- Consolidar as **21 categorias solicitadas** (Cozinha, Closet, Dormitório, Banheiro, Lavanderia, Home Office, Sala, Painéis, Ilhas, Torres, Cristaleiras, Nichos, Aéreos, Inferiores, Balcões, Roupeiros, Mesa, Estante, Rack, Criado-mudo) em `catalog.ts`, mantendo compatibilidade retro.
- Introduzir **subcategorias** (`subcategoryId`) — ex: `cozinha › balcao-1p`, `cozinha › torre-quente`.
- Enriquecer cada item com metadados faltantes: `doors`, `drawers`, `shelves`, `weight`, `code`, `manufacturer`, `line`, `finish`, tags de busca semântica.

### 2. Busca inteligente + filtros avançados
- Novo módulo `search-index.ts` (em memória, sem dependências) com:
  - normalização (case/acento/palavras semelhantes via distância de Levenshtein leve),
  - índice invertido carregado on-demand.
- Painel de filtros: categoria · subcategoria · fabricante · linha · material · cor · nº portas · nº gavetas · faixas de largura/altura/profundidade.

### 3. Reformulação visual do `LibraryPanel`
- Layout catálogo: **grid de cards** com miniatura, código, medidas, portas/gavetas, badge de material.
- Abas: **Recentes · Favoritos · Mais utilizados · Todos**, mais navegação por árvore de categorias/subcategorias.
- Carregamento sob demanda (windowing simples por `IntersectionObserver`).

### 4. Drag & Drop + inserção inteligente
- Já existe `insert.ts`; adicionar em `physics.ts`:
  - snap-to-wall automático,
  - detecção de colisão AABB reutilizando o motor do Módulo 04,
  - alinhamento e abertura automática do Inspector (evento `planner:focus-selection`).

### 5. IA restrita à Biblioteca
- Em `src/modules/planner/domains/ia/services/matcher.ts`: enforce **hard-fail** quando não houver item de catálogo — nunca inventar geometria.
- Blueprint da IA passa a receber `catalogCandidates` da nova busca.

### 6. Favoritos/Recentes/Mais utilizados persistentes
- `use-favorites.ts` já persiste favoritos; adicionar contadores de uso e "recentes" com timestamp em `localStorage` por tenant.
- Sincronizado com o painel (aba "Mais utilizados").

## Fora de escopo desta rodada (deferido)
- **Marketplace / importação de terceiros** — memória `no-marketplace-until-launch` proíbe até o lançamento; deixo apenas a *estrutura de import stub* pronta em `catalog/import.ts` (já existe), sem UI.
- Miniaturas fotorrealistas geradas por render — usaremos as thumbnails procedurais 2D existentes.

## Validação (ciclo obrigatório)
Ao final: typecheck limpo, smoke test manual das ações (pesquisar, filtrar, arrastar, duplicar, editar, trocar material, criar via IA, excluir, salvar, reabrir). Corrijo qualquer regressão antes de encerrar o módulo.

## Detalhes técnicos
```text
src/modules/planner/shared/library/
├── catalog.ts              (+ subcategoryId, +metadados)
├── catalog-extended.ts     (+ novos itens por categoria faltante)
├── search-index.ts         (NOVO — índice + fuzzy)
├── filters.ts              (NOVO — schema de filtros e apply())
├── LibraryPanel.tsx        (redesign: grid + filtros + abas)
├── LibraryFilters.tsx      (NOVO — painel de filtros)
├── LibraryCard.tsx         (NOVO — card do item)
├── insert.ts               (snap + colisão + focus Inspector)
├── physics.ts              (snap-to-wall)
└── use-favorites.ts        (+ recentes + contadores)

src/modules/planner/domains/ia/services/
└── matcher.ts              (hard-fail sem catálogo)
```

Todas as mutações continuam passando por `updateProject()` — herdando Undo/Redo, Autosave, Banco, Inspector, Lista de Corte, Orçamento.

Aprovar para eu executar as 6 etapas em sequência (sem parar entre elas).
