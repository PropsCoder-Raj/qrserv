import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  PaymentMethod,
} from '../../schemas/order.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import { getDateRangeFromQuery } from '../../common/utils/date-range';
import { OrderAnalyticsQueryDto } from './dto/order-analytics-query.dto';

export interface OrderAnalyticsBreakdown {
  count: number;
  percentage: number;
}

export interface OrderAnalyticsResult {
  totalOrders: number;
  cash: OrderAnalyticsBreakdown;
  card: OrderAnalyticsBreakdown;
  others: OrderAnalyticsBreakdown;
  filters: {
    restaurantId: string | null;
    startDate: string | null;
    endDate: string | null;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
  ) {}

  private toPercentage(count: number, total: number): number {
    if (!total) return 0;
    return Math.round((count / total) * 10000) / 100;
  }

  private buildResult(
    counts: Record<string, number>,
    restaurantId: string | null,
    query: OrderAnalyticsQueryDto,
  ): OrderAnalyticsResult {
    const cashCount = counts[PaymentMethod.CASH] || 0;
    const cardCount = counts[PaymentMethod.CARD] || 0;
    const totalOrders = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0,
    );
    const othersCount = totalOrders - cashCount - cardCount;

    return {
      totalOrders,
      cash: {
        count: cashCount,
        percentage: this.toPercentage(cashCount, totalOrders),
      },
      card: {
        count: cardCount,
        percentage: this.toPercentage(cardCount, totalOrders),
      },
      others: {
        count: othersCount,
        percentage: this.toPercentage(othersCount, totalOrders),
      },
      filters: {
        restaurantId: restaurantId || null,
        startDate: query.start_date || null,
        endDate: query.end_date || null,
      },
    };
  }

  private async getBreakdown(match: Record<string, unknown>) {
    const rows = await this.orderModel.aggregate([
      { $match: match },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
    ]);

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});
  }

  private buildMatch(
    query: OrderAnalyticsQueryDto,
    restaurantScope?: Types.ObjectId | Types.ObjectId[],
  ) {
    const match: Record<string, unknown> = {};

    if (Array.isArray(restaurantScope)) {
      match.restaurantId = { $in: restaurantScope };
    } else if (restaurantScope) {
      match.restaurantId = restaurantScope;
    }

    const range = getDateRangeFromQuery({
      datePreset: query.datePreset,
      fromDate: query.start_date,
      toDate: query.end_date,
    });
    if (range) {
      match.createdAt = { $gte: range.from, $lte: range.to };
    }

    return match;
  }

  /** Super admin: optionally scoped to a single restaurant, otherwise all restaurants. */
  async getForSuperAdmin(query: OrderAnalyticsQueryDto) {
    const restaurantScope = query.restaurant_id
      ? new Types.ObjectId(query.restaurant_id)
      : undefined;
    const match = this.buildMatch(query, restaurantScope);
    const counts = await this.getBreakdown(match);
    return this.buildResult(counts, query.restaurant_id || null, query);
  }

  /** Org admin: scoped to restaurants under their organization (optionally narrowed to one). */
  async getForOrganization(
    organizationId: string,
    query: OrderAnalyticsQueryDto,
  ) {
    let restaurantScope: Types.ObjectId | Types.ObjectId[];

    if (query.restaurant_id) {
      restaurantScope = new Types.ObjectId(query.restaurant_id);
    } else {
      const orgRestaurants = await this.restaurantModel
        .find({ organizationId: new Types.ObjectId(organizationId) })
        .select('_id')
        .exec();
      restaurantScope = orgRestaurants.map((r) => r._id as Types.ObjectId);
    }

    const match = this.buildMatch(query, restaurantScope);
    const counts = await this.getBreakdown(match);
    return this.buildResult(counts, query.restaurant_id || null, query);
  }

  /** Restaurant owner (and other restaurant-scoped roles): locked to their own restaurant. */
  async getForRestaurant(restaurantId: string, query: OrderAnalyticsQueryDto) {
    const match = this.buildMatch(query, new Types.ObjectId(restaurantId));
    const counts = await this.getBreakdown(match);
    return this.buildResult(counts, restaurantId, query);
  }
}
