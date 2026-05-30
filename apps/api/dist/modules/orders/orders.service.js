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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shared_1 = require("@smart-pickup/shared");
const order_entity_1 = require("../../database/entities/order.entity");
const order_item_entity_1 = require("../../database/entities/order-item.entity");
const customer_entity_1 = require("../../database/entities/customer.entity");
const customer_vehicle_entity_1 = require("../../database/entities/customer-vehicle.entity");
const parking_spot_entity_1 = require("../../database/entities/parking-spot.entity");
const product_entity_1 = require("../../database/entities/product.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const orders_gateway_1 = require("../realtime/orders.gateway");
const ai_cart_service_1 = require("./ai-cart.service");
const TAX_RATE = 0.15;
let OrdersService = class OrdersService {
    constructor(orderRepo, itemRepo, customerRepo, vehicleRepo, spotRepo, productRepo, notifications, gateway, aiCart, dataSource) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.customerRepo = customerRepo;
        this.vehicleRepo = vehicleRepo;
        this.spotRepo = spotRepo;
        this.productRepo = productRepo;
        this.notifications = notifications;
        this.gateway = gateway;
        this.aiCart = aiCart;
        this.dataSource = dataSource;
    }
    async create(dto, storeId, tenantId) {
        return this.dataSource.transaction(async (manager) => {
            let customer = await manager.findOne(customer_entity_1.Customer, {
                where: { mobile: dto.customer.mobile },
                relations: ['vehicles'],
            });
            if (!customer) {
                customer = manager.create(customer_entity_1.Customer, {
                    mobile: dto.customer.mobile,
                    fullName: dto.customer.fullName,
                });
                await manager.save(customer);
            }
            else if (dto.customer.fullName && !customer.fullName) {
                customer.fullName = dto.customer.fullName;
                await manager.save(customer);
            }
            let vehicle = null;
            if (dto.customer.vehicle) {
                vehicle = manager.create(customer_vehicle_entity_1.CustomerVehicle, {
                    customerId: customer.id,
                    ...dto.customer.vehicle,
                    isDefault: true,
                });
                await manager.save(vehicle);
            }
            let spot = null;
            if (dto.parkingSpotId) {
                spot = await manager.findOne(parking_spot_entity_1.ParkingSpot, { where: { id: dto.parkingSpotId } });
            }
            let items = [];
            let subtotal = 0;
            if (dto.type === shared_1.OrderType.FREE_TEXT && dto.rawRequest) {
                const parsed = await this.aiCart.parseShoppingList(dto.rawRequest, storeId);
                items = parsed.map((p) => ({
                    productId: p.productId ?? null,
                    nameSnapshot: p.name,
                    nameArSnapshot: p.nameAr,
                    priceSnapshot: p.price,
                    quantity: p.quantity,
                }));
                subtotal = items.reduce((s, i) => s + (i.priceSnapshot * i.quantity), 0);
            }
            else if (dto.items?.length) {
                for (const dtoItem of dto.items) {
                    let name = dtoItem.nameSnapshot;
                    let nameAr = dtoItem.nameArSnapshot ?? dtoItem.nameSnapshot;
                    let price = dtoItem.priceSnapshot;
                    if (dtoItem.productId) {
                        const product = await manager.findOne(product_entity_1.Product, { where: { id: dtoItem.productId } });
                        if (product) {
                            name = product.name;
                            nameAr = product.nameAr;
                            price = product.salePrice ?? product.price;
                            product.stockQuantity = Math.max(0, product.stockQuantity - dtoItem.quantity);
                            await manager.save(product);
                        }
                    }
                    subtotal += price * dtoItem.quantity;
                    items.push({
                        productId: dtoItem.productId ?? null,
                        nameSnapshot: name,
                        nameArSnapshot: nameAr,
                        priceSnapshot: price,
                        quantity: dtoItem.quantity,
                        notes: dtoItem.notes,
                    });
                }
            }
            const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
            const total = parseFloat((subtotal + tax).toFixed(2));
            const order = manager.create(order_entity_1.Order, {
                tenantId,
                storeId,
                customerId: customer.id,
                vehicleId: vehicle?.id ?? null,
                parkingSpotId: spot?.id ?? null,
                orderNumber: this.generateOrderNumber(),
                type: dto.type,
                status: shared_1.OrderStatus.NEW,
                paymentMethod: dto.paymentMethod,
                notes: dto.notes,
                rawRequest: dto.rawRequest,
                subtotal,
                tax,
                total,
            });
            await manager.save(order);
            const savedItems = items.map((i) => manager.create(order_item_entity_1.OrderItem, { ...i, orderId: order.id }));
            await manager.save(savedItems);
            const fullOrder = await manager.findOne(order_entity_1.Order, {
                where: { id: order.id },
                relations: ['items', 'customer', 'vehicle', 'parkingSpot'],
            });
            this.gateway.emitToStore(storeId, shared_1.WsEvent.ORDER_CREATED, fullOrder);
            await this.notifications.sendOrderStatus(fullOrder, customer);
            return fullOrder;
        });
    }
    async updateStatus(orderId, dto, staffId, tenantId) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, tenantId },
            relations: ['customer', 'items', 'parkingSpot', 'vehicle'],
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        this.validateStatusTransition(order.status, dto.status);
        order.status = dto.status;
        order.assignedStaffId = staffId;
        if (dto.estimatedMins)
            order.estimatedMins = dto.estimatedMins;
        if (dto.status === shared_1.OrderStatus.DELIVERED)
            order.deliveredAt = new Date();
        await this.orderRepo.save(order);
        this.gateway.emitToStore(order.storeId, shared_1.WsEvent.ORDER_STATUS_UPDATED, {
            orderId: order.id,
            status: order.status,
            estimatedMins: order.estimatedMins,
        });
        this.gateway.emitToCustomer(order.customerId, shared_1.WsEvent.ORDER_STATUS_UPDATED, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            estimatedMins: order.estimatedMins,
        });
        await this.notifications.sendOrderStatus(order, order.customer);
        return order;
    }
    async findByStore(storeId, tenantId, query) {
        const qb = this.orderRepo
            .createQueryBuilder('order')
            .where('order.storeId = :storeId AND order.tenantId = :tenantId', { storeId, tenantId })
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.vehicle', 'vehicle')
            .leftJoinAndSelect('order.parkingSpot', 'parkingSpot')
            .leftJoinAndSelect('order.items', 'items')
            .orderBy('order.createdAt', 'DESC');
        if (query.status)
            qb.andWhere('order.status = :status', { status: query.status });
        if (query.date) {
            const d = new Date(query.date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            qb.andWhere('order.createdAt >= :d AND order.createdAt < :next', { d, next });
        }
        const limit = parseInt(query.limit ?? '50', 10);
        const offset = parseInt(query.offset ?? '0', 10);
        qb.take(limit).skip(offset);
        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }
    async findById(orderId) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'customer', 'vehicle', 'parkingSpot', 'payments'],
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    validateStatusTransition(current, next) {
        const allowed = {
            [shared_1.OrderStatus.NEW]: [shared_1.OrderStatus.ACCEPTED, shared_1.OrderStatus.CANCELLED],
            [shared_1.OrderStatus.ACCEPTED]: [shared_1.OrderStatus.PREPARING, shared_1.OrderStatus.CANCELLED],
            [shared_1.OrderStatus.PREPARING]: [shared_1.OrderStatus.READY],
            [shared_1.OrderStatus.READY]: [shared_1.OrderStatus.DELIVERED],
            [shared_1.OrderStatus.DELIVERED]: [],
            [shared_1.OrderStatus.CANCELLED]: [],
        };
        if (!allowed[current].includes(next)) {
            throw new common_1.BadRequestException(`Cannot transition from ${current} to ${next}`);
        }
    }
    generateOrderNumber() {
        const ts = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `SP-${ts}${rand}`.substring(0, 12);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(3, (0, typeorm_1.InjectRepository)(customer_vehicle_entity_1.CustomerVehicle)),
    __param(4, (0, typeorm_1.InjectRepository)(parking_spot_entity_1.ParkingSpot)),
    __param(5, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        orders_gateway_1.OrdersGateway,
        ai_cart_service_1.AiCartService,
        typeorm_2.DataSource])
], OrdersService);
