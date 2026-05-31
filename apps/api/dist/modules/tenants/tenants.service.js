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
const tenant_entity_1 = require("../../database/entities/tenant.entity");
const shared_1 = require("@smart-pickup/shared");
const register_tenant_dto_1 = require("./dto/register-tenant.dto");
Object.defineProperty(exports, "RegisterTenantDto", { enumerable: true, get: function () { return register_tenant_dto_1.RegisterTenantDto; } });
let TenantsService = class TenantsService {
    constructor(repo) {
        this.repo = repo;
    }
    async register(dto) {
        const existing = await this.repo.findOne({ where: { slug: dto.slug } });
        if (existing)
            throw new common_1.ConflictException('Slug already taken');
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        const tenant = this.repo.create({
            ...dto,
            plan: dto.plan ?? shared_1.TenantPlan.STARTER,
            status: shared_1.TenantStatus.TRIAL,
            trialEndsAt,
        });
        return this.repo.save(tenant);
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
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TenantsService);
