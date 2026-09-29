import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { OrderStatisticsService } from './order-statistics.service';
import { OrderStatistics } from '../../schemas/order-statistics.schema';
import { OrderStatus } from '../../schemas/order.schema';

const ORG_1 = '507f1f77bcf86cd799439011';
const ORG_2 = '507f1f77bcf86cd799439012';
const RESTAURANT_1 = '507f1f77bcf86cd799439021';
const RESTAURANT_2 = '507f1f77bcf86cd799439022';

const filterFor = (orgId: string, restaurantId: string) => ({
  orgId: new Types.ObjectId(orgId),
  restaurantId: new Types.ObjectId(restaurantId),
});

describe('OrderStatisticsService', () => {
  let service: OrderStatisticsService;
  let findOneAndUpdateMock: jest.Mock;
  let updateOneMock: jest.Mock;
  let updateManyMock: jest.Mock;

  beforeEach(async () => {
    findOneAndUpdateMock = jest.fn().mockResolvedValue({});
    updateOneMock = jest.fn().mockResolvedValue({});
    updateManyMock = jest.fn().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStatisticsService,
        {
          provide: getModelToken(OrderStatistics.name),
          useValue: {
            findOneAndUpdate: findOneAndUpdateMock,
            updateOne: updateOneMock,
            updateMany: updateManyMock,
          },
        },
      ],
    }).compile();

    service = module.get<OrderStatisticsService>(OrderStatisticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('order creation', () => {
    it('creates a new record with pendingOrderCount = 1 for the first order', async () => {
      await service.handleOrderCreated(ORG_1, RESTAURANT_1);

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        filterFor(ORG_1, RESTAURANT_1),
        {
          $inc: { pendingOrderCount: 1 },
          $setOnInsert: filterFor(ORG_1, RESTAURANT_1),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    });

    it('increments pendingOrderCount for every subsequent order created', async () => {
      await service.handleOrderCreated(ORG_1, RESTAURANT_1);
      await service.handleOrderCreated(ORG_1, RESTAURANT_1);
      await service.handleOrderCreated(ORG_1, RESTAURANT_1);

      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(3);
      findOneAndUpdateMock.mock.calls.forEach((call) => {
        expect(call[1]).toEqual(
          expect.objectContaining({ $inc: { pendingOrderCount: 1 } }),
        );
      });
    });

    it('does not require a separate PENDING status event to count the order', async () => {
      await service.handleOrderCreated(ORG_1, RESTAURANT_1);

      // handleOrderCreated alone must be enough - updateOrderStatistics for
      // PENDING was never called, yet the counter above was still incremented.
      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('status updates', () => {
    it.each([
      [OrderStatus.PENDING, 'pendingOrderCount'],
      [OrderStatus.CONFIRMED, 'confirmedOrderCount'],
      [OrderStatus.PREPARING, 'preparingOrderCount'],
      [OrderStatus.READY, 'readyOrderCount'],
      [OrderStatus.SERVED, 'servedOrderCount'],
      [OrderStatus.CANCELLED, 'cancelledOrderCount'],
    ])('increments %s -> %s', async (status, counterField) => {
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        status as OrderStatus,
      );

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        filterFor(ORG_1, RESTAURANT_1),
        {
          $inc: { [counterField]: 1 },
          $setOnInsert: filterFor(ORG_1, RESTAURANT_1),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    });

    it('only touches the counter matching each transition, never a previous one', async () => {
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        OrderStatus.CONFIRMED,
      );
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        OrderStatus.PREPARING,
      );
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        OrderStatus.READY,
      );
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        OrderStatus.SERVED,
      );

      expect(findOneAndUpdateMock).toHaveBeenNthCalledWith(
        1,
        filterFor(ORG_1, RESTAURANT_1),
        expect.objectContaining({ $inc: { confirmedOrderCount: 1 } }),
        expect.any(Object),
      );
      expect(findOneAndUpdateMock).toHaveBeenNthCalledWith(
        2,
        filterFor(ORG_1, RESTAURANT_1),
        expect.objectContaining({ $inc: { preparingOrderCount: 1 } }),
        expect.any(Object),
      );
      expect(findOneAndUpdateMock).toHaveBeenNthCalledWith(
        3,
        filterFor(ORG_1, RESTAURANT_1),
        expect.objectContaining({ $inc: { readyOrderCount: 1 } }),
        expect.any(Object),
      );
      expect(findOneAndUpdateMock).toHaveBeenNthCalledWith(
        4,
        filterFor(ORG_1, RESTAURANT_1),
        expect.objectContaining({ $inc: { servedOrderCount: 1 } }),
        expect.any(Object),
      );
    });
  });

  describe('totalOrderAmount on SERVED', () => {
    it('adds the order totalAmount to totalOrderAmount when status is SERVED', async () => {
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        OrderStatus.SERVED,
        250.5,
      );

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        filterFor(ORG_1, RESTAURANT_1),
        {
          $inc: { servedOrderCount: 1, totalOrderAmount: 250.5 },
          $setOnInsert: filterFor(ORG_1, RESTAURANT_1),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    });

    it('does not touch totalOrderAmount for non-SERVED statuses even with a totalAmount', async () => {
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        OrderStatus.CONFIRMED,
        250.5,
      );

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        filterFor(ORG_1, RESTAURANT_1),
        {
          $inc: { confirmedOrderCount: 1 },
          $setOnInsert: filterFor(ORG_1, RESTAURANT_1),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    });

    it('does not add totalOrderAmount when SERVED arrives without a totalAmount', async () => {
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        OrderStatus.SERVED,
      );

      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        filterFor(ORG_1, RESTAURANT_1),
        {
          $inc: { servedOrderCount: 1 },
          $setOnInsert: filterFor(ORG_1, RESTAURANT_1),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    });
  });

  describe('organization/restaurant isolation', () => {
    it('keeps separate statistics records per orgId + restaurantId combination', async () => {
      await service.handleOrderCreated(ORG_1, RESTAURANT_1);
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_2,
        OrderStatus.CONFIRMED,
      );
      await service.updateOrderStatistics(
        ORG_2,
        RESTAURANT_1,
        OrderStatus.CONFIRMED,
      );

      expect(findOneAndUpdateMock).toHaveBeenNthCalledWith(
        1,
        filterFor(ORG_1, RESTAURANT_1),
        expect.objectContaining({
          $setOnInsert: filterFor(ORG_1, RESTAURANT_1),
        }),
        expect.any(Object),
      );
      expect(findOneAndUpdateMock).toHaveBeenNthCalledWith(
        2,
        filterFor(ORG_1, RESTAURANT_2),
        expect.objectContaining({
          $setOnInsert: filterFor(ORG_1, RESTAURANT_2),
        }),
        expect.any(Object),
      );
      expect(findOneAndUpdateMock).toHaveBeenNthCalledWith(
        3,
        filterFor(ORG_2, RESTAURANT_1),
        expect.objectContaining({
          $setOnInsert: filterFor(ORG_2, RESTAURANT_1),
        }),
        expect.any(Object),
      );
    });
  });

  describe('existing record', () => {
    it('increments the counter on the existing record without creating a duplicate', async () => {
      await service.updateOrderStatistics(
        ORG_1,
        RESTAURANT_1,
        OrderStatus.CANCELLED,
      );

      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1);
      expect(findOneAndUpdateMock).toHaveBeenCalledWith(
        filterFor(ORG_1, RESTAURANT_1),
        expect.objectContaining({
          $inc: { cancelledOrderCount: 1 },
          $setOnInsert: filterFor(ORG_1, RESTAURANT_1),
        }),
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    });
  });

  describe('missing/invalid orgId or restaurantId', () => {
    it('skips the update and does not call the database', async () => {
      await service.updateOrderStatistics('', RESTAURANT_1, OrderStatus.PENDING);
      await service.updateOrderStatistics(ORG_1, '', OrderStatus.PENDING);
      await service.handleOrderCreated('', RESTAURANT_1);
      await service.handleOrderCreated(ORG_1, '');

      expect(findOneAndUpdateMock).not.toHaveBeenCalled();
    });

    it('skips the update when orgId or restaurantId is not a valid ObjectId', async () => {
      await service.updateOrderStatistics(
        'not-an-object-id',
        RESTAURANT_1,
        OrderStatus.PENDING,
      );
      await service.updateOrderStatistics(
        ORG_1,
        'not-an-object-id',
        OrderStatus.PENDING,
      );

      expect(findOneAndUpdateMock).not.toHaveBeenCalled();
    });
  });

  describe('concurrency', () => {
    it('falls back to a plain $inc when concurrent upserts race and hit the unique index', async () => {
      const duplicateKeyError: any = new Error('duplicate key');
      duplicateKeyError.code = 11000;
      findOneAndUpdateMock.mockRejectedValueOnce(duplicateKeyError);

      await service.handleOrderCreated(ORG_1, RESTAURANT_1);

      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1);
      expect(updateOneMock).toHaveBeenCalledWith(
        filterFor(ORG_1, RESTAURANT_1),
        { $inc: { pendingOrderCount: 1 } },
      );
    });

    it('processes concurrent order creation and status events without lost increments', async () => {
      await Promise.all([
        service.handleOrderCreated(ORG_1, RESTAURANT_1),
        service.handleOrderCreated(ORG_1, RESTAURANT_1),
        service.updateOrderStatistics(
          ORG_1,
          RESTAURANT_1,
          OrderStatus.CONFIRMED,
        ),
        service.updateOrderStatistics(
          ORG_1,
          RESTAURANT_1,
          OrderStatus.CANCELLED,
        ),
      ]);

      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(4);
    });

    it('rethrows unexpected errors after logging', async () => {
      const unexpectedError = new Error('connection lost');
      findOneAndUpdateMock.mockRejectedValueOnce(unexpectedError);

      await expect(
        service.updateOrderStatistics(
          ORG_1,
          RESTAURANT_1,
          OrderStatus.PENDING,
        ),
      ).rejects.toThrow('connection lost');
    });
  });

  describe('reset', () => {
    it('resets every restaurant under the organization to 0', async () => {
      await service.resetForOrganization(ORG_1);

      expect(updateManyMock).toHaveBeenCalledWith(
        { orgId: new Types.ObjectId(ORG_1) },
        {
          $set: {
            pendingOrderCount: 0,
            confirmedOrderCount: 0,
            preparingOrderCount: 0,
            readyOrderCount: 0,
            servedOrderCount: 0,
            cancelledOrderCount: 0,
            totalOrderAmount: 0,
          },
        },
      );
    });

    it('resets only the given org + restaurant record to 0', async () => {
      await service.resetForRestaurant(ORG_1, RESTAURANT_1);

      expect(updateOneMock).toHaveBeenCalledWith(
        filterFor(ORG_1, RESTAURANT_1),
        {
          $set: {
            pendingOrderCount: 0,
            confirmedOrderCount: 0,
            preparingOrderCount: 0,
            readyOrderCount: 0,
            servedOrderCount: 0,
            cancelledOrderCount: 0,
            totalOrderAmount: 0,
          },
        },
      );
    });

    it('skips resetForOrganization when orgId is missing/invalid', async () => {
      await service.resetForOrganization('');
      await service.resetForOrganization('not-an-object-id');

      expect(updateManyMock).not.toHaveBeenCalled();
    });

    it('skips resetForRestaurant when orgId or restaurantId is missing/invalid', async () => {
      await service.resetForRestaurant('', RESTAURANT_1);
      await service.resetForRestaurant(ORG_1, '');

      expect(updateOneMock).not.toHaveBeenCalled();
    });
  });
});

