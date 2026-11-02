import { Types } from 'mongoose';
import { AnalyticsService } from './analytics.service';
import { PaymentMethod } from '../../schemas/order.schema';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockOrderModel: any;
  let mockRestaurantModel: any;

  beforeEach(() => {
    mockOrderModel = {
      aggregate: jest.fn(),
      find: jest.fn(),
    };
    mockRestaurantModel = {
      find: jest.fn(),
    };
    service = new AnalyticsService(
      mockOrderModel as any,
      mockRestaurantModel as any,
    );
  });

  it('computes KPIs, status distribution, order trends, and recent orders correctly', async () => {
    // Current period mock
    const currentSummary = {
      totalOrders: 10,
      grossRevenue: 500,
      cashCount: 5,
      cardCount: 3,
      onlineCount: 2,
      completedCount: 8,
      fulfilledRevenue: 420,
      pendingCount: 1,
      activeValue: 50,
      cancelledCount: 1,
      lossValue: 30,
    };

    // Mock aggregate calls:
    // 1. Current period aggregateKpis
    // 2. Previous period aggregateKpis
    // 3. Status distribution
    // 4. Order trends
    // 5. Fulfillment distribution
    mockOrderModel.aggregate
      .mockResolvedValueOnce([currentSummary]) // current period kpis
      .mockResolvedValueOnce([
        {
          totalOrders: 8,
          grossRevenue: 400,
          completedCount: 6,
          fulfilledRevenue: 300,
          pendingCount: 1,
          activeValue: 40,
          cancelledCount: 1,
          lossValue: 60,
        },
      ]) // previous period kpis
      .mockResolvedValueOnce([
        { _id: 'completed', count: 8, revenue: 420 },
        { _id: 'pending', count: 1, revenue: 50 },
        { _id: 'cancelled', count: 1, revenue: 30 },
      ]) // status distribution
      .mockResolvedValueOnce([
        {
          _id: '2026-11-01',
          totalOrders: 10,
          completedOrders: 8,
          pendingOrders: 1,
          cancelledOrders: 1,
          revenue: 420,
        },
      ]) // order trends
      .mockResolvedValueOnce([
        { _id: 'takeaway', count: 6 },
        { _id: 'dine_in', count: 4 },
      ]); // fulfillment

    // Mock find for recent orders
    mockOrderModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([
                  {
                    _id: new Types.ObjectId(),
                    orderNumber: 'ORD-001',
                    createdAt: new Date('2026-11-01T10:00:00Z'),
                    status: 'completed',
                    orderType: 'takeaway',
                    paymentStatus: 'paid',
                    paymentMethod: PaymentMethod.CASH,
                    totalAmount: 100,
                    customerName: 'Alice',
                    customerPhone: '1234567890',
                    restaurantId: { name: 'Burger Bistro' },
                    tableId: null,
                    items: [{ name: 'Burger', quantity: 2 }],
                  },
                ]),
              }),
            }),
          }),
        }),
      }),
    });

    const result = await service.getForSuperAdmin({
      datePreset: 'thisMonth',
      payment_status: 'all',
      fulfillment_method: 'all',
    });

    // Check backward compatibility
    expect(result.totalOrders).toBe(10);
    expect(result.cash.count).toBe(5);
    expect(result.card.count).toBe(3);
    expect(result.online.count).toBe(2);

    // Check KPIs
    expect(result.kpis.totalOrders.count).toBe(10);
    expect(result.kpis.totalOrders.grossRevenue).toBe(500);
    expect(result.kpis.totalOrders.previousCount).toBe(8);
    // (10 - 8) / 8 = +25%
    expect(result.kpis.totalOrders.percentageChange).toBe(25);
    expect(result.kpis.totalOrders.trend).toBe('up');

    expect(result.kpis.completedOrders.count).toBe(8);
    expect(result.kpis.completedOrders.fulfillmentRate).toBe(80); // 8/10 = 80%

    expect(result.kpis.cancelledOrders.count).toBe(1);
    expect(result.kpis.cancelledOrders.cancellationRate).toBe(10); // 1/10 = 10%

    // Check status distribution
    expect(result.statusDistribution).toHaveLength(3);
    expect(result.statusDistribution[0].status).toBe('completed');
    expect(result.statusDistribution[0].color).toBe('#10B981');

    // Check fulfillment distribution
    expect(result.fulfillmentDistribution).toHaveLength(2);

    // Check recent orders
    expect(result.recentOrders).toHaveLength(1);
    expect(result.recentOrders[0].orderNumber).toBe('ORD-001');
    expect(result.recentOrders[0].restaurantName).toBe('Burger Bistro');
  });
});
