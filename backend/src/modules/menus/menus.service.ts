import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import {
  MenuItem,
  MenuItemDocument,
  PriceDropType,
} from '../../schemas/menu-item.schema';
import {
  Restaurant,
  RestaurantDocument,
} from '../../schemas/restaurant.schema';
import {
  Organization,
  OrganizationDocument,
} from '../../schemas/organization.schema';
import { CacheService } from '../../common/cache/cache.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { getDateRangeFromPreset } from '../../common/utils/date-range';

@Injectable()
export class MenusService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    private cacheService: CacheService,
  ) {}

  private validatePriceDrop(
    discountType?: PriceDropType | null,
    discountValue?: number,
  ) {
    if (!discountType) return;
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException('Discount value must be greater than 0');
    }
    if (discountType === PriceDropType.PERCENTAGE && value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }
  }

  async validateOrgRestaurant(restaurantId: string, organizationId: string) {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Invalid organizationId');
    }

    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const restaurant = await this.restaurantModel
      .findById(restaurantObjectId)
      .select('organizationId');
    const restaurantOrgId =
      (restaurant?.organizationId as any)?._id?.toString?.() ??
      restaurant?.organizationId?.toString?.() ??
      (restaurant?.organizationId ? String(restaurant.organizationId) : undefined);

    if (!restaurant || !restaurantOrgId || restaurantOrgId !== organizationId.toString()) {
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

  async getRestaurantOrgWithPlan(restaurantId: string | Types.ObjectId) {
    const restaurant = await this.restaurantModel
      .findById(restaurantId)
      .select('organizationId');
    if (!restaurant?.organizationId) return null;
    return this.organizationModel
      .findById(restaurant.organizationId)
      .populate('subscriptionPlan');
  }

  async enforcePlanLimit({
    restaurantId,
    field,
    model,
    errorMessage,
  }: {
    restaurantId: string | Types.ObjectId;
    field: string;
    model: any;
    errorMessage: string;
  }) {
    const org = await this.getRestaurantOrgWithPlan(restaurantId);
    if (!org?.subscriptionPlan) return;
    const limit = (org.subscriptionPlan as any)[field];
    if (limit === undefined || limit === null || limit <= 0) return;
    const currentCount = await model.countDocuments({
      restaurantId,
    });
    if (currentCount >= limit) {
      throw new BadRequestException(errorMessage);
    }
  }

  private async getMenuItemUploadsDir(): Promise<string> {
    const candidates = [
      path.resolve(process.cwd(), 'uploads', 'menu_items'),
      path.resolve(process.cwd(), 'backend', 'uploads', 'menu_items'),
      path.resolve(__dirname, '../../../uploads/menu_items'),
      path.resolve(__dirname, '../../../../uploads/menu_items'),
    ];

    for (const dir of candidates) {
      try {
        const parent = path.dirname(dir);
        await fs.access(parent);
        await fs.mkdir(dir, { recursive: true });
        return dir;
      } catch {
        // try next candidate
      }
    }

    const fallback = candidates[0];
    await fs.mkdir(fallback, { recursive: true });
    return fallback;
  }

  private async removeMenuItemImageFile(imagePath?: string) {
    if (!imagePath) return;

    const cleanPath = imagePath.replace(/^https?:\/\/[^/]+/, '');
    const relativePath = cleanPath
      .replace(/^\/api\/uploads\//, 'uploads/')
      .replace(/^\/uploads\//, 'uploads/')
      .replace(/^\/+/, '');

    const candidates = [
      path.resolve(process.cwd(), relativePath),
      path.resolve(process.cwd(), 'backend', relativePath),
      path.resolve(__dirname, '../../../', relativePath),
      path.resolve(__dirname, '../../../../', relativePath),
    ];

    for (const diskPath of candidates) {
      try {
        await fs.unlink(diskPath);
        break;
      } catch {
        // ignore if not found at this candidate path
      }
    }
  }

  private async cleanupOrphanFilesByPrefix(dirPath: string, prefix: string) {
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.startsWith(prefix)) {
          await fs.unlink(path.join(dirPath, file)).catch(() => {});
        }
      }
    } catch {
      // directory might not exist yet
    }
  }


  // --- Categories ---

  async createCategory(dto: CreateCategoryDto, organizationId: string) {
    if (!Types.ObjectId.isValid(dto.restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }

    const restaurantObjectId = new Types.ObjectId(dto.restaurantId);
    await this.validateActiveSubscription(dto.restaurantId);

    const currentCount = await this.categoryModel.countDocuments({
      restaurantId: restaurantObjectId,
    });

    if (organizationId) {
      const org = await this.organizationModel
        .findById(organizationId.toString())
        .populate('subscriptionPlan');

      if (org?.subscriptionPlan) {
        const plan = org.subscriptionPlan as any;
        if (
          plan.maxCategories !== undefined &&
          plan.maxCategories > 0 &&
          currentCount >= plan.maxCategories
        ) {
          throw new BadRequestException(
            'Maximum categories limit reached per restaurant.',
          );
        }
      }
    }

    const category = await this.categoryModel.create({
      ...dto,
      restaurantId: restaurantObjectId,
    });
    this.cacheService.delByPrefix(`menu:${dto.restaurantId}`);
    return category;
  }

  async findCategories(
    restaurantId: string,
    query?: PaginationQueryDto,
    includeInactive = false,
  ) {
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
    if (!includeInactive) {
      filter.isActive = true;
    }

    const range = getDateRangeFromPreset(query?.datePreset);
    if (range) {
      filter.createdAt = { $gte: range.from, $lte: range.to };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.sortOrder = 1;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.categoryModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!category) throw new NotFoundException('Category not found');
    this.cacheService.delByPrefix(`menu:${category.restaurantId}`);
    return category;
  }

  async removeCategory(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);
    if (!category) throw new NotFoundException('Category not found');
    await this.menuItemModel.deleteMany({ categoryId: id });
    this.cacheService.delByPrefix(`menu:${category.restaurantId}`);
    return { message: 'Category and its items deleted' };
  }

  // --- Menu Items ---

  async createMenuItem(dto: CreateMenuItemDto, organizationId: string) {
    this.validatePriceDrop(dto.discountType, dto.discountValue);
    if (!Types.ObjectId.isValid(dto.restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }
    if (!Types.ObjectId.isValid(dto.categoryId)) {
      throw new BadRequestException('Invalid categoryId');
    }

    const restaurantObjectId = new Types.ObjectId(dto.restaurantId);
    const categoryObjectId = new Types.ObjectId(dto.categoryId);
    await this.validateActiveSubscription(dto.restaurantId);

    const currentCount = await this.menuItemModel.countDocuments({
      restaurantId: restaurantObjectId,
    });

    if (organizationId) {
      const org = await this.organizationModel
        .findById(organizationId.toString())
        .populate('subscriptionPlan');

      if (org?.subscriptionPlan) {
        const plan = org.subscriptionPlan as any;
        if (
          plan.maxMenuItems !== undefined &&
          plan.maxMenuItems > 0 &&
          currentCount >= plan.maxMenuItems
        ) {
          throw new BadRequestException(
            'Maximum Menu Items limit reached per restaurant.',
          );
        }
      }
    }

    const item = await this.menuItemModel.create({
      ...dto,
      restaurantId: restaurantObjectId,
      categoryId: categoryObjectId,
    });
    this.cacheService.delByPrefix(`menu:${dto.restaurantId}`);
    return item;
  }

  async findMenuItems(
    restaurantId: string,
    categoryId?: string,
    query?: PaginationQueryDto,
    includeInactive = false,
  ) {
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
    if (!includeInactive) {
      filter.isAvailable = true;
    }
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException('Invalid categoryId');
      }
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    const range = getDateRangeFromPreset(query?.datePreset);
    if (range) {
      filter.createdAt = { $gte: range.from, $lte: range.to };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.name = 1;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.menuItemModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.menuItemModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    const existing = await this.menuItemModel.findById(id);
    if (!existing) throw new NotFoundException('Menu item not found');
    const discountType = dto.discountType === null
      ? undefined
      : dto.discountType ?? existing.discountType;
    const discountValue = dto.discountType === null
      ? 0
      : dto.discountValue ?? existing.discountValue;
    this.validatePriceDrop(discountType, discountValue);

    const updatePayload: any = { ...dto };
    delete updatePayload.remove_image;
    delete updatePayload.removeImage;

    const shouldRemoveImage =
      dto.remove_image === true ||
      dto.removeImage === true ||
      dto.image === null ||
      dto.image === '';

    if (shouldRemoveImage) {
      if (existing.image) {
        await this.removeMenuItemImageFile(existing.image);
      }
      const uploadsDir = await this.getMenuItemUploadsDir();
      await this.cleanupOrphanFilesByPrefix(uploadsDir, existing._id.toString());
      updatePayload.image = null;
    }

    if (dto.categoryId && Types.ObjectId.isValid(dto.categoryId)) {
      updatePayload.categoryId = new Types.ObjectId(dto.categoryId);
    }

    const item = await this.menuItemModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });
    if (!item) throw new NotFoundException('Menu item not found');
    this.cacheService.delByPrefix(`menu:${item.restaurantId}`);
    return item;
  }

  async uploadMenuItemImage(id: string, file: any) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException('Invalid upload payload');
    }

    const item = await this.menuItemModel.findById(id);
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    const uploadsDir = await this.getMenuItemUploadsDir();

    if (item.image) {
      await this.removeMenuItemImageFile(item.image);
    }
    await this.cleanupOrphanFilesByPrefix(uploadsDir, item._id.toString());

    const extension = path.extname(file.originalname || '').toLowerCase() || '.png';
    const filename = `${item._id}-${Date.now()}${extension}`;
    const diskPath = path.join(uploadsDir, filename);
    await fs.writeFile(diskPath, file.buffer);

    item.image = `/uploads/menu_items/${filename}`;
    await item.save();

    this.cacheService.delByPrefix(`menu:${item.restaurantId}`);
    return {
      message: 'Menu item image uploaded successfully',
      image: item.image,
    };
  }

  async removeMenuItemImage(id: string) {
    const item = await this.menuItemModel.findById(id);
    if (!item) throw new NotFoundException('Menu item not found');

    if (item.image) {
      await this.removeMenuItemImageFile(item.image);
    }
    const uploadsDir = await this.getMenuItemUploadsDir();
    await this.cleanupOrphanFilesByPrefix(uploadsDir, item._id.toString());

    item.image = null as any;
    await item.save();

    this.cacheService.delByPrefix(`menu:${item.restaurantId}`);
    return {
      message: 'Menu item image removed successfully',
      image: null,
    };
  }

  async removeMenuItem(id: string) {
    const item = await this.menuItemModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.image) {
      await this.removeMenuItemImageFile(item.image);
    }
    const uploadsDir = await this.getMenuItemUploadsDir();
    await this.cleanupOrphanFilesByPrefix(uploadsDir, item._id.toString());
    this.cacheService.delByPrefix(`menu:${item.restaurantId}`);
    return { message: 'Menu item deleted' };
  }

  // --- Full Menu (public, cached) ---

  async getFullMenu(restaurantId: string) {
    const cacheKey = `menu:${restaurantId}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    const restaurant = await this.restaurantModel
      .findById(restaurantId)
      .select('isActive organizationId')
      .lean();
    if (!restaurant || !restaurant.isActive) {
      return [];
    }

    const organization = await this.organizationModel
      .findById(restaurant.organizationId)
      .select('isActive')
      .lean();
    if (!organization?.isActive) {
      return [];
    }

    const categories = await this.categoryModel
      .find({ restaurantId: new Types.ObjectId(restaurantId), isActive: true })
      .sort({ sortOrder: 1 })
      .lean()
      .exec();

    const menuItems = await this.menuItemModel
      .find({
        restaurantId: new Types.ObjectId(restaurantId),
        isAvailable: true,
      })
      .lean()
      .exec();

    const menu = categories.map((cat) => ({
      ...cat,
      items: menuItems.filter(
        (item) => item.categoryId.toString() === cat._id.toString(),
      ),
    }));

    this.cacheService.set(cacheKey, menu, 300);
    return menu;
  }
}
