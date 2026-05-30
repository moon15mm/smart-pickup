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
exports.StoresService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const store_entity_1 = require("../../database/entities/store.entity");
const parking_spot_entity_1 = require("../../database/entities/parking-spot.entity");
let StoresService = class StoresService {
    constructor(storeRepo, spotRepo) {
        this.storeRepo = storeRepo;
        this.spotRepo = spotRepo;
    }
    async findByTenant(tenantId) {
        return this.storeRepo.find({ where: { tenantId, isActive: true } });
    }
    async findById(id) {
        const store = await this.storeRepo.findOne({
            where: { id, isActive: true },
            relations: ['parkingSpots'],
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        return store;
    }
    async findByQr(qrCode) {
        const spot = await this.spotRepo.findOne({
            where: { qrCode, isActive: true },
            relations: ['store'],
        });
        if (!spot)
            throw new common_1.NotFoundException('Invalid QR code');
        return { store: spot.store, spot };
    }
    async create(dto, tenantId) {
        const store = this.storeRepo.create({ ...dto, tenantId });
        return this.storeRepo.save(store);
    }
    async update(id, dto, tenantId) {
        const store = await this.storeRepo.findOne({ where: { id, tenantId } });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        Object.assign(store, dto);
        return this.storeRepo.save(store);
    }
    async createParkingSpots(storeId, dto, tenantId) {
        const store = await this.storeRepo.findOne({ where: { id: storeId, tenantId } });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        const spots = [];
        for (const spotNumber of dto.spotNumbers) {
            const qrCode = `SP-${storeId.slice(0, 8)}-${spotNumber}-${(0, uuid_1.v4)().slice(0, 8)}`;
            const spot = this.spotRepo.create({ storeId, spotNumber, qrCode });
            spots.push(spot);
        }
        await this.spotRepo.save(spots);
        return spots;
    }
    async findSpotsByStore(storeId) {
        return this.spotRepo.find({ where: { storeId, isActive: true }, order: { spotNumber: 'ASC' } });
    }
};
exports.StoresService = StoresService;
exports.StoresService = StoresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(store_entity_1.Store)),
    __param(1, (0, typeorm_1.InjectRepository)(parking_spot_entity_1.ParkingSpot)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], StoresService);
