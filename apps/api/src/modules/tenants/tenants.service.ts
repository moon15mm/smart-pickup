import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../../database/entities/tenant.entity';
import { Store } from '../../database/entities/store.entity';
import { Staff } from '../../database/entities/staff.entity';
import { TenantPlan, TenantStatus, StaffRole, StoreCategory } from '@smart-pickup/shared';
import { RegisterTenantDto } from './dto/register-tenant.dto';

export { RegisterTenantDto };

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private repo: Repository<Tenant>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(Staff) private staffRepo: Repository<Staff>,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterTenantDto): Promise<any> {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already taken');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const tenant = await this.repo.save(
      this.repo.create({
        name: dto.name,
        slug: dto.slug,
        billingEmail: dto.billingEmail,
        plan: dto.plan ?? TenantPlan.STARTER,
        status: TenantStatus.TRIAL,
        trialEndsAt,
      }),
    );

    // If owner details provided, bootstrap first store + owner staff + token
    if (dto.ownerMobile && dto.ownerPin) {
      const store = await this.storeRepo.save(
        this.storeRepo.create({
          tenantId: tenant.id,
          name: dto.storeName ?? dto.name,
          nameAr: dto.storeNameAr ?? dto.name,
          category: dto.storeCategory ?? StoreCategory.GROCERY,
          isActive: true,
          operatingHours: {},
        }),
      );

      const owner = await this.staffRepo.save(
        this.staffRepo.create({
          tenantId: tenant.id,
          storeId: store.id,
          name: dto.ownerName ?? 'Owner',
          mobile: dto.ownerMobile,
          role: StaffRole.OWNER,
          pinHash: await bcrypt.hash(dto.ownerPin, 10),
          isActive: true,
        }),
      );

      const payload = {
        sub: owner.id,
        type: 'staff',
        tenantId: tenant.id,
        storeId: store.id,
        role: StaffRole.OWNER,
      };
      const accessToken = this.jwt.sign(payload);

      return { tenant, store, owner: { id: owner.id, name: owner.name, role: owner.role }, accessToken };
    }

    return tenant;
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
