import { StoreCategory, TenantPlan, TenantStatus } from '../enums';
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: TenantPlan;
    status: TenantStatus;
    settings: TenantSettings;
    createdAt: string;
}
export interface TenantSettings {
    primaryColor?: string;
    logoUrl?: string;
    defaultLanguage?: 'ar' | 'en';
    enableAiCart?: boolean;
    enableWhatsapp?: boolean;
    maxBranches?: number;
}
export interface Store {
    id: string;
    tenantId: string;
    name: string;
    nameAr: string;
    category: StoreCategory;
    address?: string;
    lat?: number;
    lng?: number;
    geofenceRadius: number;
    logoUrl?: string;
    coverUrl?: string;
    operatingHours: OperatingHours;
    isActive: boolean;
}
export interface OperatingHours {
    [day: string]: {
        open: string;
        close: string;
        closed?: boolean;
    };
}
export interface ParkingSpot {
    id: string;
    storeId: string;
    spotNumber: string;
    qrCode: string;
    nfcTagId?: string;
    isActive: boolean;
}
