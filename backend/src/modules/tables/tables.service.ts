import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Table, TableDocument } from '../../schemas/table.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from '../../schemas/order.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import {
  Organization,
  OrganizationDocument,
} from '../../schemas/organization.schema';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { getDateRangeFromPreset } from '../../common/utils/date-range';

@Injectable()
export class TablesService {
  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
  ) {}

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

  async validateActiveSubscription(restaurantId: string) {
    const restaurant = await this.restaurantModel
      .findById(restaurantId)
      .select('organizationId');
    if (!restaurant?.organizationId) return;
    const org = await this.organizationModel
      .findById(restaurant.organizationId)
      .select('subscriptionPlan subscriptionExpiry');
    if (!org?.subscriptionPlan) {
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
  }

  async create(dto: CreateTableDto, organizationId: string) {
    if (!Types.ObjectId.isValid(dto.restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }

    const restaurantObjectId = new Types.ObjectId(dto.restaurantId);
    await this.validateActiveSubscription(dto.restaurantId);

    const currentCount = await this.tableModel.countDocuments({
      restaurantId: restaurantObjectId,
    });

    if (organizationId) {
      const org = await this.organizationModel
        .findById(organizationId.toString())
        .populate('subscriptionPlan');

      if (org?.subscriptionPlan) {
        const plan = org.subscriptionPlan as any;
        if (
          plan.maxTables !== undefined &&
          plan.maxTables > 0 &&
          currentCount >= plan.maxTables
        ) {
          throw new BadRequestException(
            'Maximum table limit reached per restaurant.',
          );
        }
      }
    }
    return this.tableModel.create({
      ...dto,
      restaurantId: restaurantObjectId,
    });
  }

  async findAll(restaurantId: string, query?: PaginationQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'asc',
    } = query || {};
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }

    const filter: any = {
      restaurantId: new Types.ObjectId(restaurantId),
    };

    const range = getDateRangeFromPreset(query?.datePreset);
    if (range) {
      filter.createdAt = { $gte: range.from, $lte: range.to };
    }

    if (search) {
      filter.$or = [{ tableNumber: { $regex: search, $options: 'i' } }];
    }

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.tableNumber = 1;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.tableModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.tableModel.countDocuments(filter).exec(),
    ]);
    const tableIds = data.map((table: any) => table._id);
    const activeOrders = tableIds.length
      ? await this.orderModel
          .find({
            tableId: { $in: tableIds },
            status: { $ne: OrderStatus.CANCELLED },
            $nor: [
              {
                status: OrderStatus.SERVED,
                paymentStatus: PaymentStatus.PAID,
              },
            ],
          })
          .select('orderNumber tableId status paymentStatus totalAmount')
          .sort({ createdAt: -1 })
          .lean()
          .exec()
      : [];
    const activeOrderByTableId = new Map();
    for (const order of activeOrders) {
      const tableIdKey = order.tableId?.toString();
      if (tableIdKey && !activeOrderByTableId.has(tableIdKey)) {
        activeOrderByTableId.set(tableIdKey, order);
      }
    }
    const tablesWithEngageStatus = data.map((table: any) => {
      const activeOrder = activeOrderByTableId.get(table._id.toString());
      return {
        ...table,
        isEngaged: Boolean(activeOrder),
        engageStatus: activeOrder ? 'engaged' : 'free',
        activeOrder: activeOrder || null,
      };
    });

    return {
      data: tablesWithEngageStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPublicInfo(id: string) {
    const table = await this.tableModel
      .findById(id)
      .select('tableNumber capacity isActive');
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async findOne(id: string) {
    const table = await this.tableModel.findById(id);
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    const table = await this.tableModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async remove(id: string) {
    const table = await this.tableModel.findByIdAndDelete(id);
    if (!table) throw new NotFoundException('Table not found');
    return { message: 'Table deleted' };
  }
}
