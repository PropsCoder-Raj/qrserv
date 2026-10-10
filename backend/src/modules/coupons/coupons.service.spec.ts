import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CouponDiscountType } from '../../schemas/coupon.schema';
import { CouponsService } from './coupons.service';

describe('CouponsService', () => {
  const restaurantId = new Types.ObjectId().toString();
  const coupon = {
    _id: new Types.ObjectId(),
    code: 'SAVE10',
    restaurantId: new Types.ObjectId(restaurantId),
    discountType: CouponDiscountType.PERCENTAGE,
    discountValue: 10,
    minOrderAmount: 100,
    maxDiscount: 50,
    startAt: new Date(Date.now() - 60_000),
    expiresAt: new Date(Date.now() + 60_000),
    usageLimit: 5,
    usageCount: 1,
    isActive: true,
  };

  const createService = (couponValue: any = coupon, menuItems: any[] = []) => {
    const couponModel = { findOne: jest.fn().mockResolvedValue(couponValue) };
    const couponUsageModel = {};
    const menuItemModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(menuItems),
      }),
    };
    const restaurantModel = {};
    return {
      service: new CouponsService(
        couponModel as any,
        couponUsageModel as any,
        menuItemModel as any,
        restaurantModel as any,
      ),
      couponModel,
      menuItemModel,
    };
  };

  it('caps a percentage discount at the configured maximum', async () => {
    const { service } = createService();

    const result = await service.validateCoupon(restaurantId, ' save10 ', 1000);

    expect(result.discountAmount).toBe(50);
    expect(result.coupon.code).toBe('SAVE10');
  });

  it('rejects a coupon when the minimum order is not met', async () => {
    const { service } = createService();

    await expect(
      service.validateCoupon(restaurantId, 'SAVE10', 99),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a coupon after its usage limit is reached', async () => {
    const { service } = createService({ ...coupon, usageCount: 5 });

    await expect(
      service.validateCoupon(restaurantId, 'SAVE10', 500),
    ).rejects.toThrow('Coupon usage limit reached');
  });

  it('uses stored menu prices and item types instead of cart values', async () => {
    const menuItemId = new Types.ObjectId();
    const storedItem = {
      _id: menuItemId,
      name: 'Stored name',
      price: 125,
      itemType: 'liquor',
    };
    const { service, menuItemModel } = createService(null, [storedItem]);

    const items = await service.priceOrderItems(restaurantId, [
      {
        menuItemId: menuItemId.toString(),
        quantity: 2,
        name: 'Forged name',
        price: 1,
        itemType: 'food',
      } as any,
    ]);

    expect(menuItemModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: expect.any(Types.ObjectId),
        isAvailable: true,
      }),
    );
    expect(items[0]).toMatchObject({
      name: 'Stored name',
      price: 125,
      quantity: 2,
      itemType: 'liquor',
    });
  });
});
