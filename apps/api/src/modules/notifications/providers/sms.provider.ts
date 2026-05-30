import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsProvider {
  private client: twilio.Twilio | null = null;
  private from: string;
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private config: ConfigService) {
    const sid = config.get('TWILIO_ACCOUNT_SID');
    const token = config.get('TWILIO_AUTH_TOKEN');
    this.from = config.get('TWILIO_PHONE_NUMBER', '');
    if (sid && token) {
      this.client = twilio(sid, token);
    }
  }

  async send(to: string, body: string): Promise<void> {
    if (!this.client) {
      this.logger.debug(`[SMS] To: ${to} | ${body}`);
      return;
    }
    try {
      await this.client.messages.create({ to, from: this.from, body });
    } catch (err) {
      this.logger.error(`SMS failed to ${to}: ${err}`);
    }
  }
}
