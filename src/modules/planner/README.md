# Módulo: Planner

Fundação arquitetural do módulo Planner da Dioris Hub. Preparada para
suportar todas as fases funcionais futuras (Planner de Móveis, IA, Render,
CNC, Produção, etc.) sem refactor de estrutura.

## Estrutura

```
src/modules/planner
├── shared/
│   ├── types/         # Ids opacos, PlannerContext, PlannerDomain
│   ├── contracts/     # Interfaces públicas entre domínios
│   ├── registry/      # PlannerRegistry (composição em runtime)
│   ├── events/        # PlannerEventBus (pub/sub tipado)
│   └── extensions/    # PlannerExtensionHost (plugins/hooks)
└── domains/
    ├── ia/            # Assistente, geração, otimização, orçamento, produção, renderização
    ├── render/        # Viewport, foto-real, final, panorama, vídeo, tour, antes/depois
    ├── catalog/       # Módulos, materiais, ferragens, vidros, perfis, decorações, fabricantes, SKUs, templates
    ├── production/    # BOM, OP, separação, etiquetas, montagem, expedição, qualidade, dashboard
    ├── cnc/           # Plano de corte, DXF, G-Code, pós-processadores, ferramentas, usinagem, simulação
    ├── executive/     # Plantas, cortes, detalhes, isométricos, explodidos, cotas, tabelas, PDF/DWG/SVG
    ├── budget/        # Custos, mão de obra, comissão, impostos, lucro, propostas, aprovação
    ├── library/       # Ambientes, kits, favoritos, recentes, templates, componentes, decorativos
    ├── rooms/         # Cozinha, closet, dormitório, banheiro, lavanderia, escritório, comercial, corporativo, IA
    ├── materials/     # MDF, MDP, madeira, pedra, vidro, alumínio, espelho, acabamentos, PBR
    ├── hardware/      # Blum, Hettich, Häfele, FGV, corrediças, dobradiças, pistões, trilhos, puxadores, acessórios
    ├── marketplace/   # (preparado) fabricantes, bibliotecas, atualizações, premium, sincronização
    └── api/           # (preparado) webhooks, REST, SDK, plugins, integrações, docs
```

Cada domínio segue o mesmo padrão interno:

```
<domain>/
├── types/       # tipos privados
├── services/    # server functions (usam middlewares do Core)
├── hooks/       # React hooks (TanStack Query)
├── components/  # UI (consome UI Kit do Core)
└── index.ts     # barrel
```

## Regras não-negociáveis

- **Um único Core.** Auth, Tenant, RBAC, IA Gateway, Créditos, Uploads,
  Configurações, Auditoria e APIs vêm de `@/core`. Nunca duplicar.
- **Domínios independentes.** Nenhum domínio importa outro; toda troca
  acontece via `PlannerRegistry` (contratos) ou `PlannerEventBus`.
- **Extensões, não forks.** Novas features plugáveis via
  `PlannerExtensionHost` (Marketplace e API Pública já cobertos).
- **Segurança pelo tenant.** Toda operação server-side passa por
  `requireTenant` / `requirePermission` — nunca acessar dados de outra
  empresa.

Nesta fase entregamos apenas a **estrutura** — zero funcionalidade.
