import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OrderCreatedEvent,
  OrderEvent,
  OrderPaymentStatusChangedEvent,
  OrderStatusChangedEvent,
  OrderUpdatedEvent,
  WaiterCalledEvent,
} from '../order-events';
import { OrderStatus } from '../../../schemas/order.schema';
import { OrderStatisticsService } from '../../../modules/order-statistics/order-statistics.service';
import { FcmService } from '../../../modules/notifications/fcm.service';
import { OrdersGateway } from '../../websocket/orders.gateway';

// Central place to react to order/payment status changes emitted across the app.
@Injectable()
export class OrderEventsListener {
  private readonly logger = new Logger(OrderEventsListener.name);

  constructor(
    private readonly orderStatisticsService: OrderStatisticsService,
    private readonly ordersGateway: OrdersGateway,
    private readonly fcmService: FcmService,
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

    await this.safeNotifyStaff(() =>
      this.fcmService.notifyStaff({
        type: 'order',
        title: 'New order',
        body: event.orderNumber
          ? `Order #${event.orderNumber} received`
          : 'A new order was received',
        restaurantId: event.restaurantId,
        orderId: event.orderId,
      }),
    );
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
        event.totalAmount,
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

    if (event.newStatus === OrderStatus.READY) {
      const label = event.orderNumber ? `#${event.orderNumber}` : event.orderId;
      try {
        this.ordersGateway.emitKitchenAlert(event.restaurantId, {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          status: event.newStatus,
          message: `Order ${label} is ready to serve`,
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to push kitchen:alert for order ${event.orderId}`,
          err?.stack,
        );
      }

      await this.safeNotifyStaff(() =>
        this.fcmService.notifyStaff({
          type: 'kitchen',
          title: 'Order ready',
          body: `Order ${label} is ready to serve`,
          restaurantId: event.restaurantId,
          orderId: event.orderId,
        }),
      );
    }
  }

  @OnEvent(OrderEvent.PAYMENT_STATUS_CHANGED)
  async handlePaymentStatusChanged(event: OrderPaymentStatusChangedEvent) {
    this.logger.log(
      `Order ${event.orderId} payment status changed: ${event.previousStatus} -> ${event.newStatus}`,
    );

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

  @OnEvent(OrderEvent.WAITER_CALLED)
  async handleWaiterCalled(event: WaiterCalledEvent) {
    this.logger.log(
      `Waiter called for table ${event.tableNumber} (restaurant ${event.restaurantId})`,
    );

    try {
      this.ordersGateway.emitWaiterCall(event.restaurantId, {
        tableId: event.tableId,
        tableNumber: event.tableNumber,
        message: `Table ${event.tableNumber} needs a waiter`,
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to push waiter:call for table ${event.tableId}`,
        err?.stack,
      );
    }

    await this.safeNotifyStaff(() =>
      this.fcmService.notifyStaff({
        type: 'waiter_call',
        title: 'Waiter requested',
        body: `Table ${event.tableNumber} needs a waiter`,
        restaurantId: event.restaurantId,
        tableId: event.tableId,
      }),
    );
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

  // Push delivery is best-effort; a failed FCM send must not block socket delivery.
  private async safeNotifyStaff(send: () => Promise<void>) {
    try {
      await send();
    } catch (err: any) {
      this.logger.error(`FCM notification failed: ${err?.message}`, err?.stack);
    }
  }
}
