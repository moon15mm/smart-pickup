import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);

  async send(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    // Firebase Admin SDK integration point
    // import * as admin from 'firebase-admin';
    // await admin.messaging().send({ token: fcmToken, notification: { title, body }, data });
    this.logger.debug(`[PUSH] To: ${fcmToken} | ${title}: ${body}`);
  }
}
