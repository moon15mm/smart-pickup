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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const customer_entity_1 = require("../../database/entities/customer.entity");
const staff_entity_1 = require("../../database/entities/staff.entity");
const otp_service_1 = require("./otp.service");
let AuthService = class AuthService {
    constructor(customerRepo, staffRepo, jwtService, otpService, config) {
        this.customerRepo = customerRepo;
        this.staffRepo = staffRepo;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.config = config;
    }
    async sendOtp(dto) {
        const rate = await this.otpService.getRateLimit(dto.mobile);
        if (rate > 5)
            throw new common_1.HttpException('Too many OTP requests', common_1.HttpStatus.TOO_MANY_REQUESTS);
        const otp = this.otpService.generate();
        await this.otpService.store(dto.mobile, otp);
        if (this.config.get('NODE_ENV') === 'development') {
            console.log(`[DEV OTP] ${dto.mobile}: ${otp}`);
        }
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(dto) {
        const valid = await this.otpService.verify(dto.mobile, dto.otp);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        let customer = await this.customerRepo.findOne({
            where: { mobile: dto.mobile },
            relations: ['vehicles'],
        });
        if (!customer) {
            customer = this.customerRepo.create({ mobile: dto.mobile });
            await this.customerRepo.save(customer);
        }
        const tokens = this.generateTokens({ sub: customer.id, type: 'customer' });
        return { customer, ...tokens };
    }
    async staffLogin(dto) {
        const staff = await this.staffRepo.findOne({
            where: { mobile: dto.mobile, isActive: true },
        });
        if (!staff)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (dto.pin) {
            const valid = await bcrypt.compare(dto.pin, staff.pinHash);
            if (!valid)
                throw new common_1.UnauthorizedException('Invalid PIN');
        }
        else if (dto.password) {
            const valid = await bcrypt.compare(dto.password, staff.passwordHash);
            if (!valid)
                throw new common_1.UnauthorizedException('Invalid password');
        }
        else {
            throw new common_1.BadRequestException('PIN or password required');
        }
        const tokens = this.generateTokens({
            sub: staff.id,
            type: 'staff',
            tenantId: staff.tenantId,
            storeId: staff.storeId,
            role: staff.role,
        });
        return { staff, ...tokens };
    }
    generateTokens(payload) {
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
        });
        return { accessToken, refreshToken };
    }
    async refreshToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            const { iat, exp, ...rest } = payload;
            return { accessToken: this.jwtService.sign(rest) };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(staff_entity_1.Staff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        otp_service_1.OtpService,
        config_1.ConfigService])
], AuthService);
