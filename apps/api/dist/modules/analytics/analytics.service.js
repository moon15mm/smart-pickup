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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../../database/entities/order.entity");
const order_item_entity_1 = require("../../database/entities/order-item.entity");
const shared_1 = require("@smart-pickup/shared");
let AnalyticsService = class AnalyticsService {
    constructor(orderRepo, itemRepo) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
    }
    async getDashboard(storeId, tenantId, from, to) {
        const base = this.orderRepo
            .createQueryBuilder('o')
            .where('o.storeId = :storeId AND o.tenantId = :tenantId AND o.createdAt BETWEEN :from AND :to AND o.status != :cancelled', { storeId, tenantId, from, to, cancelled: shared_1.OrderStatus.CANCELLED });
        const [totalOrders, revenue, avgPrep, topProducts, hourlyBreakdown] = await Promise.all([
            base.clone().getCount(),
            base.clone()
                .select('COALESCE(SUM(o.total), 0)', 'total')
                .getRawOne(),
            base.clone()
                .select('AVG(EXTRACT(EPOCH FROM (o.deliveredAt - o.createdAt))/60)', 'avgMins')
                .where('o.deliveredAt IS NOT NULL')
                .getRawOne(),
            this.itemRepo
                .createQueryBuilder('i')
                .innerJoin('i.order', 'o')
                .where('o.storeId = :storeId AND o.tenantId = :tenantId AND o.createdAt BETWEEN :from AND :to', { storeId, tenantId, from, to })
                .select(['i.nameSnapshot AS name', 'SUM(i.quantity) AS qty', 'SUM(i.priceSnapshot * i.quantity) AS revenue'])
                .groupBy('i.nameSnapshot')
                .orderBy('qty', 'DESC')
                .limit(10)
                .getRawMany(),
            base.clone()
                .select(['EXTRACT(HOUR FROM o.createdAt) AS hour', 'COUNT(*) AS orders'])
                .groupBy('hour')
                .orderBy('hour', 'ASC')
                .getRawMany(),
        ]);
        return {
            totalOrders,
            totalRevenue: parseFloat(revenue?.total ?? '0'),
            avgPrepMins: parseFloat(avgPrep?.avgMins ?? '0').toFixed(1),
            topProducts,
            hourlyBreakdown,
        };
    }
    async getDailySales(storeId, tenantId, days) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        return this.orderRepo
            .createQueryBuilder('o')
            .select([
            'DATE(o.createdAt) AS date',
            'COUNT(*) AS orders',
            'SUM(o.total) AS revenue',
        ])
            .where('o.storeId = :storeId AND o.tenantId = :tenantId AND o.createdAt >= :from AND o.status != :cancelled', { storeId, tenantId, from, cancelled: shared_1.OrderStatus.CANCELLED })
            .groupBy('DATE(o.createdAt)')
            .orderBy('date', 'ASC')
            .getRawMany();
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AnalyticsService);
