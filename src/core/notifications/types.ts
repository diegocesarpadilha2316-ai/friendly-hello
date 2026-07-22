/**
 * Notification Center — contratos canônicos.
 * Único ponto de tipos para notificações, templates, preferências e providers.
 */
import type { EventPayload, EventPriority, JsonValue } from "@/core/events/types";

export type NotificationChannel =
  | "in_app"
  | "email"
  | "whatsapp"
  | "sms"
  | "push"
  | "webhook"
  | "discord"
  | "slack"
  | "teams"
  | "telegram";

export type NotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "read"
  | "archived"
  | "muted"
  | "skipped";

export interface Notification {
  readonly id: string;
  readonly companyId: string;
  readonly userId: string | null;
  readonly eventId: string | null;
  readonly category: string;
  readonly priority: EventPriority;
  readonly title: string;
  readonly body: string | null;
  readonly icon: string | null;
  readonly link: string | null;
  readonly data: EventPayload;
  readonly status: NotificationStatus;
  readonly readAt: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string;
}

export interface NotificationTemplate {
  readonly id: string;
  readonly companyId: string | null;
  readonly key: string;
  readonly channel: NotificationChannel;
  readonly locale: string;
  readonly subject: string | null;
  readonly body: string;
  readonly variables: readonly string[];
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationRule {
  readonly id: string;
  readonly companyId: string;
  readonly name: string;
  readonly eventType: string;
  readonly channels: readonly NotificationChannel[];
  readonly category: string;
  readonly audience: { readonly [key: string]: JsonValue };
  readonly templateKey: string | null;
  readonly enabled: boolean;
  readonly priority: EventPriority;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationSubscription {
  readonly id: string;
  readonly companyId: string;
  readonly userId: string | null;
  readonly channel: NotificationChannel;
  readonly eventType: string;
  readonly target: string | null;
  readonly enabled: boolean;
  readonly createdAt: string;
}

export interface NotificationPreference {
  readonly id: string;
  readonly companyId: string;
  readonly userId: string | null;
  readonly channel: NotificationChannel;
  readonly category: string;
  readonly enabled: boolean;
  readonly mutedUntil: string | null;
  readonly updatedAt: string;
}

export interface NotificationDelivery {
  readonly id: string;
  readonly companyId: string;
  readonly notificationId: string | null;
  readonly eventId: string | null;
  readonly channel: NotificationChannel;
  readonly target: string;
  readonly status: NotificationStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly lastError: string | null;
  readonly provider: string | null;
  readonly providerMessageId: string | null;
  readonly nextAttemptAt: string;
  readonly deliveredAt: string | null;
  readonly createdAt: string;
}

export interface NotificationAuditEntry {
  readonly id: string;
  readonly companyId: string;
  readonly actorId: string | null;
  readonly entity: string;
  readonly entityId: string | null;
  readonly action: string;
  readonly detail: { readonly [key: string]: JsonValue };
  readonly createdAt: string;
}

export interface NotificationMetrics {
  readonly total: number;
  readonly unread: number;
  readonly deliveriesPending: number;
  readonly deliveriesFailed: number;
}

/** Contrato único para providers de notificação. */
export interface NotificationProviderDriver {
  readonly channel: NotificationChannel;
  readonly label: string;
  readonly enabled: boolean;
  send(input: {
    target: string;
    subject?: string | null;
    body: string;
    data?: EventPayload;
  }): Promise<{ providerMessageId?: string | null }>;
}

export class NotificationError extends Error {
  constructor(message: string, public readonly channel: NotificationChannel) {
    super(message);
    this.name = "NotificationError";
  }
}
