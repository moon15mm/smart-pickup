import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '../enums';
export interface OrderItem {
    id: string;
    productId: string | null;
    nameSnapshot: string;
    nameArSnapshot: string;
    priceSnapshot: number;
    quantity: number;
    notes?: string;
}
export interface Order {
    id: string;
    tenantId: string;
    storeId: string;
    customerId: string;
    vehicleId?: string;
    parkingSpotId?: string;
    orderNumber: string;
    type: OrderType;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    rawRequest?: string;
    aiParsed?: unknown;
    estimatedMins?: number;
    items: OrderItem[];
    createdAt: string;
    deliveredAt?: string;
}
export interface CreateOrderDto {
    storeId: string;
    parkingSpotId?: string;
    type: OrderType;
    paymentMethod: PaymentMethod;
    notes?: string;
    rawRequest?: string;
    items?: Array<{
        productId?: string;
        nameSnapshot: string;
        priceSnapshot: number;
        quantity: number;
        notes?: string;
    }>;
    customer: {
        fullName: string;
        mobile: string;
        vehicle?: {
            make: string;
            model: string;
            color: string;
            plateNumber: string;
        };
    };
}
export interface UpdateOrderStatusDto {
    status: OrderStatus;
    estimatedMins?: number;
}
