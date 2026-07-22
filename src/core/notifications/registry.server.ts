import type { NotificationChannel, NotificationProviderDriver } from "./types";
import { InAppProvider } from "./providers/in-app.server";
import {
  DiscordProvider,
  EmailProvider,
  PushProvider,
  SlackProvider,
  SmsProvider,
  TeamsProvider,
  TelegramProvider,
  WebhookProvider,
  WhatsappProvider,
} from "./providers/stubs";

class NotificationRegistryImpl {
  private readonly map = new Map<NotificationChannel, NotificationProviderDriver>();
  register(p: NotificationProviderDriver) { this.map.set(p.channel, p); }
  get(c: NotificationChannel) { return this.map.get(c); }
  all(): readonly NotificationProviderDriver[] { return Array.from(this.map.values()); }
}

export const NotificationRegistry = new NotificationRegistryImpl();
NotificationRegistry.register(InAppProvider);
NotificationRegistry.register(EmailProvider);
NotificationRegistry.register(WhatsappProvider);
NotificationRegistry.register(SmsProvider);
NotificationRegistry.register(PushProvider);
NotificationRegistry.register(WebhookProvider);
NotificationRegistry.register(DiscordProvider);
NotificationRegistry.register(SlackProvider);
NotificationRegistry.register(TeamsProvider);
NotificationRegistry.register(TelegramProvider);
