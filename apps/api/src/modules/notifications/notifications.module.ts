import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SmsProvider } from './providers/sms.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';
import { PushProvider } from './providers/push.provider';

@Global()
@Module({
  providers: [NotificationsService, SmsProvider, WhatsappProvider, PushProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
