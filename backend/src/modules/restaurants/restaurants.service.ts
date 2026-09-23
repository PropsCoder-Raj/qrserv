import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import {
  Organization,
  OrganizationDocument,
} from '../../schemas/organization.schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { getDateRangeFromPreset } from '../../common/utils/date-range';

@Injectable()
export class RestaurantsService {
  private readonly organizationPopulate = {
    path: 'organizationId',
    populate: {
      path: 'subscriptionPlan',
      select: 'isPaymentGatewayAllocated isMenuPdfEnabled name',
    },
  };

  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
  ) { }

  async validateOrgRestaurant(restaurantId: string, organizationId: string) {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Invalid organizationId');
    }

    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const organizationObjectId = new Types.ObjectId(organizationId);
    const restaurant = await this.restaurantModel
      .findById(restaurantObjectId)
      .select('organizationId');
    if (
      !restaurant ||
      !restaurant.organizationId?.equals(organizationObjectId)
    ) {
      throw new ForbiddenException(
        'Restaurant does not belong to your organization',
      );
    }
  }

  async validateOwnerRestaurant(
    restaurantId: string,
    userRestaurantId: string,
  ) {
    if (restaurantId !== userRestaurantId) {
      throw new ForbiddenException('You do not have access to this restaurant');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(createRestaurantDto: CreateRestaurantDto, ownerId: string) {
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new BadRequestException('Invalid ownerId');
    }
    if (!Types.ObjectId.isValid(createRestaurantDto.organizationId)) {
      throw new BadRequestException('Invalid organizationId');
    }

    const org = await this.organizationModel
      .findById(createRestaurantDto.organizationId)
      .populate('subscriptionPlan');
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (!org.subscriptionPlan) {
      throw new BadRequestException(
        'Your organization does not have a subscription plan. Please purchase a plan first.',
      );
    }

    if (
      org.subscriptionExpiry &&
      new Date(org.subscriptionExpiry) < new Date()
    ) {
      throw new BadRequestException(
        'Your subscription plan has expired. Please renew your plan.',
      );
    }

    if (org.subscriptionPlan) {
      const plan = org.subscriptionPlan as any;
      if (plan.maxRestaurants !== undefined && plan.maxRestaurants > 0) {
        const currentCount = await this.restaurantModel.countDocuments({
          organizationId: org._id.toString(),
        });
        if (currentCount >= plan.maxRestaurants) {
          throw new BadRequestException(
            'Restaurant limit reached for your organization subscription plan',
          );
        }
      }
    }

    let slug = this.generateSlug(createRestaurantDto.name);
    const existing = await this.restaurantModel.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    return this.restaurantModel.create({
      ...createRestaurantDto,
      slug,
      ownerId: new Types.ObjectId(ownerId),
      organizationId: new Types.ObjectId(createRestaurantDto.organizationId),
    });
  }

  async findAll(query?: PaginationQueryDto, organizationId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
    } = query || {};
    const filter: any = {};

    if (organizationId) {
      filter.organizationId = organizationId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const range = getDateRangeFromPreset(query?.datePreset);
    if (range) {
      filter.createdAt = { $gte: range.from, $lte: range.to };
    }

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.restaurantModel
        .find(filter)
        .populate(this.organizationPopulate)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.restaurantModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByRestaurantId(restaurantId: string) {
    const restaurant = await this.restaurantModel
      .findById(restaurantId)
      .populate(this.organizationPopulate);
    if (!restaurant) {
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
    return { data: [restaurant], total: 1, page: 1, limit: 10, totalPages: 1 };
  }

  async findOne(id: string) {
    const restaurant = await this.restaurantModel
      .findById(id)
      .populate(this.organizationPopulate);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async findBySlug(slug: string) {
    const restaurant = await this.restaurantModel.findOne({
      slug,
      isActive: true,
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  private async getOrganizationSubscriptionState(organizationId?: any) {
    if (!organizationId) {
      return {
        subscriptionExpiry: null,
        hasSubscriptionPlan: false,
        hasActivePlan: false,
        isPlanExpired: false,
        isPaymentGatewayAllocated: false,
        isMenuPdfEnabled: false,
      };
    }

    const organization = await this.organizationModel
      .findById(organizationId)
      .select('subscriptionPlan subscriptionExpiry isActive')
      .populate(
        'subscriptionPlan',
        'isPaymentGatewayAllocated isMenuPdfEnabled',
      )
      .lean();

    const now = new Date();
    const subscriptionExpiry = organization?.subscriptionExpiry || null;
    const hasSubscriptionPlan = Boolean(organization?.subscriptionPlan);
    const isPlanExpired = Boolean(
      subscriptionExpiry && new Date(subscriptionExpiry) < now,
    );
    const hasActivePlan = Boolean(hasSubscriptionPlan && !isPlanExpired);

    return {
      organizationIsActive: Boolean(organization?.isActive),
      subscriptionExpiry,
      hasSubscriptionPlan,
      hasActivePlan,
      isPlanExpired,
      isPaymentGatewayAllocated: Boolean(
        hasActivePlan &&
        (organization?.subscriptionPlan as any)?.isPaymentGatewayAllocated,
      ),
      isMenuPdfEnabled: Boolean(
        hasActivePlan && (organization?.subscriptionPlan as any)?.isMenuPdfEnabled,
      ),
    };
  }

  async getPublicInfo(id: string) {
    const restaurant = await this.restaurantModel
      .findById(id)
      .select(
        'name logo address gst_no vat_no taxEnabled taxRate taxType vatEnabled vatRate vatType menuPdf organizationId isActive',
      );
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const subscriptionState = await this.getOrganizationSubscriptionState(
      restaurant.organizationId,
    );
    const restaurantData = restaurant.toObject();
    const hasMenuPdf = Boolean(restaurantData.menuPdf);
    const canShowMenuPdf = Boolean(
      subscriptionState.isMenuPdfEnabled && hasMenuPdf,
    );

    return {
      ...restaurantData,
      restaurantIsActive: Boolean(restaurantData.isActive),
      menuPdf: canShowMenuPdf ? restaurantData.menuPdf : '',
      ...subscriptionState,
      hasMenuPdf,
      canShowMenuPdf,
    };
  }

  async findByOwner(
    ownerId: string,
    query?: PaginationQueryDto,
    organizationId?: string,
  ) {
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new BadRequestException('Invalid ownerId');
    }

    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
    } = query || {};
    const filter: any = {};
    const ownerObjectId = new Types.ObjectId(ownerId);

    if (organizationId) {
      if (!Types.ObjectId.isValid(organizationId)) {
        throw new BadRequestException('Invalid organizationId');
      }

      const organizationObjectId = new Types.ObjectId(organizationId);
      filter.$or = [
        { ownerId: ownerObjectId },
        { organizationId: organizationObjectId },
      ];
    } else {
      filter.ownerId = ownerObjectId;
    }

    if (search) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const range = getDateRangeFromPreset(query?.datePreset);
    if (range) {
      filter.createdAt = { $gte: range.from, $lte: range.to };
    }

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.restaurantModel
        .find(filter)
        .populate(this.organizationPopulate)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.restaurantModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
    const restaurant = await this.restaurantModel.findByIdAndUpdate(
      id,
      updateRestaurantDto,
      { new: true },
    );
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async remove(id: string) {
    const restaurant = await this.restaurantModel.findByIdAndDelete(id);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return { message: 'Restaurant deleted successfully' };
  }

  /**
   * Stores a single PDF per restaurant, replacing the previous one (if exists).
   * File path: backend/uploads/restaurants/<restaurantId>.pdf
   * DB field: menuPdf = /uploads/restaurants/<restaurantId>.pdf
   */
  async uploadMenuPdf(restaurantId: string, file: any) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    if (file?.mimetype && file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const subscriptionState = await this.getOrganizationSubscriptionState(
      restaurant.organizationId,
    );
    if (!subscriptionState.hasActivePlan) {
      throw new BadRequestException(
        'An active subscription plan is required to upload a menu PDF',
      );
    }
    if (!subscriptionState.isMenuPdfEnabled) {
      throw new BadRequestException(
        'Your current subscription plan does not allow menu PDF upload',
      );
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'restaurants');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `${restaurantId}.pdf`;
    const diskPath = path.join(uploadsDir, filename);

    // delete previous file if exists (even if DB field is empty)
    try {
      await fs.unlink(diskPath);
    } catch {
      // ignore if not exists
    }

    // write new buffer
    if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException('Invalid upload payload');
    }
    await fs.writeFile(diskPath, file.buffer);

    const publicPath = `/uploads/restaurants/${filename}`;
    restaurant.menuPdf = publicPath;
    await restaurant.save();

    return {
      message: 'Menu PDF uploaded successfully',
      menuPdf: publicPath,
    };
  }
}
