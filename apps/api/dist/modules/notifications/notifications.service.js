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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@smart-pickup/shared");
const sms_provider_1 = require("./providers/sms.provider");
const whatsapp_provider_1 = require("./providers/whatsapp.provider");
const TEMPLATES = {
    [shared_1.OrderStatus.NEW]: {
        ar: 'تم استلام طلبك رقم {{orderNumber}} بنجاح. سنبدأ التحضير قريباً.',
        en: 'Order {{orderNumber}} received. We will start preparing it shortly.',
    },
    [shared_1.OrderStatus.ACCEPTED]: {
        ar: 'تم قبول طلبك {{orderNumber}} وسيتم التحضير الآن.',
        en: 'Order {{orderNumber}} accepted and being prepared now.',
    },
    [shared_1.OrderStatus.PREPARING]: {
        ar: 'جاري تحضير طلبك {{orderNumber}}. الوقت المتوقع: {{estimatedMins}} دقيقة.',
        en: 'Preparing your order {{orderNumber}}. ETA: {{estimatedMins}} minutes.',
    },
    [shared_1.OrderStatus.READY]: {
        ar: 'طلبك {{orderNumber}} جاهز! سنوصله إلى سيارتك الآن.',
        en: 'Order {{orderNumber}} is ready! Bringing it to your car now.',
    },
    [shared_1.OrderStatus.DELIVERED]: {
        ar: 'تم توصيل طلبك {{orderNumber}}. شكراً لك!',
        en: 'Order {{orderNumber}} delivered. Thank you!',
    },
    [shared_1.OrderStatus.CANCELLED]: {
        ar: 'تم إلغاء طلبك {{orderNumber}}.',
        en: 'Order {{orderNumber}} has been cancelled.',
    },
};
let NotificationsService = class NotificationsService {
    constructor(sms, whatsapp) {
        this.sms = sms;
        this.whatsapp = whatsapp;
    }
    async sendOrderStatus(order, customer) {
        const template = TEMPLATES[order.status];
        if (!template)
            return;
        const lang = customer.preferredLang ?? 'ar';
        const text = (lang === 'ar' ? template.ar : template.en)
            .replace('{{orderNumber}}', order.orderNumber)
            .replace('{{estimatedMins}}', String(order.estimatedMins ?? 10));
        await Promise.allSettled([
            this.sms.send(customer.mobile, text),
            [shared_1.OrderStatus.READY, shared_1.OrderStatus.DELIVERED].includes(order.status)
                ? this.whatsapp.send(customer.mobile, text)
                : Promise.resolve(),
        ]);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sms_provider_1.SmsProvider,
        whatsapp_provider_1.WhatsappProvider])
], NotificationsService);
