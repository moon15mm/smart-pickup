import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { TenantPlan } from '@smart-pickup/shared';

export class RegisterTenantDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsEmail()
  billingEmail: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}
