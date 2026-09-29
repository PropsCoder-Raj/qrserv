import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OrderStatistics,
  OrderStatisticsDocument,
} from '../../schemas/order-statistics.schema';
import { OrderStatus } from '../../schemas/order.schema';

type CounterField =
  | 'pendingOrderCount'
  | 'confirmedOrderCount'
  | 'preparingOrderCount'
  | 'readyOrderCount'
  | 'servedOrderCount'
  | 'cancelledOrderCount';

const STATUS_COUNTER_MAP: Record<OrderStatus, CounterField> = {
  [OrderStatus.PENDING]: 'pendingOrderCount',
  [OrderStatus.CONFIRMED]: 'confirmedOrderCount',
  [OrderStatus.PREPARING]: 'preparingOrderCount',
  [OrderStatus.READY]: 'readyOrderCount',
  [OrderStatus.SERVED]: 'servedOrderCount',
  [OrderStatus.CANCELLED]: 'cancelledOrderCount',
};

const ZERO_COUNTERS: Record<CounterField | 'totalOrderAmount', number> = {
  pendingOrderCount: 0,
  confirmedOrderCount: 0,
  preparingOrderCount: 0,
  readyOrderCount: 0,
  servedOrderCount: 0,
  cancelledOrderCount: 0,
  totalOrderAmount: 0,
};

@Injectable()
export class OrderStatisticsService {
  private readonly logger = new Logger(OrderStatisticsService.name);

  constructor(
    @InjectModel(OrderStatistics.name)
    private orderStatisticsModel: Model<OrderStatisticsDocument>,
  ) {}

  /**
   * Called once, right after an order is created. A new order always starts
   * as PENDING, and this is the only place that counts it — the status
   * listener never sees a PENDING transition, since orders are created
   * directly in that state instead of moving into it.
   */
  async handleOrderCreated(
    orgId: string | Types.ObjectId,
    restaurantId: string | Types.ObjectId,
  ): Promise<void> {
    await this.incrementCounters(orgId, restaurantId, {
      pendingOrderCount: 1,
    });
  }

  /**
   * Increments the counter matching a real order status transition.
   * The listener only calls this when the status actually changed, so each
   * transition is counted exactly once.
   *
   * When the order reaches SERVED, its totalAmount is also added to
   * totalOrderAmount in the same atomic update.
   */
  async updateOrderStatistics(
    orgId: string | Types.ObjectId,
    restaurantId: string | Types.ObjectId,
    status: OrderStatus,
    totalAmount?: number,
  ): Promise<void> {
    const counterField = STATUS_COUNTER_MAP[status];
    if (!counterField) {
      return;
    }

    const inc: Partial<Record<CounterField | 'totalOrderAmount', number>> = {
      [counterField]: 1,
    };
    if (status === OrderStatus.SERVED && Number(totalAmount) > 0) {
      inc.totalOrderAmount = Number(totalAmount);
    }

    await this.incrementCounters(orgId, restaurantId, inc);
  }

  private async incrementCounters(
    orgId: string | Types.ObjectId,
    restaurantId: string | Types.ObjectId,
    inc: Partial<Record<CounterField | 'totalOrderAmount', number>>,
  ) {
    if (
      !orgId ||
      !restaurantId ||
      !Types.ObjectId.isValid(orgId) ||
      !Types.ObjectId.isValid(restaurantId)
    ) {
      this.logger.warn(
        `Skipping order statistics update: missing/invalid orgId or restaurantId for fields "${Object.keys(inc).join(', ')}"`,
      );
      return;
    }

    const orgObjectId = new Types.ObjectId(orgId);
    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const filter = { orgId: orgObjectId, restaurantId: restaurantObjectId };

    try {
      await this.orderStatisticsModel.findOneAndUpdate(
        filter,
        {
          $inc: inc,
          $setOnInsert: filter,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (err: any) {
      // Concurrent first-time upserts for the same org/restaurant can race
      // past the upsert and hit the unique index; retry as a plain increment.
      if (err?.code === 11000) {
        try {
          await this.orderStatisticsModel.updateOne(filter, { $inc: inc });
          return;
        } catch (retryErr: any) {
          this.logger.error(
            `Retry failed while updating order statistics for org ${orgObjectId} / restaurant ${restaurantObjectId}`,
            retryErr?.stack,
          );
          throw retryErr;
        }
      }

      this.logger.error(
        `Failed to update order statistics for org ${orgObjectId} / restaurant ${restaurantObjectId}`,
        err?.stack,
      );
      throw err;
    }
  }

  async findByOrgAndRestaurant(
    orgId: string | Types.ObjectId,
    restaurantId: string | Types.ObjectId,
  ): Promise<OrderStatisticsDocument | null> {
    return this.orderStatisticsModel
      .findOne({
        orgId: new Types.ObjectId(orgId),
        restaurantId: new Types.ObjectId(restaurantId),
      })
      .lean();
  }

  /**
   * Sums servedOrderCount/totalOrderAmount across all statistics records
   * matching the given restaurant scope (a single restaurantId, a list of
   * restaurantIds, or no filter at all for an all-restaurants total).
   */
  async getServedTotals(
    restaurantId?: string | Types.ObjectId | (string | Types.ObjectId)[],
  ): Promise<{ servedOrderCount: number; totalOrderAmount: number }> {
    const match: Record<string, unknown> = {};
    if (Array.isArray(restaurantId)) {
      if (restaurantId.length) {
        match.restaurantId = {
          $in: restaurantId.map((id) => new Types.ObjectId(id)),
        };
      }
    } else if (restaurantId) {
      match.restaurantId = new Types.ObjectId(restaurantId);
    }

    const [totals] = await this.orderStatisticsModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          servedOrderCount: { $sum: '$servedOrderCount' },
          totalOrderAmount: { $sum: '$totalOrderAmount' },
        },
      },
    ]);

    return {
      servedOrderCount: totals?.servedOrderCount || 0,
      totalOrderAmount: totals?.totalOrderAmount || 0,
    };
  }

  /**
   * Resets every counter (and totalOrderAmount) to 0 for every restaurant
   * belonging to the given organization.
   */
  async resetForOrganization(orgId: string | Types.ObjectId): Promise<void> {
    if (!orgId || !Types.ObjectId.isValid(orgId)) {
      this.logger.warn(
        'Skipping order statistics reset: missing/invalid orgId',
      );
      return;
    }

    await this.orderStatisticsModel.updateMany(
      { orgId: new Types.ObjectId(orgId) },
      { $set: ZERO_COUNTERS },
    );
  }

  /**
   * Resets every counter (and totalOrderAmount) to 0 for a single
   * organization + restaurant statistics record.
   */
  async resetForRestaurant(
    orgId: string | Types.ObjectId,
    restaurantId: string | Types.ObjectId,
  ): Promise<void> {
    if (
      !orgId ||
      !restaurantId ||
      !Types.ObjectId.isValid(orgId) ||
      !Types.ObjectId.isValid(restaurantId)
    ) {
      this.logger.warn(
        'Skipping order statistics reset: missing/invalid orgId or restaurantId',
      );
      return;
    }

    await this.orderStatisticsModel.updateOne(
      {
        orgId: new Types.ObjectId(orgId),
        restaurantId: new Types.ObjectId(restaurantId),
      },
      { $set: ZERO_COUNTERS },
    );
  }
}
