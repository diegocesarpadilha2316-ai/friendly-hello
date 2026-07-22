/**
 * Módulo: planner (Dioris Hub)
 *
 * Arquitetura interna — nascida pronta para escala, sem refactor futuro.
 *
 * Camadas:
 *  - shared/        tipos, contratos, registry, eventos e extensões
 *  - domains/*      13 domínios independentes (ia, render, catálogo,
 *                   produção, cnc, executivo, orçamento, biblioteca,
 *                   ambientes, materiais, ferragens, marketplace, api)
 *
 * Regras de ouro:
 *  1. Todo domínio consome apenas `@/core` e `@/modules/planner/shared`.
 *  2. Domínios NÃO se importam entre si — falam via PlannerRegistry
 *     (contratos) e PlannerEventBus (eventos).
 *  3. Extensibilidade acontece via PlannerExtensionHost (plugins/hooks)
 *     — cobre Marketplace e API Pública sem refatorar o núcleo.
 *  4. Persistência, RBAC, IA e Créditos são responsabilidade do Core.
 *
 * Nenhuma funcionalidade de negócio nesta fase — apenas fundação.
 */
export * as shared from "./shared";
export * as domains from "./domains";
