import type { NotificationChannel, NotificationProviderDriver } from "../types";

function stub(channel: NotificationChannel, label: string): NotificationProviderDriver {
  return {
    channel,
    label,
    enabled: false,
    send: async () => ({ providerMessageId: null }),
  };
}

export const EmailProvider = stub("email", "E-mail");
export const WhatsappProvider = stub("whatsapp", "WhatsApp");
export const SmsProvider = stub("sms", "SMS");
export const PushProvider = stub("push", "Push");
export const WebhookProvider = stub("webhook", "Webhook");
export const DiscordProvider = stub("discord", "Discord");
export const SlackProvider = stub("slack", "Slack");
export const TeamsProvider = stub("teams", "Microsoft Teams");
export const TelegramProvider = stub("telegram", "Telegram");
