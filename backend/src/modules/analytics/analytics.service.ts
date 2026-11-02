import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  PaymentMethod,
  OrderStatus,
} from '../../schemas/order.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import { getDateRangeFromQuery, DateRange } from '../../common/utils/date-range';
import { OrderAnalyticsQueryDto } from './dto/order-analytics-query.dto';

export interface OrderAnalyticsBreakdown {
  count: number;
  percentage: number;
}

export interface KpiMetric {
  count: number;
  grossRevenue?: number;
  fulfilledRevenue?: number;
  activeValue?: number;
  lossValue?: number;
  fulfillmentRate?: number;
  cancellationRate?: number;
  percentageOfTotal?: number;
  previousCount: number;
  previousGrossRevenue?: number;
  percentageChange: number;
  revenueChange?: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
  revenue: number;
  color: string;
}

export interface OrderTrendItem {
  date: string;
  label: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  revenue: number;
}

export interface RecentOrderSummary {
  _id: string;
  orderNumber: string;
  createdAt: Date;
  status: string;
  orderType: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  tableNumber: string | number | null;
  restaurantName: string | null;
  itemsCount: number;
}

export interface OrderAnalyticsResult {
  // Backward compatibility fields
  totalOrders: number;
  cash: OrderAnalyticsBreakdown;
  card: OrderAnalyticsBreakdown;
  online: OrderAnalyticsBreakdown;
  others: OrderAnalyticsBreakdown;
  filters: {
    restaurantId: string | null;
    startDate: string | null;
    endDate: string | null;
    datePreset?: string | null;
    paymentStatus?: string | null;
    fulfillmentMethod?: string | null;
  };

  // Modern KPIs
  kpis: {
    totalOrders: KpiMetric;
    pendingOrders: KpiMetric;
    completedOrders: KpiMetric;
    cancelledOrders: KpiMetric;
  };

  // Status Distribution for Doughnut/Pie chart
  statusDistribution: StatusDistributionItem[];

  // Order Trends over time for Area/Line chart
  orderTrends: OrderTrendItem[];

  // Distribution by Fulfillment Method
  fulfillmentDistribution: Array<{
    method: string;
    label: string;
    count: number;
    percentage: number;
  }>;

  // Recent 10 orders snapshot
  recentOrders: RecentOrderSummary[];
}

const COMPLETED_STATUSES = ['completed', 'served', 'delivered'];
const PENDING_STATUSES = ['pending', 'confirmed', 'ready', 'preparing'];
const CANCELLED_STATUSES = ['cancelled', 'returned', 'refunded'];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completed', color: '#10B981' },
  served: { label: 'Served', color: '#059669' },
  ready: { label: 'Ready', color: '#8B5CF6' },
  confirmed: { label: 'Confirmed', color: '#3B82F6' },
  pending: { label: 'Pending', color: '#F59E0B' },
  preparing: { label: 'Preparing', color: '#EAB308' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
  refunded: { label: 'Refunded', color: '#DC2626' },
  returned: { label: 'Returned', color: '#B91C1C' },
};

