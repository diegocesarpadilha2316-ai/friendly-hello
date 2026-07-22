/**
 * Dioris Hub — Core
 *
 * Base compartilhada consumida por todos os módulos.
 * Nenhum módulo deve duplicar funcionalidades expostas aqui.
 *
 * Responsabilidades:
 *  - autenticação, usuários, empresas
 *  - permissões, notificações, créditos
 *  - uploads, configurações, logs, auditoria
 *  - integrações, APIs, cache, helpers
 */
export * as config from "./config";
export * as types from "./types";
export * as utils from "./utils";
export * as lib from "./lib";
export * as services from "./services";
export * as hooks from "./hooks";
export * as providers from "./providers";
export * as dashboard from "./dashboard";
export * as billing from "./billing";
export * as ai from "./ai";
export * as observability from "./observability";
export * as configuration from "./configuration";
export * as integrations from "./integrations";
export * as sdk from "./sdk";
export * as jobs from "./jobs";
