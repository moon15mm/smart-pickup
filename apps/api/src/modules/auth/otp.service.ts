import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const OTP_TTL = 300; // 5 minutes

@Injectable()
export class OtpService {
  private redis: Redis;

  constructor(private config: ConfigService) {
    this.redis = new Redis(this.config.get<string>('REDIS_URL'));
  }

  generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async store(mobile: string, otp: string): Promise<void> {
    const key = `otp:${mobile}`;
    await this.redis.setex(key, OTP_TTL, otp);
  }

  async verify(mobile: string, otp: string): Promise<boolean> {
    const key = `otp:${mobile}`;
    const stored = await this.redis.get(key);
    if (stored === otp) {
      await this.redis.del(key);
      return true;
    }
    return false;
  }

  async getRateLimit(mobile: string): Promise<number> {
    const key = `otp:rate:${mobile}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 3600);
    return count;
  }
}
