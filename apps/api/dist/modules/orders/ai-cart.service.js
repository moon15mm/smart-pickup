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
exports.AiCartService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const openai_1 = require("openai");
const product_entity_1 = require("../../database/entities/product.entity");
let AiCartService = class AiCartService {
    constructor(config, productRepo) {
        this.config = config;
        this.productRepo = productRepo;
        this.openai = new openai_1.default({ apiKey: config.get('OPENAI_API_KEY') });
    }
    async parseShoppingList(rawText, storeId) {
        const systemPrompt = `You are a shopping list parser for a Gulf retail store.
Extract items from the customer's text. Return JSON array with:
[{"name": "English name", "nameAr": "اسم عربي", "quantity": 1, "unit": "pcs"}]
Only return valid JSON, nothing else.`;
        let parsed = [];
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: rawText },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });
            const content = completion.choices[0]?.message?.content ?? '{"items":[]}';
            const result = JSON.parse(content);
            parsed = result.items ?? result ?? [];
        }
        catch {
            parsed = rawText
                .split(/[\n,،]/g)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => ({
                name: line,
                nameAr: line,
                quantity: 1,
            }));
        }
        const result = [];
        for (const item of parsed) {
            const product = await this.productRepo.findOne({
                where: [
                    { storeId, name: (0, typeorm_2.ILike)(`%${item.name}%`) },
                    { storeId, nameAr: (0, typeorm_2.ILike)(`%${item.nameAr}%`) },
                ],
            });
            result.push({
                name: product?.name ?? item.name,
                nameAr: product?.nameAr ?? item.nameAr,
                quantity: item.quantity ?? 1,
                price: product ? (product.salePrice ?? product.price) : 0,
                productId: product?.id,
                confidence: product ? 0.9 : 0.5,
            });
        }
        return result;
    }
};
exports.AiCartService = AiCartService;
exports.AiCartService = AiCartService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], AiCartService);
