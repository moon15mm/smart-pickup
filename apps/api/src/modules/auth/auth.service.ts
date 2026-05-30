import { Injectable, UnauthorizedException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from '../../database/entities/customer.entity';
import { Staff } from '../../database/entities/staff.entity';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { StaffLoginDto } from './dto/staff-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private config: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const rate = await this.otpService.getRateLimit(dto.mobile);
    if (rate > 5) throw new HttpException('Too many OTP requests', HttpStatus.TOO_MANY_REQUESTS);

    const otp = this.otpService.generate();
    await this.otpService.store(dto.mobile, otp);

    // In production: send via Twilio
    // For development: log it
    if (this.config.get('NODE_ENV') === 'development') {
      console.log(`[DEV OTP] ${dto.mobile}: ${otp}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const valid = await this.otpService.verify(dto.mobile, dto.otp);
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');

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

  async staffLogin(dto: StaffLoginDto) {
    const staff = await this.staffRepo.findOne({
      where: { mobile: dto.mobile, isActive: true },
    });
    if (!staff) throw new UnauthorizedException('Invalid credentials');

    if (dto.pin) {
      const valid = await bcrypt.compare(dto.pin, staff.pinHash);
      if (!valid) throw new UnauthorizedException('Invalid PIN');
    } else if (dto.password) {
      const valid = await bcrypt.compare(dto.password, staff.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid password');
    } else {
      throw new BadRequestException('PIN or password required');
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

  private generateTokens(payload: Record<string, unknown>) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });
    return { accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const { iat, exp, ...rest } = payload;
      return { accessToken: this.jwtService.sign(rest) };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
