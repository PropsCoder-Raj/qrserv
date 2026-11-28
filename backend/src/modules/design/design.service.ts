import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StoreDesign,
  StoreDesignDocument,
  StoreTheme,
} from '../../schemas/store-design.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import { Role } from '../../common/decorators';
import {
  ClassicConfigShape,
  DEFAULT_ACTIVE_THEME,
  createDefaultClassicConfig,
  mergeClassicConfig,
} from './design.constants';
import { UpdateStoreDesignDto } from './dto/update-store-design.dto';

export interface DesignRequestUser {
  userId?: string;
  role?: string;
  organizationId?: any;
  restaurantId?: any;
}

export interface StoreDesignResponse {
  restaurantId: string;
  activeTheme: StoreTheme;
  classicConfig: ClassicConfigShape;
  isDefault: boolean;
  updatedAt?: Date;
  updatedBy?: string;
}

@Injectable()
export class DesignService {
  constructor(
    @InjectModel(StoreDesign.name)
    private readonly storeDesignModel: Model<StoreDesignDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  private validateObjectId(id: string, label = 'restaurantId'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}`);
    }
    return new Types.ObjectId(id);
  }

  private async ensureRestaurantAccess(
    restaurantId: string,
    user?: DesignRequestUser,
  ): Promise<RestaurantDocument> {
    const restaurantObjectId = this.validateObjectId(restaurantId);
    const restaurant = await this.restaurantModel
      .findById(restaurantObjectId)
      .select('ownerId organizationId');

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (!user) {
      return restaurant;
    }

    if (user.role === Role.ORG_ADMIN) {
      const userOrgId = user.organizationId?.toString?.();
      const restOrgId = restaurant.organizationId?.toString?.();
      if (!userOrgId || !restOrgId || userOrgId !== restOrgId) {
        throw new ForbiddenException(
          'Restaurant does not belong to your organization',
        );
      }
    } else if (user.role === Role.RESTAURANT_OWNER) {
      const userRestId = user.restaurantId?.toString?.();
      const ownerId = restaurant.ownerId?.toString?.();
      const userId = user.userId?.toString?.();
      const ownsByRestaurant = Boolean(userRestId && userRestId === restaurantId);
      const ownsByUser = Boolean(ownerId && userId && ownerId === userId);
      if (!ownsByRestaurant && !ownsByUser) {
        throw new ForbiddenException(
          'You do not have access to customize this restaurant',
        );
      }
    }

    return restaurant;
  }

  private formatDesignResponse(
    restaurantId: string,
    doc?: any | null,
  ): StoreDesignResponse {
    if (!doc) {
      return {
        restaurantId,
        activeTheme: DEFAULT_ACTIVE_THEME,
        classicConfig: createDefaultClassicConfig(),
        isDefault: true,
      };
    }

    return {
      restaurantId: doc.restaurantId?.toString?.() || restaurantId,
      activeTheme: doc.activeTheme || DEFAULT_ACTIVE_THEME,
      classicConfig: mergeClassicConfig(doc.classicConfig),
      isDefault: false,
      updatedAt: doc.updatedAt,
      updatedBy: doc.updatedBy?.toString?.(),
    };
  }

  async getDesign(restaurantId: string): Promise<StoreDesignResponse> {
    const restaurantObjectId = this.validateObjectId(restaurantId);
    const restaurantExists = await this.restaurantModel
      .exists({ _id: restaurantObjectId });
    if (!restaurantExists) {
      throw new NotFoundException('Restaurant not found');
    }

    const design = await this.storeDesignModel
      .findOne({ restaurantId: restaurantObjectId })
      .lean();

    return this.formatDesignResponse(restaurantId, design);
  }

  async upsertDesign(
    restaurantId: string,
    dto: UpdateStoreDesignDto,
    user: DesignRequestUser,
  ): Promise<StoreDesignResponse> {
    await this.ensureRestaurantAccess(restaurantId, user);
    const restaurantObjectId = new Types.ObjectId(restaurantId);

    const existing = await this.storeDesignModel
      .findOne({ restaurantId: restaurantObjectId })
      .lean();

    const activeTheme =
      dto.activeTheme || existing?.activeTheme || DEFAULT_ACTIVE_THEME;

    const mergedClassicConfig = mergeClassicConfig(
      existing?.classicConfig as Partial<ClassicConfigShape> | undefined,
      dto.classicConfig as Partial<ClassicConfigShape> | undefined,
    );

    const updatePayload: Record<string, any> = {
      restaurantId: restaurantObjectId,
      activeTheme,
      classicConfig: mergedClassicConfig,
    };

    if (user?.userId && Types.ObjectId.isValid(user.userId)) {
      updatePayload.updatedBy = new Types.ObjectId(user.userId);
    }

    const updated = await this.storeDesignModel
      .findOneAndUpdate(
        { restaurantId: restaurantObjectId },
        { $set: updatePayload },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();

    return this.formatDesignResponse(restaurantId, updated);
  }

  async resetDesign(
    restaurantId: string,
    user: DesignRequestUser,
  ): Promise<StoreDesignResponse> {
    await this.ensureRestaurantAccess(restaurantId, user);
    const restaurantObjectId = new Types.ObjectId(restaurantId);

    const updatePayload: Record<string, any> = {
      restaurantId: restaurantObjectId,
      activeTheme: DEFAULT_ACTIVE_THEME,
      classicConfig: createDefaultClassicConfig(),
    };

    if (user?.userId && Types.ObjectId.isValid(user.userId)) {
      updatePayload.updatedBy = new Types.ObjectId(user.userId);
    }

    const reset = await this.storeDesignModel
      .findOneAndUpdate(
        { restaurantId: restaurantObjectId },
        { $set: updatePayload },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();

    return this.formatDesignResponse(restaurantId, reset);
  }
}
