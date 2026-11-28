import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Types } from 'mongoose';
import { Role } from '../../common/decorators';
import {
  DesignBorderRadius,
  DesignButtonStyle,
  DesignFontFamily,
  DesignItemViewMode,
  StoreTheme,
} from '../../schemas/store-design.schema';
import { DEFAULT_CLASSIC_CONFIG } from './design.constants';
import { DesignService } from './design.service';
import { UpdateStoreDesignDto } from './dto/update-store-design.dto';

describe('DesignService', () => {
  const restaurantId = new Types.ObjectId().toString();
  const organizationId = new Types.ObjectId().toString();
  const ownerId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  const createService = () => {
    const storeDesignModel: any = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const restaurantModel: any = {
      exists: jest.fn().mockResolvedValue({ _id: restaurantId }),
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(restaurantId),
          ownerId: new Types.ObjectId(ownerId),
          organizationId: new Types.ObjectId(organizationId),
        }),
      }),
    };

    const service = new DesignService(storeDesignModel, restaurantModel);
    return { service, storeDesignModel, restaurantModel };
  };

  describe('getDesign', () => {
    it('throws BadRequestException for invalid restaurantId', async () => {
      const { service } = createService();
      await expect(service.getDesign('not-an-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when restaurant does not exist', async () => {
      const { service, restaurantModel } = createService();
      restaurantModel.exists.mockResolvedValueOnce(null);

      await expect(service.getDesign(restaurantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns default Classic config when no StoreDesign exists', async () => {
      const { service, storeDesignModel } = createService();
      storeDesignModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getDesign(restaurantId);

      expect(result.restaurantId).toBe(restaurantId);
      expect(result.activeTheme).toBe(StoreTheme.CLASSIC);
      expect(result.isDefault).toBe(true);
      expect(result.classicConfig).toEqual(DEFAULT_CLASSIC_CONFIG);
    });

    it('merges partial saved config with fallback defaults', async () => {
      const { service, storeDesignModel } = createService();
      storeDesignModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          restaurantId: new Types.ObjectId(restaurantId),
          activeTheme: StoreTheme.CLASSIC,
          classicConfig: {
            colors: { primary: '#123456' },
            layout: { itemViewMode: DesignItemViewMode.GRID },
          },
        }),
      });

      const result = await service.getDesign(restaurantId);

      expect(result.isDefault).toBe(false);
      expect(result.classicConfig.colors.primary).toBe('#123456');
      expect(result.classicConfig.colors.surface).toBe(
        DEFAULT_CLASSIC_CONFIG.colors.surface,
      );
      expect(result.classicConfig.layout.itemViewMode).toBe(
        DesignItemViewMode.GRID,
      );
      expect(result.classicConfig.layout.showBanner).toBe(true);
    });
  });

  describe('upsertDesign', () => {
    it('forbids org_admin from updating another organization restaurant', async () => {
      const { service } = createService();
      await expect(
        service.upsertDesign(
          restaurantId,
          { classicConfig: { colors: { primary: '#111111' } } },
          {
            userId,
            role: Role.ORG_ADMIN,
            organizationId: new Types.ObjectId().toString(),
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('forbids restaurant_owner from updating a different restaurant', async () => {
      const { service } = createService();
      await expect(
        service.upsertDesign(
          restaurantId,
          { classicConfig: { colors: { primary: '#111111' } } },
          {
            userId: new Types.ObjectId().toString(),
            role: Role.RESTAURANT_OWNER,
            restaurantId: new Types.ObjectId().toString(),
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('upserts merged classicConfig for authorized owner', async () => {
      const { service, storeDesignModel } = createService();
      storeDesignModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          activeTheme: StoreTheme.CLASSIC,
          classicConfig: {
            colors: { primary: '#E11D48', secondary: '#FB7185' },
          },
        }),
      });
      storeDesignModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockImplementation(async () => ({
          restaurantId: new Types.ObjectId(restaurantId),
          activeTheme: StoreTheme.CLASSIC,
          classicConfig: {
            ...DEFAULT_CLASSIC_CONFIG,
            colors: { ...DEFAULT_CLASSIC_CONFIG.colors, primary: '#2563EB' },
            shape: {
              borderRadius: DesignBorderRadius.ROUNDED,
              buttonStyle: DesignButtonStyle.PILL,
            },
          },
          updatedBy: new Types.ObjectId(ownerId),
        })),
      });

      const result = await service.upsertDesign(
        restaurantId,
        {
          classicConfig: {
            colors: { primary: '#2563EB' },
            shape: {
              borderRadius: DesignBorderRadius.ROUNDED,
              buttonStyle: DesignButtonStyle.PILL,
            },
          },
        },
        {
          userId: ownerId,
          role: Role.RESTAURANT_OWNER,
          restaurantId,
        },
      );

      expect(storeDesignModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result.classicConfig.colors.primary).toBe('#2563EB');
      expect(result.classicConfig.shape.buttonStyle).toBe(
        DesignButtonStyle.PILL,
      );
      expect(result.isDefault).toBe(false);
    });
  });

  describe('resetDesign', () => {
    it('resets configuration back to Classic defaults', async () => {
      const { service, storeDesignModel } = createService();
      storeDesignModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          restaurantId: new Types.ObjectId(restaurantId),
          activeTheme: StoreTheme.CLASSIC,
          classicConfig: DEFAULT_CLASSIC_CONFIG,
          updatedBy: new Types.ObjectId(userId),
        }),
      });

      const result = await service.resetDesign(restaurantId, {
        userId,
        role: Role.SUPER_ADMIN,
      });

      expect(result.activeTheme).toBe(StoreTheme.CLASSIC);
      expect(result.classicConfig).toEqual(DEFAULT_CLASSIC_CONFIG);
    });
  });

  describe('UpdateStoreDesignDto validation', () => {
    it('rejects invalid hex color and invalid font enum', async () => {
      const dto = plainToInstance(UpdateStoreDesignDto, {
        classicConfig: {
          colors: { primary: 'red' },
          typography: { fontFamily: 'Comic Sans' },
        },
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts valid classicConfig payload', async () => {
      const dto = plainToInstance(UpdateStoreDesignDto, {
        activeTheme: StoreTheme.CLASSIC,
        classicConfig: {
          colors: {
            primary: '#E11D48',
            secondary: '#FB7185',
            background: '#FAF8F5',
            surface: '#FFFFFF',
            textPrimary: '#1E293B',
            textMuted: '#64748B',
          },
          typography: { fontFamily: DesignFontFamily.POPPINS },
          shape: {
            borderRadius: DesignBorderRadius.ROUNDED,
            buttonStyle: DesignButtonStyle.OUTLINE,
          },
          layout: {
            showBanner: false,
            showLogo: true,
            itemViewMode: DesignItemViewMode.GRID,
            showDietaryBadges: true,
            showDescriptions: false,
          },
        },
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
