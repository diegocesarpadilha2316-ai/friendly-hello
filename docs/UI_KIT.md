# Dioris Hub — UI Kit (Design System)

Localização: `src/core/components/ui-kit/`

Todos os módulos consomem os componentes a partir do Core:

```ts
import { PageHeader, MetricCard, DataTable } from "@/core/components";
```

## Componentes disponíveis (Fase 1.1)

| Componente        | Papel                                                      |
| ----------------- | ---------------------------------------------------------- |
| `Button`          | Ação primária/secundária (reexport shadcn).                |
| `DataTable`       | Tabela genérica tipada com colunas declarativas.           |
| `PageHeader`      | Cabeçalho padrão de página (título, descrição, ações).     |
| `PageContainer`   | Wrapper de largura/padding consistente.                    |
| `MetricCard`      | Card de métrica/KPI com tendência opcional.                |
| `SearchInput`     | Input de busca com ícone.                                  |
| `StatusBadge`     | Selo de status com tons semânticos.                        |
| `EmptyState`      | Estado vazio padrão.                                       |
| `LoadingOverlay`  | Overlay de carregamento (absoluto ou fixo).                |
| `FormSection`     | Bloco de formulário com título/descrição + campos.         |
| `ModuleCard`      | Card representando um módulo da plataforma.                |
| `AppShell`        | Layout base autenticado (sidebar + topbar + main).         |
| `Sidebar`         | Sidebar navegável com grupos e itens.                      |
| `Topbar`          | Barra superior com trigger de sidebar e slots.             |

## Regras

1. **Tokens semânticos apenas** — nunca hex ou `text-white`/`bg-black`.
2. **Sem dependências de módulos** — o Core não importa de `/modules`.
3. **Composição sobre customização** — prefira compor `PageHeader + PageContainer` a criar variantes ad-hoc.
4. **Acessibilidade** — todo interativo precisa `role`/`aria-*` adequados.