import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OrderCreatedEvent,
  OrderEvent,
  OrderPaymentStatusChangedEvent,
  OrderStatusChangedEvent,
  OrderUpdatedEvent,
} from '../order-events';
import { PaymentStatus } from '../../../schemas/order.schema';
import { OrderStatisticsService } from '../../../modules/order-statistics/order-statistics.service';
import { OrdersGateway } from '../../websocket/orders.gateway';

// Central place to react to order/payment status changes emitted across the app.
@Injectable()
export class OrderEventsListener {
  private readonly logger = new Logger(OrderEventsListener.name);

  constructor(
    private readonly orderStatisticsService: OrderStatisticsService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  @OnEvent(OrderEvent.CREATED)
  async handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Order ${event.orderId} created`);

    try {
      await this.orderStatisticsService.handleOrderCreated(
        event.orgId,
        event.restaurantId,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to update order statistics for order ${event.orderId}`,
        err?.stack,
      );
    }

    try {
      this.ordersGateway.emitNewOrder(event.restaurantId, {
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        totalAmount: event.totalAmount,
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to push order:new notification for order ${event.orderId}`,
        err?.stack,
      );
    }
  }

  @OnEvent(OrderEvent.STATUS_CHANGED)
  async handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    this.logger.log(
      `Order ${event.orderId} status changed: ${event.previousStatus} -> ${event.newStatus}`,
    );

    try {
      await this.orderStatisticsService.updateOrderStatistics(
        event.orgId,
        event.restaurantId,
        event.newStatus,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to update order statistics for order ${event.orderId}`,
        err?.stack,
      );
    }

    try {
      this.ordersGateway.emitOrderUpdated(event.restaurantId, {
        orderId: event.orderId,
        status: event.newStatus,
        previousStatus: event.previousStatus,
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to push order:updated notification for order ${event.orderId}`,
        err?.stack,
      );
    }
  }

  @OnEvent(OrderEvent.PAYMENT_STATUS_CHANGED)
  async handlePaymentStatusChanged(event: OrderPaymentStatusChangedEvent) {
    this.logger.log(
      `Order ${event.orderId} payment status changed: ${event.previousStatus} -> ${event.newStatus}`,
    );

    const isPaid =
      String(event.newStatus).toLowerCase() ===
      PaymentStatus.PAID.toLowerCase();

    if (isPaid && event.orgId) {
      try {
        await this.orderStatisticsService.updateOrderStatistics(
          event.orgId,
          event.restaurantId,
          event.newStatus,
          event.totalAmount,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to update order statistics for order ${event.orderId}`,
          err?.stack,
        );
      }
    }

    try {
      this.ordersGateway.emitOrderUpdated(event.restaurantId, {
        orderId: event.orderId,
        paymentStatus: event.newStatus,
        previousStatus: event.previousStatus,
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to push order:updated notification for order ${event.orderId}`,
        err?.stack,
      );
    }
  }

  @OnEvent(OrderEvent.UPDATED)
  handleOrderUpdated(event: OrderUpdatedEvent) {
    this.logger.log(`Order ${event.orderId} updated event received`);

    try {
      this.ordersGateway.emitOrderUpdated(event.restaurantId, {
        orderId: event.orderId,
        ...(event.payload || {}),
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to push order:updated notification for order ${event.orderId}`,
        err?.stack,
      );
    }
  }
}
