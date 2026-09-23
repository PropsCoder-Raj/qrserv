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
exports.RestaurantsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const organization_schema_1 = require("../../schemas/organization.schema");
const date_range_1 = require("../../common/utils/date-range");
let RestaurantsService = class RestaurantsService {
    constructor(restaurantModel, organizationModel) {
        this.restaurantModel = restaurantModel;
        this.organizationModel = organizationModel;
        this.organizationPopulate = {
            path: 'organizationId',
            populate: {
                path: 'subscriptionPlan',
                select: 'isPaymentGatewayAllocated isMenuPdfEnabled name',
            },
        };
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
    async validateOwnerRestaurant(restaurantId, userRestaurantId) {
        if (restaurantId !== userRestaurantId) {
            throw new common_1.ForbiddenException('You do not have access to this restaurant');
        }
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    async create(createRestaurantDto, ownerId) {
        if (!mongoose_2.Types.ObjectId.isValid(ownerId)) {
            throw new common_1.BadRequestException('Invalid ownerId');
        }
        if (!mongoose_2.Types.ObjectId.isValid(createRestaurantDto.organizationId)) {
            throw new common_1.BadRequestException('Invalid organizationId');
        }
        const org = await this.organizationModel
            .findById(createRestaurantDto.organizationId)
            .populate('subscriptionPlan');
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        if (!org.subscriptionPlan) {
            throw new common_1.BadRequestException('Your organization does not have a subscription plan. Please purchase a plan first.');
        }
        if (org.subscriptionExpiry &&
            new Date(org.subscriptionExpiry) < new Date()) {
            throw new common_1.BadRequestException('Your subscription plan has expired. Please renew your plan.');
        }
        if (org.subscriptionPlan) {
            const plan = org.subscriptionPlan;
            if (plan.maxRestaurants !== undefined && plan.maxRestaurants > 0) {
                const currentCount = await this.restaurantModel.countDocuments({
                    organizationId: org._id.toString(),
                });
                if (currentCount >= plan.maxRestaurants) {
                    throw new common_1.BadRequestException('Restaurant limit reached for your organization subscription plan');
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
            ownerId: new mongoose_2.Types.ObjectId(ownerId),
            organizationId: new mongoose_2.Types.ObjectId(createRestaurantDto.organizationId),
        });
    }
    async findAll(query, organizationId) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', } = query || {};
        const filter = {};
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
        const range = (0, date_range_1.getDateRangeFromPreset)(query?.datePreset);
        if (range) {
            filter.createdAt = { $gte: range.from, $lte: range.to };
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
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
    async findByRestaurantId(restaurantId) {
        const restaurant = await this.restaurantModel
            .findById(restaurantId)
            .populate(this.organizationPopulate);
        if (!restaurant) {
            return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
        }
        return { data: [restaurant], total: 1, page: 1, limit: 10, totalPages: 1 };
    }
    async findOne(id) {
        const restaurant = await this.restaurantModel
            .findById(id)
            .populate(this.organizationPopulate);
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        return restaurant;
    }
    async findBySlug(slug) {
        const restaurant = await this.restaurantModel.findOne({
            slug,
            isActive: true,
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        return restaurant;
    }
    async getOrganizationSubscriptionState(organizationId) {
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
            .populate('subscriptionPlan', 'isPaymentGatewayAllocated isMenuPdfEnabled')
            .lean();
        const now = new Date();
        const subscriptionExpiry = organization?.subscriptionExpiry || null;
        const hasSubscriptionPlan = Boolean(organization?.subscriptionPlan);
        const isPlanExpired = Boolean(subscriptionExpiry && new Date(subscriptionExpiry) < now);
        const hasActivePlan = Boolean(hasSubscriptionPlan && !isPlanExpired);
        return {
            organizationIsActive: Boolean(organization?.isActive),
            subscriptionExpiry,
            hasSubscriptionPlan,
            hasActivePlan,
            isPlanExpired,
            isPaymentGatewayAllocated: Boolean(hasActivePlan &&
                organization?.subscriptionPlan?.isPaymentGatewayAllocated),
            isMenuPdfEnabled: Boolean(hasActivePlan && organization?.subscriptionPlan?.isMenuPdfEnabled),
        };
    }
    async getPublicInfo(id) {
        const restaurant = await this.restaurantModel
            .findById(id)
            .select('name logo address gst_no vat_no taxEnabled taxRate taxType vatEnabled vatRate vatType menuPdf organizationId isActive');
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        const subscriptionState = await this.getOrganizationSubscriptionState(restaurant.organizationId);
        const restaurantData = restaurant.toObject();
        const hasMenuPdf = Boolean(restaurantData.menuPdf);
        const canShowMenuPdf = Boolean(subscriptionState.isMenuPdfEnabled && hasMenuPdf);
        return {
            ...restaurantData,
            restaurantIsActive: Boolean(restaurantData.isActive),
            menuPdf: canShowMenuPdf ? restaurantData.menuPdf : '',
            ...subscriptionState,
            hasMenuPdf,
            canShowMenuPdf,
        };
    }
    async findByOwner(ownerId, query, organizationId) {
        if (!mongoose_2.Types.ObjectId.isValid(ownerId)) {
            throw new common_1.BadRequestException('Invalid ownerId');
        }
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', } = query || {};
        const filter = {};
        const ownerObjectId = new mongoose_2.Types.ObjectId(ownerId);
        if (organizationId) {
            if (!mongoose_2.Types.ObjectId.isValid(organizationId)) {
                throw new common_1.BadRequestException('Invalid organizationId');
            }
            const organizationObjectId = new mongoose_2.Types.ObjectId(organizationId);
            filter.$or = [
                { ownerId: ownerObjectId },
                { organizationId: organizationObjectId },
            ];
        }
        else {
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
        const range = (0, date_range_1.getDateRangeFromPreset)(query?.datePreset);
        if (range) {
            filter.createdAt = { $gte: range.from, $lte: range.to };
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
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
    async update(id, updateRestaurantDto) {
        const restaurant = await this.restaurantModel.findByIdAndUpdate(id, updateRestaurantDto, { new: true });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        return restaurant;
    }
    async remove(id) {
        const restaurant = await this.restaurantModel.findByIdAndDelete(id);
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        return { message: 'Restaurant deleted successfully' };
    }
    async uploadMenuPdf(restaurantId, file) {
        if (!file) {
            throw new common_1.BadRequestException('PDF file is required');
        }
        if (file?.mimetype && file.mimetype !== 'application/pdf') {
            throw new common_1.BadRequestException('Only PDF files are allowed');
        }
        const restaurant = await this.restaurantModel.findById(restaurantId);
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        const subscriptionState = await this.getOrganizationSubscriptionState(restaurant.organizationId);
        if (!subscriptionState.hasActivePlan) {
            throw new common_1.BadRequestException('An active subscription plan is required to upload a menu PDF');
        }
        if (!subscriptionState.isMenuPdfEnabled) {
            throw new common_1.BadRequestException('Your current subscription plan does not allow menu PDF upload');
        }
        const uploadsDir = path.resolve(process.cwd(), 'uploads', 'restaurants');
        await fs.mkdir(uploadsDir, { recursive: true });
        const filename = `${restaurantId}.pdf`;
        const diskPath = path.join(uploadsDir, filename);
        try {
            await fs.unlink(diskPath);
        }
        catch {
        }
        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
            throw new common_1.BadRequestException('Invalid upload payload');
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
};
exports.RestaurantsService = RestaurantsService;
exports.RestaurantsService = RestaurantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(restaurant_schema_1.Restaurant.name)),
    __param(1, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], RestaurantsService);
//# sourceMappingURL=restaurants.service.js.map