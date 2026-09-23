import { BadRequestException } from '@nestjs/common';
import { MenusService } from './menus.service';

describe('MenusService - subscription limits', () => {
  it('should allow unlimited when plan limit is 0', async () => {
    const service = {
      validateActiveSubscription: jest.fn(),
      enforcePlanLimit: (MenusService.prototype as any).enforcePlanLimit,
      getRestaurantOrgWithPlan: jest.fn().mockResolvedValue({
        subscriptionPlan: { maxCategories: 0 },
      }),
      categoryModel: {
        countDocuments: jest.fn(),
      },
    } as any;

    await service.enforcePlanLimit.call(service, {
      restaurantId: 'r1',
      field: 'maxCategories',
      model: service.categoryModel,
      errorMessage: 'Category limit reached',
    });

    expect(service.categoryModel.countDocuments).not.toHaveBeenCalled();
  });

  it('should throw when currentCount >= limit', async () => {
    const service = {
      enforcePlanLimit: (MenusService.prototype as any).enforcePlanLimit,
      getRestaurantOrgWithPlan: jest.fn().mockResolvedValue({
        subscriptionPlan: { maxMenuItems: 2 },
      }),
      menuItemModel: {
        countDocuments: jest.fn().mockResolvedValue(2),
      },
    } as any;

    await expect(
      service.enforcePlanLimit.call(service, {
        restaurantId: 'r1',
        field: 'maxMenuItems',
        model: service.menuItemModel,
        errorMessage: 'Menu item limit reached for your subscription plan',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(service.menuItemModel.countDocuments).toHaveBeenCalledWith({
      restaurantId: 'r1',
    });
  });
});
