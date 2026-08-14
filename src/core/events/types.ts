/**
 * Event Center — contratos canônicos.
 * Único ponto de tipos para publicação e assinatura de eventos.
 */
export type JsonScalar = string | number | boolean | null;
export type JsonValue = JsonScalar | JsonValue[] | { readonly [key: string]: JsonValue };
export interface EventPayload {
  readonly [key: string]: JsonValue;
}

export type EventPriority = "low" | "normal" | "high" | "critical";
export type EventStatus =
  "pending" | "processing" | "delivered" | "failed" | "dead" | "scheduled" | "deduped";

/** Tipo de evento — string dotted namespaced: `<módulo>.<recurso>.<ação>` */
export type EventType = string;

export interface Event {
  readonly id: string;
  readonly companyId: string;
  readonly type: EventType;
  readonly source: string;
  readonly priority: EventPriority;
  readonly status: EventStatus;
  readonly payload: EventPayload;
  readonly metadata: EventPayload;
  readonly dedupeKey: string | null;
  readonly scheduledAt: string;
  readonly processedAt: string | null;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly lastError: string | null;
  readonly actorId: string | null;
  readonly createdAt: string;
}

export interface EventDelivery {
  readonly id: string;
  readonly companyId: string;
  readonly eventId: string;
  readonly subscriber: string;
  readonly status: EventStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly lastError: string | null;
  readonly nextAttemptAt: string;
  readonly deliveredAt: string | null;
  readonly createdAt: string;
}

export interface EventMetrics {
  readonly total: number;
  readonly pending: number;
  readonly delivered: number;
  readonly failed: number;
  readonly dead: number;
}

export interface PublishInput {
  readonly type: EventType;
  readonly payload?: EventPayload;
  readonly metadata?: EventPayload;
  readonly priority?: EventPriority;
  readonly source?: string;
  readonly dedupeKey?: string;
  readonly scheduledAt?: string;
  readonly maxAttempts?: number;
}
