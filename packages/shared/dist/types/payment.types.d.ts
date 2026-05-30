import { PaymentMethod, PaymentStatus } from '../enums';
export interface Payment {
    id: string;
    orderId: string;
    gatewayRef?: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    capturedAt?: string;
    refundedAt?: string;
}
export interface InitiatePaymentDto {
    orderId: string;
    method: PaymentMethod;
    returnUrl: string;
}
export interface PaymentSession {
    sessionId: string;
    paymentUrl: string;
    expiresAt: string;
}
