import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const OTP_TTL = 300; // 5 minutes

@Injectable()
export class OtpService {
  private redis: Redis | null = null;
  private memStore = new Map<string, { value: string; expires: number }>();
  private readonly logger = new Logger(OtpService.name);

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
        this.redis.on('error', (err) => {
          this.logger.warn(`Redis error — falling back to memory: ${err.message}`);
          this.redis = null;
        });
      } catch {
        this.logger.warn('Redis not available — using in-memory OTP store');
      }
    } else {
      this.logger.warn('No REDIS_URL — using in-memory OTP store (dev mode)');
    }
  }

  generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async store(mobile: string, otp: string): Promise<void> {
    const key = `otp:${mobile}`;
    if (this.redis) {
      await this.redis.setex(key, OTP_TTL, otp);
    } else {
      this.memStore.set(key, { value: otp, expires: Date.now() + OTP_TTL * 1000 });
    }
  }

  async verify(mobile: string, otp: string): Promise<boolean> {
    const key = `otp:${mobile}`;
    if (this.redis) {
      const stored = await this.redis.get(key);
      if (stored === otp) { await this.redis.del(key); return true; }
      return false;
    } else {
      const entry = this.memStore.get(key);
      if (!entry || Date.now() > entry.expires) return false;
      if (entry.value === otp) { this.memStore.delete(key); return true; }
      return false;
    }
  }

  async getRateLimit(mobile: string): Promise<number> {
    const key = `otp:rate:${mobile}`;
    if (this.redis) {
      const count = await this.redis.incr(key);
      if (count === 1) await this.redis.expire(key, 3600);
      return count;
    }
    // In-memory rate limit
    const entry = this.memStore.get(key);
    const count = entry ? parseInt(entry.value) + 1 : 1;
    this.memStore.set(key, { value: String(count), expires: Date.now() + 3600_000 });
    return count;
  }
}
