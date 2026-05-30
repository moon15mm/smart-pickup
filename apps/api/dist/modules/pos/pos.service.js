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
exports.PosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pos_integration_entity_1 = require("../../database/entities/pos-integration.entity");
const products_service_1 = require("../products/products.service");
const shared_1 = require("@smart-pickup/shared");
class FoodicsAdapter {
    async getProducts(integration) {
        const { apiKey, branchId } = integration.credentials;
        const res = await fetch(`https://api.foodics.com/v5/products?branch_id=${branchId}`, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        });
        const json = (await res.json());
        return json.data ?? [];
    }
}
class CsvAdapter {
    async getProducts(_integration) {
        return [];
    }
}
const ADAPTERS = {
    [shared_1.PosProvider.FOODICS]: new FoodicsAdapter(),
    [shared_1.PosProvider.CSV]: new CsvAdapter(),
    [shared_1.PosProvider.SQUARE]: new CsvAdapter(),
    [shared_1.PosProvider.MANUAL]: new CsvAdapter(),
};
let PosService = class PosService {
    constructor(integrationRepo, productsService) {
        this.integrationRepo = integrationRepo;
        this.productsService = productsService;
    }
    async sync(integrationId, tenantId) {
        const integration = await this.integrationRepo.findOne({
            where: { id: integrationId, tenantId },
        });
        if (!integration)
            throw new common_1.NotFoundException('Integration not found');
        const adapter = ADAPTERS[integration.provider];
        const rawProducts = await adapter.getProducts(integration);
        const mapped = rawProducts.map((p) => ({
            posRefId: String(p.id),
            name: String(p.name),
            nameAr: String(p.name_ar ?? p.name),
            sku: String(p.sku ?? p.reference ?? p.id),
            price: parseFloat(String(p.price ?? 0)),
            stockQuantity: parseInt(String(p.quantity ?? 0), 10),
            isActive: Boolean(p.is_active ?? true),
        }));
        const result = await this.productsService.bulkUpsert(mapped, integration.storeId, tenantId);
        integration.lastSyncAt = new Date();
        integration.status = 'active';
        await this.integrationRepo.save(integration);
        return { ...result, syncedAt: integration.lastSyncAt };
    }
    async createIntegration(data, tenantId) {
        const integration = this.integrationRepo.create({ ...data, tenantId });
        return this.integrationRepo.save(integration);
    }
    async findByStore(storeId, tenantId) {
        return this.integrationRepo.find({ where: { storeId, tenantId } });
    }
};
exports.PosService = PosService;
exports.PosService = PosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pos_integration_entity_1.PosIntegration)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        products_service_1.ProductsService])
], PosService);
