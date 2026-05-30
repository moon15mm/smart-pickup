import { NotificationChannel } from '../enums';
export interface NotificationPayload {
    channel: NotificationChannel;
    recipient: string;
    templateKey: string;
    variables: Record<string, string>;
    orderId?: string;
}
