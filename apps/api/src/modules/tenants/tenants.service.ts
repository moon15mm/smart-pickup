import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { TenantPlan, TenantStatus } from '@smart-pickup/shared';

export class RegisterTenantDto {
  name: string;
  slug: string;
  billingEmail: string;
  plan?: TenantPlan;
}

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private repo: Repository<Tenant>) {}

  async register(dto: RegisterTenantDto): Promise<Tenant> {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already taken');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const tenant = this.repo.create({
      ...dto,
      plan: dto.plan ?? TenantPlan.STARTER,
      status: TenantStatus.TRIAL,
      trialEndsAt,
    });
    return this.repo.save(tenant);
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateSettings(id: string, settings: Record<string, unknown>): Promise<Tenant> {
    const tenant = await this.findById(id);
    tenant.settings = { ...tenant.settings, ...settings };
    return this.repo.save(tenant);
  }
}
