import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { RestaurantsService } from './restaurants.service';
import { RestaurantType } from '../../schemas/restaurant.schema';

describe('RestaurantsService - Optional CR Number and Invoice Header Note', () => {
  const organizationId = new Types.ObjectId().toString();
  const ownerId = new Types.ObjectId().toString();
  const restaurantId = new Types.ObjectId().toString();

  const mockOrg = {
    _id: new Types.ObjectId(organizationId),
    name: 'Test Org',
    subscriptionPlan: {
      maxRestaurants: 10,
      isPaymentGatewayAllocated: false,
      isMenuPdfEnabled: false,
    },
    subscriptionExpiry: new Date(Date.now() + 86400000),
    isActive: true,
  };

  const createService = () => {
    const restaurantModel: any = {
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((doc) =>
        Promise.resolve({ _id: restaurantId, ...doc }),
      ),
    };

    const organizationModel: any = {
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrg),
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOrg),
          }),
        }),
      }),
    };

    const service = new RestaurantsService(
      restaurantModel as any,
      organizationModel as any,
    );

    return { service, restaurantModel, organizationModel };
  };

  describe('create restaurant', () => {
    it('creates restaurant successfully without CR number or header note (optional)', async () => {
      const { service, restaurantModel } = createService();

      const dto: any = {
        name: 'Curry House',
        owner_name: 'John Doe',
        restaurant_type: RestaurantType.DINING,
        address: '123 Baker Street, London',
        organizationId,
      };

      const result = await service.create(dto, ownerId);

      expect(restaurantModel.create).toHaveBeenCalled();
      expect(result.name).toBe('Curry House');
      expect(result.cr_number).toBeUndefined();
    });

    it('creates restaurant successfully with optional CR number and header note', async () => {
      const { service, restaurantModel } = createService();

      const dto: any = {
        name: 'Grand Restaurant',
        owner_name: 'Ahmed',
        restaurant_type: RestaurantType.DINING,
        address: 'Downtown Avenue',
        cr_number: '1002345678',
        receipt_header_note: 'TRN: 100203040500003 | Authentic Cuisine | Welcome!',
        organizationId,
      };

      const result = await service.create(dto, ownerId);

      expect(restaurantModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cr_number: '1002345678',
          receipt_header_note:
            'TRN: 100203040500003 | Authentic Cuisine | Welcome!',
        }),
      );
      expect(result.cr_number).toBe('1002345678');
      expect(result.receipt_header_note).toBe(
        'TRN: 100203040500003 | Authentic Cuisine | Welcome!',
      );
    });
  });

  describe('update restaurant', () => {
    it('updates CR number and header note successfully', async () => {
      const { service, restaurantModel } = createService();

      const updated = {
        _id: restaurantId,
        name: 'Grand Restaurant',
        cr_number: '1002345678',
        receipt_header_note: 'Updated Subtitle Note',
      };
      restaurantModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.update(restaurantId, {
        cr_number: '1002345678',
        receipt_header_note: 'Updated Subtitle Note',
      });

      expect(restaurantModel.findByIdAndUpdate).toHaveBeenCalledWith(
        restaurantId,
        {
          cr_number: '1002345678',
          receipt_header_note: 'Updated Subtitle Note',
        },
        { new: true },
      );
      expect(result.cr_number).toBe('1002345678');
      expect(result.receipt_header_note).toBe('Updated Subtitle Note');
    });

    it('throws NotFoundException if restaurant does not exist on update', async () => {
      const { service, restaurantModel } = createService();
      restaurantModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { cr_number: '123' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicInfo', () => {
    it('includes cr_number and receipt_header_note in public info', async () => {
      const { service, restaurantModel } = createService();

      const restaurantDoc = {
        _id: restaurantId,
        name: 'Dubai Bistro',
        logo: 'logo.png',
        address: 'Dubai Marina',
        phone: '+971 4 1234567',
        email: 'info@dubaibistro.ae',
        gst_no: '',
        vat_no: 'VAT999',
        cr_number: '1002345678',
        receipt_header_note: 'TRN: 100203040500003 | Welcome!',
        taxEnabled: false,
        taxRate: 0,
        taxType: 'inclusive',
        vatEnabled: true,
        vatRate: 5,
        vatType: 'inclusive',
        menuPdf: '',
        organizationId: new Types.ObjectId(organizationId),
        isActive: true,
        toObject: () => ({
          _id: restaurantId,
          name: 'Dubai Bistro',
          logo: 'logo.png',
          address: 'Dubai Marina',
          phone: '+971 4 1234567',
          email: 'info@dubaibistro.ae',
          gst_no: '',
          vat_no: 'VAT999',
          cr_number: '1002345678',
          receipt_header_note: 'TRN: 100203040500003 | Welcome!',
          taxEnabled: false,
          taxRate: 0,
          taxType: 'inclusive',
          vatEnabled: true,
          vatRate: 5,
          vatType: 'inclusive',
          menuPdf: '',
          organizationId: new Types.ObjectId(organizationId),
          isActive: true,
        }),
      };

      restaurantModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(restaurantDoc),
      });

      const info = await service.getPublicInfo(restaurantId);

      expect(info.cr_number).toBe('1002345678');
      expect(info.receipt_header_note).toBe('TRN: 100203040500003 | Welcome!');
    });
  });
});
