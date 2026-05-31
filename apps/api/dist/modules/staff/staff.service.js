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
exports.StaffService = exports.CreateStaffDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const staff_entity_1 = require("../../database/entities/staff.entity");
const create_staff_dto_1 = require("./dto/create-staff.dto");
Object.defineProperty(exports, "CreateStaffDto", { enumerable: true, get: function () { return create_staff_dto_1.CreateStaffDto; } });
let StaffService = class StaffService {
    constructor(repo) {
        this.repo = repo;
    }
    async findByStore(storeId, tenantId) {
        return this.repo.find({ where: { storeId, tenantId, isActive: true } });
    }
    async create(dto, tenantId) {
        const staff = this.repo.create({ ...dto, tenantId });
        if (dto.pin)
            staff.pinHash = await bcrypt.hash(dto.pin, 10);
        if (dto.password)
            staff.passwordHash = await bcrypt.hash(dto.password, 10);
        return this.repo.save(staff);
    }
    async deactivate(id, tenantId) {
        const staff = await this.repo.findOne({ where: { id, tenantId } });
        if (!staff)
            throw new common_1.NotFoundException('Staff not found');
        staff.isActive = false;
        await this.repo.save(staff);
    }
    async updateFcmToken(id, fcmToken) {
        await this.repo.update(id, { fcmToken });
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(staff_entity_1.Staff)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StaffService);
