"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenusService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
const category_schema_1 = require("../../schemas/category.schema");
const menu_item_schema_1 = require("../../schemas/menu-item.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const organization_schema_1 = require("../../schemas/organization.schema");
const cache_service_1 = require("../../common/cache/cache.service");
const date_range_1 = require("../../common/utils/date-range");
let MenusService = class MenusService {
    constructor(categoryModel, menuItemModel, restaurantModel, organizationModel, cacheService) {
        this.categoryModel = categoryModel;
        this.menuItemModel = menuItemModel;
        this.restaurantModel = restaurantModel;
        this.organizationModel = organizationModel;
        this.cacheService = cacheService;
    }
    async validateOrgRestaurant(restaurantId, organizationId) {
        if (!mongoose_2.Types.ObjectId.isValid(restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        if (!mongoose_2.Types.ObjectId.isValid(organizationId)) {
            throw new common_1.BadRequestException('Invalid organizationId');
        }
        const restaurantObjectId = new mongoose_2.Types.ObjectId(restaurantId);
        const organizationObjectId = new mongoose_2.Types.ObjectId(organizationId);
        const restaurant = await this.restaurantModel
            .findById(restaurantObjectId)
            .select('organizationId');
        if (!restaurant ||
            !restaurant.organizationId?.equals(organizationObjectId)) {
            throw new common_1.ForbiddenException('Restaurant does not belong to your organization');
        }
    }
    async validateActiveSubscription(restaurantId) {
        const restaurant = await this.restaurantModel
            .findById(restaurantId)
            .select('organizationId');
        if (!restaurant?.organizationId)
            return;
        const org = await this.organizationModel
            .findById(restaurant.organizationId)
            .select('subscriptionPlan subscriptionExpiry');
        if (!org?.subscriptionPlan) {
            throw new common_1.BadRequestException('Your organization does not have a subscription plan. Please purchase a plan first.');
        }
        if (org.subscriptionExpiry &&
            new Date(org.subscriptionExpiry) < new Date()) {
            throw new common_1.BadRequestException('Your subscription plan has expired. Please renew your plan.');
        }
    }
    async removeMenuItemImageFile(imagePath) {
        if (!imagePath)
            return;
        const normalizedPath = imagePath.replace(/^\/+/, '');
        const diskPath = path.resolve(process.cwd(), normalizedPath);
        try {
            await fs.unlink(diskPath);
        }
        catch {
        }
    }
    async createCategory(dto, organizationId) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        const restaurantObjectId = new mongoose_2.Types.ObjectId(dto.restaurantId);
        await this.validateActiveSubscription(dto.restaurantId);
        const currentCount = await this.categoryModel.countDocuments({
            restaurantId: restaurantObjectId,
        });
        if (organizationId) {
            const org = await this.organizationModel
                .findById(organizationId.toString())
                .populate('subscriptionPlan');
            if (org?.subscriptionPlan) {
                const plan = org.subscriptionPlan;
                if (plan.maxCategories !== undefined &&
                    plan.maxCategories > 0 &&
                    currentCount >= plan.maxCategories) {
                    throw new common_1.BadRequestException('Maximum categories limit reached per restaurant.');
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
    async findCategories(restaurantId, query, includeInactive = false) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'asc', } = query || {};
        if (!mongoose_2.Types.ObjectId.isValid(restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        const filter = {
            restaurantId: new mongoose_2.Types.ObjectId(restaurantId),
        };
        if (!includeInactive) {
            filter.isActive = true;
        }
        const range = (0, date_range_1.getDateRangeFromPreset)(query?.datePreset);
        if (range) {
            filter.createdAt = { $gte: range.from, $lte: range.to };
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
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
    async updateCategory(id, dto) {
        const category = await this.categoryModel.findByIdAndUpdate(id, dto, {
            new: true,
        });
        if (!category)
            throw new common_1.NotFoundException('Category not found');
        this.cacheService.delByPrefix(`menu:${category.restaurantId}`);
        return category;
    }
    async removeCategory(id) {
        const category = await this.categoryModel.findByIdAndDelete(id);
        if (!category)
            throw new common_1.NotFoundException('Category not found');
        await this.menuItemModel.deleteMany({ categoryId: id });
        this.cacheService.delByPrefix(`menu:${category.restaurantId}`);
        return { message: 'Category and its items deleted' };
    }
    async createMenuItem(dto, organizationId) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        if (!mongoose_2.Types.ObjectId.isValid(dto.categoryId)) {
            throw new common_1.BadRequestException('Invalid categoryId');
        }
        const restaurantObjectId = new mongoose_2.Types.ObjectId(dto.restaurantId);
        const categoryObjectId = new mongoose_2.Types.ObjectId(dto.categoryId);
        await this.validateActiveSubscription(dto.restaurantId);
        const currentCount = await this.menuItemModel.countDocuments({
            restaurantId: restaurantObjectId,
        });
        if (organizationId) {
            const org = await this.organizationModel
                .findById(organizationId.toString())
                .populate('subscriptionPlan');
            if (org?.subscriptionPlan) {
                const plan = org.subscriptionPlan;
                if (plan.maxMenuItems !== undefined &&
                    plan.maxMenuItems > 0 &&
                    currentCount >= plan.maxMenuItems) {
                    throw new common_1.BadRequestException('Maximum Menu Items limit reached per restaurant.');
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
    async findMenuItems(restaurantId, categoryId, query, includeInactive = false) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'asc', } = query || {};
        if (!mongoose_2.Types.ObjectId.isValid(restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        const filter = {
            restaurantId: new mongoose_2.Types.ObjectId(restaurantId),
        };
        if (!includeInactive) {
            filter.isAvailable = true;
        }
        if (categoryId) {
            if (!mongoose_2.Types.ObjectId.isValid(categoryId)) {
                throw new common_1.BadRequestException('Invalid categoryId');
            }
            filter.categoryId = new mongoose_2.Types.ObjectId(categoryId);
        }
        const range = (0, date_range_1.getDateRangeFromPreset)(query?.datePreset);
        if (range) {
            filter.createdAt = { $gte: range.from, $lte: range.to };
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
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
    async updateMenuItem(id, dto) {
        const item = await this.menuItemModel.findByIdAndUpdate(id, dto, {
            new: true,
        });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        this.cacheService.delByPrefix(`menu:${item.restaurantId}`);
        return item;
    }
    async uploadMenuItemImage(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('Image file is required');
        }
        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
            throw new common_1.BadRequestException('Invalid upload payload');
        }
        const item = await this.menuItemModel.findById(id);
        if (!item) {
            throw new common_1.NotFoundException('Menu item not found');
        }
        const uploadsDir = path.resolve(process.cwd(), 'uploads', 'menu_items');
        await fs.mkdir(uploadsDir, { recursive: true });
        await this.removeMenuItemImageFile(item.image);
        const extension = path.extname(file.originalname || '').toLowerCase() || '.png';
        const filename = `${item._id}${extension}`;
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
    async removeMenuItem(id) {
        const item = await this.menuItemModel.findByIdAndDelete(id);
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        await this.removeMenuItemImageFile(item.image);
        this.cacheService.delByPrefix(`menu:${item.restaurantId}`);
        return { message: 'Menu item deleted' };
    }
    async getFullMenu(restaurantId) {
        const cacheKey = `menu:${restaurantId}`;
        const cached = this.cacheService.get(cacheKey);
        if (cached)
            return cached;
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
            .find({ restaurantId: new mongoose_2.Types.ObjectId(restaurantId), isActive: true })
            .sort({ sortOrder: 1 })
            .lean()
            .exec();
        const menuItems = await this.menuItemModel
            .find({
            restaurantId: new mongoose_2.Types.ObjectId(restaurantId),
            isAvailable: true,
        })
            .lean()
            .exec();
        const menu = categories.map((cat) => ({
            ...cat,
            items: menuItems.filter((item) => item.categoryId.toString() === cat._id.toString()),
        }));
        this.cacheService.set(cacheKey, menu, 300);
        return menu;
    }
};
exports.MenusService = MenusService;
exports.MenusService = MenusService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(category_schema_1.Category.name)),
    __param(1, (0, mongoose_1.InjectModel)(menu_item_schema_1.MenuItem.name)),
    __param(2, (0, mongoose_1.InjectModel)(restaurant_schema_1.Restaurant.name)),
    __param(3, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        cache_service_1.CacheService])
], MenusService);
//# sourceMappingURL=menus.service.js.map