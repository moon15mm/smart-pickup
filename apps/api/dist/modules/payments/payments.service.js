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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const payment_entity_1 = require("../../database/entities/payment.entity");
const order_entity_1 = require("../../database/entities/order.entity");
const shared_1 = require("@smart-pickup/shared");
let PaymentsService = class PaymentsService {
    constructor(paymentRepo, orderRepo, config) {
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.config = config;
    }
    async initiatePayment(orderId, method, returnUrl) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.paymentStatus === shared_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Order already paid');
        }
        if (method === shared_1.PaymentMethod.CASH) {
            const payment = this.paymentRepo.create({
                orderId,
                amount: order.total,
                currency: 'SAR',
                method,
                status: shared_1.PaymentStatus.PENDING,
            });
            await this.paymentRepo.save(payment);
            return { method: 'cash', message: 'Pay on delivery' };
        }
        const sessionId = `mock_${Date.now()}`;
        const payment = this.paymentRepo.create({
            orderId,
            gatewayRef: sessionId,
            amount: order.total,
            currency: 'SAR',
            method,
            status: shared_1.PaymentStatus.PENDING,
            metadata: { returnUrl },
        });
        await this.paymentRepo.save(payment);
        return {
            sessionId,
            paymentUrl: `https://checkout.com/pay/${sessionId}`,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
    }
    async handleWebhook(payload) {
        const { id: gatewayRef, status, metadata } = payload;
        const payment = await this.paymentRepo.findOne({ where: { gatewayRef } });
        if (!payment)
            return;
        if (status === 'Captured') {
            payment.status = shared_1.PaymentStatus.PAID;
            payment.capturedAt = new Date();
            await this.paymentRepo.save(payment);
            await this.orderRepo.update(payment.orderId, { paymentStatus: shared_1.PaymentStatus.PAID });
        }
        else if (status === 'Declined' || status === 'Failed') {
            payment.status = shared_1.PaymentStatus.FAILED;
            await this.paymentRepo.save(payment);
        }
    }
    async refund(paymentId) {
        const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.status !== shared_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Payment is not captured');
        }
        payment.status = shared_1.PaymentStatus.REFUNDED;
        payment.refundedAt = new Date();
        await this.paymentRepo.save(payment);
        await this.orderRepo.update(payment.orderId, { paymentStatus: shared_1.PaymentStatus.REFUNDED });
        return payment;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], PaymentsService);
