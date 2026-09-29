import { Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from '../../schemas/order.schema';

export enum OrderEvent {
  CREATED = 'order.created',
  STATUS_CHANGED = 'order.status.changed',
  PAYMENT_STATUS_CHANGED = 'order.payment-status.changed',
}

export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly restaurantId: string,
    public readonly orgId: string | Types.ObjectId,
    public readonly orderNumber?: string,
    public readonly totalAmount?: number,
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly restaurantId: string,
    public readonly previousStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
    public readonly orgId?: string | Types.ObjectId,
    public readonly totalAmount?: number,
  ) {}
}

export class OrderPaymentStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly restaurantId: string,
    public readonly previousStatus: PaymentStatus,
    public readonly newStatus: PaymentStatus,
  ) {}
}
