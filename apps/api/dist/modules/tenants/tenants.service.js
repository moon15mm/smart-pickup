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
exports.TenantsService = exports.RegisterTenantDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const tenant_entity_1 = require("../../database/entities/tenant.entity");
const store_entity_1 = require("../../database/entities/store.entity");
const staff_entity_1 = require("../../database/entities/staff.entity");
const order_entity_1 = require("../../database/entities/order.entity");
const shared_1 = require("@smart-pickup/shared");
const register_tenant_dto_1 = require("./dto/register-tenant.dto");
Object.defineProperty(exports, "RegisterTenantDto", { enumerable: true, get: function () { return register_tenant_dto_1.RegisterTenantDto; } });
let TenantsService = class TenantsService {
    constructor(repo, storeRepo, staffRepo, orderRepo, jwt) {
        this.repo = repo;
        this.storeRepo = storeRepo;
        this.staffRepo = staffRepo;
        this.orderRepo = orderRepo;
        this.jwt = jwt;
    }
    async register(dto) {
        const existing = await this.repo.findOne({ where: { slug: dto.slug } });
        if (existing)
            throw new common_1.ConflictException('Slug already taken');
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const tenant = await this.repo.save(this.repo.create({
            name: dto.name,
            slug: dto.slug,
            billingEmail: dto.billingEmail,
            plan: dto.plan ?? shared_1.TenantPlan.STARTER,
            status: shared_1.TenantStatus.TRIAL,
            trialEndsAt,
        }));
        if (dto.ownerMobile && dto.ownerPin) {
            const store = await this.storeRepo.save(this.storeRepo.create({
                tenantId: tenant.id,
                name: dto.storeName ?? dto.name,
                nameAr: dto.storeNameAr ?? dto.name,
                category: dto.storeCategory ?? shared_1.StoreCategory.GROCERY,
                isActive: true,
                operatingHours: {},
            }));
            const owner = await this.staffRepo.save(this.staffRepo.create({
                tenantId: tenant.id,
                storeId: store.id,
                name: dto.ownerName ?? 'Owner',
                mobile: dto.ownerMobile,
                role: shared_1.StaffRole.OWNER,
                pinHash: await bcrypt.hash(dto.ownerPin, 10),
                isActive: true,
            }));
            const payload = {
                sub: owner.id,
                type: 'staff',
                tenantId: tenant.id,
                storeId: store.id,
                role: shared_1.StaffRole.OWNER,
            };
            const accessToken = this.jwt.sign(payload);
            return { tenant, store, owner: { id: owner.id, name: owner.name, role: owner.role }, accessToken };
        }
        return tenant;
    }
    async findById(id) {
        const tenant = await this.repo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
    }
    async updateSettings(id, settings) {
        const tenant = await this.findById(id);
        tenant.settings = { ...tenant.settings, ...settings };
        return this.repo.save(tenant);
    }
    async listAll() {
        return this.repo.find({
            relations: ['stores', 'staff'],
            order: { createdAt: 'DESC' },
        });
    }
    async getAdminStats() {
        const tenantsCount = await this.repo.count();
        const storesCount = await this.storeRepo.count();
        const ordersCount = await this.orderRepo.count();
        const revenueResult = await this.orderRepo
            .createQueryBuilder('order')
            .select('SUM(order.total)', 'total')
            .where('order.status = :status', { status: 'delivered' })
            .getRawOne();
        const totalRevenue = parseFloat(revenueResult?.total ?? '0');
        const statusResult = await this.repo
            .createQueryBuilder('t')
            .select('t.status, COUNT(t.id)', 'count')
            .groupBy('t.status')
            .getRawMany();
        const statusDistribution = statusResult.reduce((acc, r) => {
            acc[r.status] = parseInt(r.count, 10);
            return acc;
        }, {});
        const planResult = await this.repo
            .createQueryBuilder('t')
            .select('t.plan, COUNT(t.id)', 'count')
            .groupBy('t.plan')
            .getRawMany();
        const planDistribution = planResult.reduce((acc, r) => {
            acc[r.plan] = parseInt(r.count, 10);
            return acc;
        }, {});
        return {
            tenantsCount,
            storesCount,
            ordersCount,
            totalRevenue,
            statusDistribution,
            planDistribution,
        };
    }
    async adminUpdate(id, plan, status) {
        const tenant = await this.findById(id);
        if (plan)
            tenant.plan = plan;
        if (status)
            tenant.status = status;
        return this.repo.save(tenant);
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(1, (0, typeorm_1.InjectRepository)(store_entity_1.Store)),
    __param(2, (0, typeorm_1.InjectRepository)(staff_entity_1.Staff)),
    __param(3, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], TenantsService);
