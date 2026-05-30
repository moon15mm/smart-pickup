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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../database/entities/product.entity");
const product_category_entity_1 = require("../../database/entities/product-category.entity");
let ProductsService = class ProductsService {
    constructor(productRepo, categoryRepo) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
    }
    async findAll(storeId, tenantId, query) {
        const where = { storeId, tenantId, isActive: true };
        if (query.categoryId)
            where.categoryId = query.categoryId;
        const qb = this.productRepo
            .createQueryBuilder('p')
            .where('p.storeId = :storeId AND p.tenantId = :tenantId AND p.isActive = true', { storeId, tenantId })
            .leftJoinAndSelect('p.category', 'category')
            .orderBy('category.sortOrder', 'ASC')
            .addOrderBy('p.name', 'ASC');
        if (query.search) {
            qb.andWhere('(p.name ILIKE :q OR p.nameAr ILIKE :q OR p.sku ILIKE :q)', {
                q: `%${query.search}%`,
            });
        }
        if (query.categoryId)
            qb.andWhere('p.categoryId = :cid', { cid: query.categoryId });
        const limit = parseInt(query.limit ?? '50', 10);
        const offset = parseInt(query.offset ?? '0', 10);
        qb.take(limit).skip(offset);
        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }
    async findById(id, tenantId) {
        const product = await this.productRepo.findOne({ where: { id, tenantId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async create(dto, storeId, tenantId) {
        const product = this.productRepo.create({ ...dto, storeId, tenantId });
        return this.productRepo.save(product);
    }
    async update(id, dto, tenantId) {
        const product = await this.findById(id, tenantId);
        Object.assign(product, dto);
        return this.productRepo.save(product);
    }
    async remove(id, tenantId) {
        const product = await this.findById(id, tenantId);
        product.isActive = false;
        await this.productRepo.save(product);
    }
    async bulkUpsert(products, storeId, tenantId) {
        const entities = products.map((p) => this.productRepo.create({ ...p, storeId, tenantId }));
        await this.productRepo.upsert(entities, ['tenantId', 'storeId', 'sku']);
        return { upserted: entities.length };
    }
    async getCategories(storeId, tenantId) {
        return this.categoryRepo.find({
            where: { storeId, tenantId },
            order: { sortOrder: 'ASC' },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_category_entity_1.ProductCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductsService);
