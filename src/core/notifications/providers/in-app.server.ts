import type { NotificationProviderDriver } from "../types";

/**
 * In-App: a notificação já é persistida em `public.notifications` pelo
 * NotificationManager; o "envio" é um no-op de sucesso.
 */
export const InAppProvider: NotificationProviderDriver = {
  channel: "in_app",
  label: "In-App",
  enabled: true,
  send: async () => ({ providerMessageId: null }),
};
