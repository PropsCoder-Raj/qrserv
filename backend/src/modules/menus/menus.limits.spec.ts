import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
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

  describe('image removal and cleanup', () => {
    it('should remove image and unlink file when remove_image is true in updateMenuItem', async () => {
      const mockExisting = {
        _id: 'item1',
        restaurantId: 'r1',
        name: 'Burger',
        image: '/uploads/menu_items/item1.png',
      };
      const mockUpdated = {
        ...mockExisting,
        image: null,
      };

      const removeFileSpy = jest.fn().mockResolvedValue(undefined);
      const cleanupSpy = jest.fn().mockResolvedValue(undefined);

      const service = {
        menuItemModel: {
          findById: jest.fn().mockResolvedValue(mockExisting),
          findByIdAndUpdate: jest.fn().mockResolvedValue(mockUpdated),
        },
        cacheService: {
          delByPrefix: jest.fn(),
        },
        validatePriceDrop: jest.fn(),
        getMenuItemUploadsDir: jest.fn().mockResolvedValue('/tmp/uploads'),
        removeMenuItemImageFile: removeFileSpy,
        cleanupOrphanFilesByPrefix: cleanupSpy,
        updateMenuItem: (MenusService.prototype as any).updateMenuItem,
      } as any;

      const result = await service.updateMenuItem.call(service, 'item1', {
        remove_image: true,
      });

      expect(removeFileSpy).toHaveBeenCalledWith('/uploads/menu_items/item1.png');
      expect(cleanupSpy).toHaveBeenCalledWith('/tmp/uploads', 'item1');
      expect(service.menuItemModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'item1',
        expect.objectContaining({ image: null }),
        { new: true },
      );
      expect(service.cacheService.delByPrefix).toHaveBeenCalledWith('menu:r1');
      expect(result.image).toBeNull();
    });

    it('should remove image and unlink file when removeMenuItemImage is called', async () => {
      const mockExisting = {
        _id: 'item1',
        restaurantId: 'r1',
        name: 'Burger',
        image: '/uploads/menu_items/item1.png',
        save: jest.fn().mockResolvedValue(true),
      };

      const removeFileSpy = jest.fn().mockResolvedValue(undefined);
      const cleanupSpy = jest.fn().mockResolvedValue(undefined);

      const service = {
        menuItemModel: {
          findById: jest.fn().mockResolvedValue(mockExisting),
        },
        cacheService: {
          delByPrefix: jest.fn(),
        },
        getMenuItemUploadsDir: jest.fn().mockResolvedValue('/tmp/uploads'),
        removeMenuItemImageFile: removeFileSpy,
        cleanupOrphanFilesByPrefix: cleanupSpy,
        removeMenuItemImage: (MenusService.prototype as any).removeMenuItemImage,
      } as any;

      const result = await service.removeMenuItemImage.call(service, 'item1');

      expect(removeFileSpy).toHaveBeenCalledWith('/uploads/menu_items/item1.png');
      expect(cleanupSpy).toHaveBeenCalledWith('/tmp/uploads', 'item1');
      expect(mockExisting.image).toBeNull();
      expect(mockExisting.save).toHaveBeenCalled();
      expect(service.cacheService.delByPrefix).toHaveBeenCalledWith('menu:r1');
      expect(result).toEqual({
        message: 'Menu item image removed successfully',
        image: null,
      });
    });

    it('should retain image when remove_image is not provided in updateMenuItem', async () => {
      const mockExisting = {
        _id: 'item1',
        restaurantId: 'r1',
        name: 'Burger',
        image: '/uploads/menu_items/item1.png',
      };
      const mockUpdated = {
        ...mockExisting,
        name: 'Cheeseburger',
      };

      const removeFileSpy = jest.fn();

      const service = {
        menuItemModel: {
          findById: jest.fn().mockResolvedValue(mockExisting),
          findByIdAndUpdate: jest.fn().mockResolvedValue(mockUpdated),
        },
        cacheService: {
          delByPrefix: jest.fn(),
        },
        validatePriceDrop: jest.fn(),
        removeMenuItemImageFile: removeFileSpy,
        updateMenuItem: (MenusService.prototype as any).updateMenuItem,
      } as any;

      const result = await service.updateMenuItem.call(service, 'item1', {
        name: 'Cheeseburger',
      });

      expect(removeFileSpy).not.toHaveBeenCalled();
      expect(result.name).toBe('Cheeseburger');
      expect(result.image).toBe('/uploads/menu_items/item1.png');
    });
  });

  describe('validateOrgRestaurant', () => {
    const validRestId = new Types.ObjectId().toString();
    const validOrgId = new Types.ObjectId().toString();
    const otherOrgId = new Types.ObjectId().toString();

    it('should pass when restaurant.organizationId is a string matching organizationId', async () => {
      const service = {
        restaurantModel: {
          findById: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId(validRestId),
              organizationId: validOrgId, // string representation
            }),
          }),
        },
        validateOrgRestaurant: (MenusService.prototype as any).validateOrgRestaurant,
      } as any;

      await expect(
        service.validateOrgRestaurant(validRestId, validOrgId),
      ).resolves.toBeUndefined();
    });

    it('should pass when restaurant.organizationId is an ObjectId matching organizationId', async () => {
      const service = {
        restaurantModel: {
          findById: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId(validRestId),
              organizationId: new Types.ObjectId(validOrgId), // ObjectId representation
            }),
          }),
        },
        validateOrgRestaurant: (MenusService.prototype as any).validateOrgRestaurant,
      } as any;

      await expect(
        service.validateOrgRestaurant(validRestId, validOrgId),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when organizationId does not match', async () => {
      const service = {
        restaurantModel: {
          findById: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              _id: new Types.ObjectId(validRestId),
              organizationId: otherOrgId,
            }),
          }),
        },
        validateOrgRestaurant: (MenusService.prototype as any).validateOrgRestaurant,
      } as any;

      await expect(
        service.validateOrgRestaurant(validRestId, validOrgId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ForbiddenException when restaurant is not found', async () => {
      const service = {
        restaurantModel: {
          findById: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
          }),
        },
        validateOrgRestaurant: (MenusService.prototype as any).validateOrgRestaurant,
      } as any;

      await expect(
        service.validateOrgRestaurant(validRestId, validOrgId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw BadRequestException when IDs are invalid', async () => {
      const service = {
        validateOrgRestaurant: (MenusService.prototype as any).validateOrgRestaurant,
      } as any;

      await expect(
        service.validateOrgRestaurant('invalid', validOrgId),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        service.validateOrgRestaurant(validRestId, 'invalid'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});


