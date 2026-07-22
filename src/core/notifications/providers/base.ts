import { NotificationError, type NotificationChannel, type NotificationProviderDriver } from "../types";

export abstract class BaseNotificationProvider implements NotificationProviderDriver {
  abstract readonly channel: NotificationChannel;
  abstract readonly label: string;
  readonly enabled: boolean = false;

  send(_input: {
    target: string;
    subject?: string | null;
    body: string;
  }): Promise<{ providerMessageId?: string | null }> {
    return Promise.reject(
      new NotificationError(`Provider ${this.channel} não implementado`, this.channel),
    );
  }
}
