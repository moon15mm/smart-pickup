"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
const OTP_TTL = 300;
let OtpService = OtpService_1 = class OtpService {
    constructor(config) {
        this.config = config;
        this.redis = null;
        this.memStore = new Map();
        this.logger = new common_1.Logger(OtpService_1.name);
        const redisUrl = this.config.get('REDIS_URL');
        if (redisUrl) {
            try {
                this.redis = new ioredis_1.default(redisUrl, {
                    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
                    maxRetriesPerRequest: 3,
                    lazyConnect: true,
                });
                this.redis.on('error', (err) => {
                    this.logger.warn(`Redis error — falling back to memory: ${err.message}`);
                    this.redis = null;
                });
            }
            catch {
                this.logger.warn('Redis not available — using in-memory OTP store');
            }
        }
        else {
            this.logger.warn('No REDIS_URL — using in-memory OTP store (dev mode)');
        }
    }
    generate() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async store(mobile, otp) {
        const key = `otp:${mobile}`;
        if (this.redis) {
            await this.redis.setex(key, OTP_TTL, otp);
        }
        else {
            this.memStore.set(key, { value: otp, expires: Date.now() + OTP_TTL * 1000 });
        }
    }
    async verify(mobile, otp) {
        const key = `otp:${mobile}`;
        if (this.redis) {
            const stored = await this.redis.get(key);
            if (stored === otp) {
                await this.redis.del(key);
                return true;
            }
            return false;
        }
        else {
            const entry = this.memStore.get(key);
            if (!entry || Date.now() > entry.expires)
                return false;
            if (entry.value === otp) {
                this.memStore.delete(key);
                return true;
            }
            return false;
        }
    }
    async getRateLimit(mobile) {
        const key = `otp:rate:${mobile}`;
        if (this.redis) {
            const count = await this.redis.incr(key);
            if (count === 1)
                await this.redis.expire(key, 3600);
            return count;
        }
        const entry = this.memStore.get(key);
        const count = entry ? parseInt(entry.value) + 1 : 1;
        this.memStore.set(key, { value: String(count), expires: Date.now() + 3600_000 });
        return count;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OtpService);