const FULFILLMENT_LABELS: Record<string, string> = {
  dine_in: 'Dine In',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
  ) {}

  private round2(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private toPercentage(count: number, total: number): number {
    if (!total) return 0;
    return Math.round((count / total) * 1000) / 10;
  }

  private calculatePercentageChange(
    current: number,
    previous: number,
  ): { percentageChange: number; trend: 'up' | 'down' | 'neutral' } {
    if (previous === 0) {
      if (current > 0) return { percentageChange: 100, trend: 'up' };
      return { percentageChange: 0, trend: 'neutral' };
    }
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 1000) / 10;
    const trend = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral';
    return { percentageChange: pct, trend };
  }

  private buildMatch(
    query: OrderAnalyticsQueryDto,
    restaurantScope?: Types.ObjectId | Types.ObjectId[],
    overrideDateRange?: DateRange,
  ): { match: Record<string, unknown>; range?: DateRange } {
    const match: Record<string, unknown> = {};

    if (Array.isArray(restaurantScope)) {
      match.restaurantId = { $in: restaurantScope };
    } else if (restaurantScope) {
      match.restaurantId = restaurantScope;
    }

    const range =
      overrideDateRange ||
      getDateRangeFromQuery({
        datePreset: query.datePreset,
        fromDate: query.start_date,
        toDate: query.end_date,
      });

    if (range) {
      match.createdAt = { $gte: range.from, $lte: range.to };
    }

    // Payment status filter
    const paymentStatus = query.payment_status?.trim().toLowerCase();
    if (paymentStatus && paymentStatus !== 'all') {
      if (paymentStatus === 'cod') {
        match.$or = [
          { paymentMethod: PaymentMethod.CASH },
          { paymentMethod: 'cash' },
          { paymentStatus: 'cod' },
        ];
      } else {
        match.paymentStatus = paymentStatus;
      }
    }

    // Fulfillment method filter (or order_type alias)
    const fulfillmentMethod = (query.fulfillment_method || query.order_type)
      ?.trim()
      .toLowerCase();
    if (fulfillmentMethod && fulfillmentMethod !== 'all') {
      match.orderType = fulfillmentMethod;
    }

    return { match, range };
  }

  private async aggregateKpis(match: Record<string, unknown>) {
    const rows = await this.orderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          grossRevenue: { $sum: '$totalAmount' },
          cashCount: {
            $sum: {
              $cond: [{ $in: ['$paymentMethod', [PaymentMethod.CASH, 'cash']] }, 1, 0],
            },
          },
          cardCount: {
            $sum: {
              $cond: [{ $in: ['$paymentMethod', [PaymentMethod.CARD, 'card']] }, 1, 0],
            },
          },
          onlineCount: {
            $sum: {
              $cond: [{ $in: ['$paymentMethod', [PaymentMethod.ONLINE, 'online']] }, 1, 0],
            },
          },
          completedCount: {
            $sum: {
              $cond: [{ $in: ['$status', COMPLETED_STATUSES] }, 1, 0],
            },
          },
          fulfilledRevenue: {
            $sum: {
              $cond: [{ $in: ['$status', COMPLETED_STATUSES] }, '$totalAmount', 0],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [{ $in: ['$status', PENDING_STATUSES] }, 1, 0],
            },
          },
          activeValue: {
            $sum: {
              $cond: [{ $in: ['$status', PENDING_STATUSES] }, '$totalAmount', 0],
            },
          },
          cancelledCount: {
            $sum: {
              $cond: [{ $in: ['$status', CANCELLED_STATUSES] }, 1, 0],
            },
          },
          lossValue: {
            $sum: {
              $cond: [{ $in: ['$status', CANCELLED_STATUSES] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    const data = rows[0] || {};
    return {
      totalOrders: data.totalOrders || 0,
      grossRevenue: this.round2(data.grossRevenue || 0),
      cashCount: data.cashCount || 0,
      cardCount: data.cardCount || 0,
      onlineCount: data.onlineCount || 0,
      completedCount: data.completedCount || 0,
      fulfilledRevenue: this.round2(data.fulfilledRevenue || 0),
      pendingCount: data.pendingCount || 0,
      activeValue: this.round2(data.activeValue || 0),
      cancelledCount: data.cancelledCount || 0,
      lossValue: this.round2(data.lossValue || 0),
    };
  }

  private async getStatusDistribution(
    match: Record<string, unknown>,
    totalOrders: number,
  ): Promise<StatusDistributionItem[]> {
    const rows = await this.orderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return rows.map((row) => {
      const statusKey = String(row._id || 'unknown').toLowerCase();
      const cfg = STATUS_CONFIG[statusKey] || {
        label: statusKey.charAt(0).toUpperCase() + statusKey.slice(1),
        color: '#64748B',
      };
      return {
        status: statusKey,
        label: cfg.label,
        count: row.count,
        percentage: this.toPercentage(row.count, totalOrders),
        revenue: this.round2(row.revenue),
        color: cfg.color,
      };
    });
  }

  private async getFulfillmentDistribution(
    match: Record<string, unknown>,
    totalOrders: number,
  ) {
    const rows = await this.orderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return rows.map((r) => {
      const typeKey = String(r._id || 'dine_in').toLowerCase();
      return {
        method: typeKey,
        label: FULFILLMENT_LABELS[typeKey] || typeKey,
        count: r.count,
        percentage: this.toPercentage(r.count, totalOrders),
      };
    });
  }

  private async getOrderTrends(
    match: Record<string, unknown>,
    range?: DateRange,
  ): Promise<OrderTrendItem[]> {
    const isHourly =
      !!range &&
      range.to.getTime() - range.from.getTime() <= 48 * 3600 * 1000;

    const dateFormat = isHourly ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

    const rows = await this.orderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: {
              $cond: [{ $in: ['$status', COMPLETED_STATUSES] }, 1, 0],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $in: ['$status', PENDING_STATUSES] }, 1, 0],
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $in: ['$status', CANCELLED_STATUSES] }, 1, 0],
            },
          },
          revenue: {
            $sum: {
              $cond: [{ $in: ['$status', COMPLETED_STATUSES] }, '$totalAmount', 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const rowMap = new Map<string, (typeof rows)[0]>();
    rows.forEach((r) => rowMap.set(r._id, r));

    // Zero-fill all intervals within date range
    if (range) {
      const results: OrderTrendItem[] = [];
      const cur = new Date(range.from);
      const MONTH_NAMES = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      if (isHourly) {
        while (cur <= range.to) {
          const yyyy = cur.getFullYear();
          const mm = String(cur.getMonth() + 1).padStart(2, '0');
          const dd = String(cur.getDate()).padStart(2, '0');
          const hh = String(cur.getHours()).padStart(2, '0');
          const key = `${yyyy}-${mm}-${dd} ${hh}:00`;
          const label = `${hh}:00`;

          const row = rowMap.get(key);
          results.push({
            date: key,
            label,
            totalOrders: row?.totalOrders || 0,
            completedOrders: row?.completedOrders || 0,
            pendingOrders: row?.pendingOrders || 0,
            cancelledOrders: row?.cancelledOrders || 0,
            revenue: this.round2(row?.revenue || 0),
          });
          cur.setHours(cur.getHours() + 1);
        }
      } else {
        while (cur <= range.to) {
          const yyyy = cur.getFullYear();
          const mm = String(cur.getMonth() + 1).padStart(2, '0');
          const dd = String(cur.getDate()).padStart(2, '0');
          const key = `${yyyy}-${mm}-${dd}`;
          const label = `${MONTH_NAMES[cur.getMonth()]} ${cur.getDate()}`;

          const row = rowMap.get(key);
          results.push({
            date: key,
            label,
            totalOrders: row?.totalOrders || 0,
            completedOrders: row?.completedOrders || 0,
            pendingOrders: row?.pendingOrders || 0,
            cancelledOrders: row?.cancelledOrders || 0,
            revenue: this.round2(row?.revenue || 0),
          });
          cur.setDate(cur.getDate() + 1);
        }
      }
      return results;
    }

    // If no explicit range, return grouped rows as is
    return rows.map((r) => ({
      date: r._id,
      label: r._id,
      totalOrders: r.totalOrders || 0,
      completedOrders: r.completedOrders || 0,
      pendingOrders: r.pendingOrders || 0,
      cancelledOrders: r.cancelledOrders || 0,
      revenue: this.round2(r.revenue || 0),
    }));
  }

  private async getRecentOrders(
    match: Record<string, unknown>,
  ): Promise<RecentOrderSummary[]> {
    const orders = await this.orderModel
      .find(match)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('restaurantId', 'name')
      .populate('tableId', 'tableNumber')
      .lean()
      .exec();

    return orders.map((o: any) => ({
      _id: o._id.toString(),
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      orderType: o.orderType || 'dine_in',
      paymentStatus: o.paymentStatus || 'pending',
      paymentMethod: o.paymentMethod || 'CASH',
      totalAmount: this.round2(o.totalAmount || 0),
      customerName: o.customerName || 'Guest',
      customerPhone: o.customerPhone || '',
      tableNumber: o.tableId?.tableNumber ?? null,
      restaurantName: o.restaurantId?.name ?? null,
      itemsCount: Array.isArray(o.items) ? o.items.length : 0,
    }));
  }

  private async executeAnalytics(
    query: OrderAnalyticsQueryDto,
    restaurantScope?: Types.ObjectId | Types.ObjectId[],
  ): Promise<OrderAnalyticsResult> {
    const { match, range } = this.buildMatch(query, restaurantScope);

    // Current period metrics
    const current = await this.aggregateKpis(match);

    // Previous period metrics for comparison
    let previous = {
      totalOrders: 0,
      grossRevenue: 0,
      completedCount: 0,
      fulfilledRevenue: 0,
      pendingCount: 0,
      activeValue: 0,
      cancelledCount: 0,
      lossValue: 0,
    };

    if (range) {
      const duration = range.to.getTime() - range.from.getTime();
      const prevTo = new Date(range.from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - duration);
      const { match: prevMatch } = this.buildMatch(query, restaurantScope, {
        from: prevFrom,
        to: prevTo,
      });
      previous = await this.aggregateKpis(prevMatch);
    }

    const totalOrdersChange = this.calculatePercentageChange(
      current.totalOrders,
      previous.totalOrders,
    );
    const revenueChange = this.calculatePercentageChange(
      current.grossRevenue,
      previous.grossRevenue,
    );
    const completedChange = this.calculatePercentageChange(
      current.completedCount,
      previous.completedCount,
    );
    const pendingChange = this.calculatePercentageChange(
      current.pendingCount,
      previous.pendingCount,
    );
    const cancelledChange = this.calculatePercentageChange(
      current.cancelledCount,
      previous.cancelledCount,
    );

    // Parallel sub-queries
    const [statusDistribution, orderTrends, fulfillmentDistribution, recentOrders] =
      await Promise.all([
        this.getStatusDistribution(match, current.totalOrders),
        this.getOrderTrends(match, range),
        this.getFulfillmentDistribution(match, current.totalOrders),
        this.getRecentOrders(match),
      ]);

    // Backward compatibility breakdown
    const othersCount =
      current.totalOrders -
      current.cashCount -
      current.cardCount -
      current.onlineCount;

    return {
      totalOrders: current.totalOrders,
      cash: {
        count: current.cashCount,
        percentage: this.toPercentage(current.cashCount, current.totalOrders),
      },
      card: {
        count: current.cardCount,
        percentage: this.toPercentage(current.cardCount, current.totalOrders),
      },
      online: {
        count: current.onlineCount,
        percentage: this.toPercentage(current.onlineCount, current.totalOrders),
      },
      others: {
        count: Math.max(0, othersCount),
        percentage: this.toPercentage(Math.max(0, othersCount), current.totalOrders),
      },
      filters: {
        restaurantId: query.restaurant_id || null,
        startDate: query.start_date || null,
        endDate: query.end_date || null,
        datePreset: query.datePreset || null,
        paymentStatus: query.payment_status || null,
        fulfillmentMethod: query.fulfillment_method || query.order_type || null,
      },
      kpis: {
        totalOrders: {
          count: current.totalOrders,
          grossRevenue: current.grossRevenue,
          previousCount: previous.totalOrders,
          previousGrossRevenue: previous.grossRevenue,
          percentageChange: totalOrdersChange.percentageChange,
          revenueChange: revenueChange.percentageChange,
          trend: totalOrdersChange.trend,
        },
        pendingOrders: {
          count: current.pendingCount,
          activeValue: current.activeValue,
          percentageOfTotal: this.toPercentage(
            current.pendingCount,
            current.totalOrders,
          ),
          previousCount: previous.pendingCount,
          percentageChange: pendingChange.percentageChange,
          trend: pendingChange.trend,
        },
        completedOrders: {
          count: current.completedCount,
          fulfilledRevenue: current.fulfilledRevenue,
          fulfillmentRate: this.toPercentage(
            current.completedCount,
            current.totalOrders,
          ),
          previousCount: previous.completedCount,
          percentageChange: completedChange.percentageChange,
          trend: completedChange.trend,
        },
        cancelledOrders: {
          count: current.cancelledCount,
          lossValue: current.lossValue,
          cancellationRate: this.toPercentage(
            current.cancelledCount,
            current.totalOrders,
          ),
          previousCount: previous.cancelledCount,
          percentageChange: cancelledChange.percentageChange,
          trend: cancelledChange.trend,
        },
      },
      statusDistribution,
      orderTrends,
      fulfillmentDistribution,
      recentOrders,
    };
  }

  /** Super admin: optionally scoped to a single restaurant, otherwise all restaurants. */
  async getForSuperAdmin(query: OrderAnalyticsQueryDto) {
    const restaurantScope = query.restaurant_id
      ? new Types.ObjectId(query.restaurant_id)
      : undefined;
    return this.executeAnalytics(query, restaurantScope);
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

    return this.executeAnalytics(query, restaurantScope);
  }

  /** Restaurant owner: locked to their own restaurant. */
  async getForRestaurant(restaurantId: string, query: OrderAnalyticsQueryDto) {
    return this.executeAnalytics(query, new Types.ObjectId(restaurantId));
  }
}
