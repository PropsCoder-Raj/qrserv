import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { getDateRangeFromPreset } from '../../common/utils/date-range';

const isStaffRole = (role: string) =>
  role === UserRole.MANAGER || role === UserRole.STAFF;

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
  ) {}

  private toObjectId(
    value: string | Types.ObjectId | null | undefined,
    fieldName: string,
  ) {
    if (!value) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    if (value instanceof Types.ObjectId) {
      return value;
    }

    const valueString = value.toString();
    if (!Types.ObjectId.isValid(valueString)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return new Types.ObjectId(valueString);
  }

  private normalizeOptionalId(
    value: string | Types.ObjectId | null | undefined,
    fieldName: string,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized =
      typeof value === 'string' ? value.trim() : value.toString().trim();

    if (!normalized) {
      return null;
    }

    if (!Types.ObjectId.isValid(normalized)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return normalized;
  }

  async validateOrgRestaurant(
    restaurantId: string | Types.ObjectId,
    organizationId: string | Types.ObjectId,
  ) {
    const restaurantObjectId = this.toObjectId(restaurantId, 'restaurantId');
    const organizationObjectId = this.toObjectId(
      organizationId,
      'organizationId',
    );

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

  async validateOrgUser(
    userId: string | Types.ObjectId,
    organizationId: string | Types.ObjectId,
  ) {
    const userObjectId = this.toObjectId(userId, 'userId');
    const organizationObjectId = this.toObjectId(
      organizationId,
      'organizationId',
    );

    const targetUser = await this.userModel
      .findById(userObjectId)
      .select('organizationId restaurantId');
    if (!targetUser) throw new NotFoundException('User not found');
    if (targetUser.organizationId?.equals(organizationObjectId)) return;
    if (targetUser.restaurantId) {
      const restaurant = await this.restaurantModel
        .findById(targetUser.restaurantId)
        .select('organizationId');
      if (
        restaurant &&
        restaurant.organizationId?.equals(organizationObjectId)
      )
        return;
    }
    throw new ForbiddenException('User does not belong to your organization');
  }

  async onModuleInit() {
    await this.createSuperAdmin();
  }

  private async createSuperAdmin() {
    const email = 'admin@admin.com';
    const existing = await this.userModel.findOne({ email });
    if (existing) return;

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await this.userModel.create({
      name: 'Super Admin',
      email,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    this.logger.log('Default super admin created (admin@admin.com / admin123)');
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const userData: any = { ...createUserDto };
    const organizationId = this.normalizeOptionalId(
      createUserDto.organizationId as string | Types.ObjectId | null | undefined,
      'organizationId',
    );
    const restaurantId = this.normalizeOptionalId(
      createUserDto.restaurantId as string | Types.ObjectId | null | undefined,
      'restaurantId',
    );

    userData.organizationId = organizationId
      ? new Types.ObjectId(organizationId)
      : null;
    userData.restaurantId = restaurantId
      ? new Types.ObjectId(restaurantId)
      : null;

    if (isStaffRole(createUserDto.role)) {
      if (createUserDto.passcode && restaurantId) {
        await this.validatePasscodeUnique(
          createUserDto.passcode,
          restaurantId,
        );
      }
      userData.passcode = await bcrypt.hash(createUserDto.passcode, 10);
      delete userData.password;
    } else {
      userData.password = await bcrypt.hash(createUserDto.password, 10);
      delete userData.passcode;
    }

    const user = await this.userModel.create(userData);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, passcode, refreshToken, ...result } = user.toObject();
    return result;
  }

  async findAll(
    restaurantId?: string,
    query?: PaginationQueryDto,
    organizationId?: string,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
    } = query || {};
    const filter: any = {};
    const andConditions: any[] = [];

    if (organizationId) {
      const orgRestaurants = await this.restaurantModel
        .find({ organizationId })
        .select('_id')
        .exec();
      const restaurantIds = orgRestaurants.map((r) => r._id);
      filter.role = { $ne: UserRole.SUPER_ADMIN };
      andConditions.push({
        $or: [{ organizationId }, { restaurantId: { $in: restaurantIds } }],
      });
    } else if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
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
      this.userModel
        .find(filter)
        .select('-password -passcode -refreshToken')
        .populate('organizationId')
        .populate('restaurantId')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password -passcode -refreshToken');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updateData: any = { ...updateUserDto };
    const hasOrganizationId = Object.prototype.hasOwnProperty.call(
      updateUserDto,
      'organizationId',
    );
    const hasRestaurantId = Object.prototype.hasOwnProperty.call(
      updateUserDto,
      'restaurantId',
    );

    if (hasOrganizationId) {
      const organizationId = this.normalizeOptionalId(
        updateUserDto.organizationId as string | Types.ObjectId | null | undefined,
        'organizationId',
      );
      updateData.organizationId = organizationId
        ? new Types.ObjectId(organizationId)
        : null;
    }

    if (hasRestaurantId) {
      const restaurantId = this.normalizeOptionalId(
        updateUserDto.restaurantId as string | Types.ObjectId | null | undefined,
        'restaurantId',
      );
      updateData.restaurantId = restaurantId
        ? new Types.ObjectId(restaurantId)
        : null;
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    if (updateData.passcode) {
      const existingUser = await this.userModel.findById(id);
      if (existingUser && isStaffRole(existingUser.role)) {
        const restaurantId =
          updateData.restaurantId?.toString() ||
          existingUser.restaurantId?.toString();
        if (restaurantId) {
          await this.validatePasscodeUnique(
            updateData.passcode,
            restaurantId,
            id,
          );
        }
      }
      updateData.passcode = await bcrypt.hash(updateData.passcode, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password -passcode -refreshToken');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async validatePasscodeUnique(
    passcode: string,
    restaurantId: string,
    excludeUserId?: string,
  ) {
    const query: any = {
      restaurantId,
      role: { $in: [UserRole.MANAGER, UserRole.STAFF] },
      passcode: { $exists: true, $ne: null },
    };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const usersInRestaurant = await this.userModel.find(query);
    for (const user of usersInRestaurant) {
      const isMatch = await bcrypt.compare(passcode, user.passcode);
      if (isMatch) {
        throw new ConflictException(
          'This passcode is already used by another user in this restaurant',
        );
      }
    }
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }
}
