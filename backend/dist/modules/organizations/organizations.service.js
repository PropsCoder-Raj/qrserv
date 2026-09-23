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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const config_1 = require("@nestjs/config");
const organization_schema_1 = require("../../schemas/organization.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const order_schema_1 = require("../../schemas/order.schema");
const date_range_1 = require("../../common/utils/date-range");
let OrganizationsService = class OrganizationsService {
    constructor(organizationModel, restaurantModel, orderModel, configService) {
        this.organizationModel = organizationModel;
        this.restaurantModel = restaurantModel;
        this.orderModel = orderModel;
        this.configService = configService;
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
            key_id: this.configService.get('razorpay.keyId'),
            key_secret: this.configService.get('razorpay.keySecret'),
        });
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    async create(dto) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.ownerId)) {
            throw new common_1.BadRequestException('Invalid ownerId');
        }
        let slug = this.generateSlug(dto.name);
        const existing = await this.organizationModel.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }
        return this.organizationModel.create({
            ...dto,
            slug,
            ownerId: new mongoose_2.Types.ObjectId(dto.ownerId),
        });
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', } = query || {};
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
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
    async findById(id) {
        const org = await this.organizationModel
            .findById(id)
            .populate('subscriptionPlan')
            .populate('ownerId', 'name email');
        if (!org) {
            return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
        }
        return { data: [org], total: 1, page: 1, limit: 10, totalPages: 1 };
    }
    async findOne(id) {
        const org = await this.organizationModel
            .findById(id)
            .populate('subscriptionPlan')
            .populate('ownerId', 'name email');
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return org;
    }
    async findByOwner(ownerId) {
        const org = await this.organizationModel
            .findOne({ ownerId })
            .populate('subscriptionPlan')
            .populate('ownerId', 'name email');
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return org;
    }
    async update(id, dto) {
        const org = await this.organizationModel.findByIdAndUpdate(id, dto, {
            new: true,
        });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return org;
    }
    async remove(id) {
        const org = await this.organizationModel.findByIdAndDelete(id);
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return { message: 'Organization deleted successfully' };
    }
    async findRestaurants(orgId, query) {
        const org = await this.organizationModel.findById(orgId);
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', } = query || {};
        const filter = { organizationId: orgId };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
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
    async getOrderSummary(orgId, restaurantId) {
        const org = await this.organizationModel
            .findById(orgId)
            .populate('subscriptionPlan')
            .populate('ownerId', 'name email');
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
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
    async getRazorpayOrderHistory(orgId, query) {
        const org = await this.organizationModel.findById(orgId).select('_id');
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', } = query || {};
        const restaurantId = query?.restaurantId;
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
        const filter = {
            restaurantId: { $in: restaurantIds },
            razorpayPaymentId: { $exists: true, $ne: '' },
            paymentStatus: 'paid',
        };
        const range = (0, date_range_1.getDateRangeFromPreset)(query?.datePreset);
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
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
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
    async getRazorpayPaymentDetails(orgId, paymentId) {
        const org = await this.organizationModel.findById(orgId).select('_id');
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const restaurants = await this.restaurantModel
            .find({ organizationId: orgId })
            .select('_id')
            .lean();
        const restaurantIds = restaurants.map((r) => r._id);
        if (!restaurantIds.length) {
            throw new common_1.NotFoundException('No restaurants found for organization');
        }
        const order = await this.orderModel
            .findOne({
            restaurantId: { $in: restaurantIds },
            razorpayPaymentId: paymentId,
        })
            .populate('restaurantId', 'name')
            .lean();
        if (!order) {
            throw new common_1.NotFoundException('Razorpay payment record not found for this organization');
        }
        let paymentDetails = null;
        let razorpayOrderDetails = null;
        try {
            paymentDetails = await this.razorpay.payments.fetch(paymentId);
            if (paymentDetails?.order_id) {
                razorpayOrderDetails = await this.razorpay.orders.fetch(paymentDetails.order_id);
            }
        }
        catch (err) {
            const message = err?.error?.description ||
                err?.message ||
                'Failed to fetch Razorpay payment details';
            throw new common_1.BadRequestException(message);
        }
        return {
            order,
            paymentDetails,
            razorpayOrderDetails,
        };
    }
    async getScopedRestaurantIds(orgId, restaurantId) {
        if (restaurantId && !mongoose_2.Types.ObjectId.isValid(restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        const restaurants = await this.restaurantModel
            .find({ organizationId: orgId })
            .select('_id')
            .lean();
        const allRestaurantIds = restaurants.map((r) => r._id);
        if (!restaurantId) {
            return allRestaurantIds;
        }
        const isAllowed = allRestaurantIds.some((id) => id.toString() === restaurantId.toString());
        if (!isAllowed) {
            throw new common_1.BadRequestException('Selected restaurant does not belong to this organization');
        }
        return allRestaurantIds.filter((id) => id.toString() === restaurantId);
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __param(1, (0, mongoose_1.InjectModel)(restaurant_schema_1.Restaurant.name)),
    __param(2, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map