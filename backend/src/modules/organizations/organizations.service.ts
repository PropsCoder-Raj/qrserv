import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Organization,
  OrganizationDocument,
} from '../../schemas/organization.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { getDateRangeFromPreset } from '../../common/utils/date-range';

@Injectable()
export class OrganizationsService {
  private razorpay: any;

  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private configService: ConfigService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Razorpay = require('razorpay');
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('razorpay.keyId'),
      key_secret: this.configService.get<string>('razorpay.keySecret'),
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateOrganizationDto) {
    if (!Types.ObjectId.isValid(dto.ownerId)) {
      throw new BadRequestException('Invalid ownerId');
    }

    let slug = this.generateSlug(dto.name);
    const existing = await this.organizationModel.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    return this.organizationModel.create({
      ...dto,
      slug,
      ownerId: new Types.ObjectId(dto.ownerId),
    });
  }

  async findAll(query?: PaginationQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
    } = query || {};
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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
      this.organizationModel
        .find(filter)
        .populate('subscriptionPlan')
        .populate('ownerId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.organizationModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const org = await this.organizationModel
      .findById(id)
      .populate('subscriptionPlan')
      .populate('ownerId', 'name email');
    if (!org) {
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
    return { data: [org], total: 1, page: 1, limit: 10, totalPages: 1 };
  }

  async findOne(id: string) {
    const org = await this.organizationModel
      .findById(id)
      .populate('subscriptionPlan')
      .populate('ownerId', 'name email');
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async findByOwner(ownerId: string) {
    const org = await this.organizationModel
      .findOne({ ownerId })
      .populate('subscriptionPlan')
      .populate('ownerId', 'name email');
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.organizationModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async remove(id: string) {
    const org = await this.organizationModel.findByIdAndDelete(id);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return { message: 'Organization deleted successfully' };
  }

  async findRestaurants(orgId: string, query?: PaginationQueryDto) {
    const org = await this.organizationModel.findById(orgId);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
    } = query || {};
    const filter: any = { organizationId: orgId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
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

  async getOrderSummary(orgId: string, restaurantId?: string) {
    const org = await this.organizationModel
      .findById(orgId)
      .populate('subscriptionPlan')
      .populate('ownerId', 'name email');
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const restaurantIds = await this.getScopedRestaurantIds(orgId, restaurantId);

    if (!restaurantIds.length) {
      return {
        organization: org,
        summary: {
          totalOrders: 0,
          totalRazorpayOrders: 0,
          totalRazorpayAmount: 0,
        },
      };
    }

    const [stats] = await this.orderModel.aggregate([
      { $match: { restaurantId: { $in: restaurantIds } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRazorpayOrders: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gt: [
                        { $strLenCP: { $ifNull: ['$razorpayPaymentId', ''] } },
                        0,
                      ],
                    },
                    { $eq: ['$paymentStatus', 'paid'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalRazorpayAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gt: [
                        { $strLenCP: { $ifNull: ['$razorpayPaymentId', ''] } },
                        0,
                      ],
                    },
                    { $eq: ['$paymentStatus', 'paid'] },
                  ],
                },
                '$totalAmount',
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      organization: org,
      summary: {
        totalOrders: Number(stats?.totalOrders || 0),
        totalRazorpayOrders: Number(stats?.totalRazorpayOrders || 0),
        totalRazorpayAmount: Number(stats?.totalRazorpayAmount || 0),
      },
    };
  }

  async getRazorpayOrderHistory(orgId: string, query?: PaginationQueryDto) {
    const org = await this.organizationModel.findById(orgId).select('_id');
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
    } = query || {};

    const restaurantId = (query as any)?.restaurantId;
    const restaurantIds = await this.getScopedRestaurantIds(orgId, restaurantId);

    if (!restaurantIds.length) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const filter: any = {
      restaurantId: { $in: restaurantIds },
      razorpayPaymentId: { $exists: true, $ne: '' },
      paymentStatus: 'paid',
    };

    const range = getDateRangeFromPreset(query?.datePreset);
    if (range) {
      filter.createdAt = { $gte: range.from, $lte: range.to };
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('restaurantId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRazorpayPaymentDetails(orgId: string, paymentId: string) {
    const org = await this.organizationModel.findById(orgId).select('_id');
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const restaurants = await this.restaurantModel
      .find({ organizationId: orgId })
      .select('_id')
      .lean();
    const restaurantIds = restaurants.map((r: any) => r._id);

    if (!restaurantIds.length) {
      throw new NotFoundException('No restaurants found for organization');
    }

    const order = await this.orderModel
      .findOne({
        restaurantId: { $in: restaurantIds },
        razorpayPaymentId: paymentId,
      })
      .populate('restaurantId', 'name')
      .lean();

    if (!order) {
      throw new NotFoundException(
        'Razorpay payment record not found for this organization',
      );
    }

    let paymentDetails: any = null;
    let razorpayOrderDetails: any = null;
    try {
      paymentDetails = await this.razorpay.payments.fetch(paymentId);
      if (paymentDetails?.order_id) {
        razorpayOrderDetails = await this.razorpay.orders.fetch(
          paymentDetails.order_id,
        );
      }
    } catch (err) {
      const message =
        err?.error?.description ||
        err?.message ||
        'Failed to fetch Razorpay payment details';
      throw new BadRequestException(message);
    }

    return {
      order,
      paymentDetails,
      razorpayOrderDetails,
    };
  }

  private async getScopedRestaurantIds(
    orgId: string,
    restaurantId?: string,
  ): Promise<Types.ObjectId[]> {
    if (restaurantId && !Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }

    const restaurants = await this.restaurantModel
      .find({ organizationId: orgId })
      .select('_id')
      .lean();
    const allRestaurantIds = restaurants.map((r: any) => r._id);

    if (!restaurantId) {
      return allRestaurantIds;
    }

    const isAllowed = allRestaurantIds.some(
      (id: any) => id.toString() === restaurantId.toString(),
    );
    if (!isAllowed) {
      throw new BadRequestException(
        'Selected restaurant does not belong to this organization',
      );
    }

    return allRestaurantIds.filter((id: any) => id.toString() === restaurantId);
  }
}
