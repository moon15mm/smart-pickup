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
var WhatsappProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const twilio_1 = require("twilio");
let WhatsappProvider = WhatsappProvider_1 = class WhatsappProvider {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.logger = new common_1.Logger(WhatsappProvider_1.name);
        const sid = config.get('TWILIO_ACCOUNT_SID');
        const token = config.get('TWILIO_AUTH_TOKEN');
        this.from = config.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886');
        if (sid && token)
            this.client = (0, twilio_1.default)(sid, token);
    }
    async send(to, body) {
        if (!this.client) {
            this.logger.debug(`[WhatsApp] To: ${to} | ${body}`);
            return;
        }
        try {
            await this.client.messages.create({
                to: `whatsapp:${to}`,
                from: this.from,
                body,
            });
        }
        catch (err) {
            this.logger.error(`WhatsApp failed to ${to}: ${err}`);
        }
    }
};
exports.WhatsappProvider = WhatsappProvider;
exports.WhatsappProvider = WhatsappProvider = WhatsappProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsappProvider);
