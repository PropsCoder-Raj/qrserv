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
exports.TablesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const table_schema_1 = require("../../schemas/table.schema");
const order_schema_1 = require("../../schemas/order.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const organization_schema_1 = require("../../schemas/organization.schema");
const date_range_1 = require("../../common/utils/date-range");
let TablesService = class TablesService {
    constructor(tableModel, orderModel, restaurantModel, organizationModel) {
        this.tableModel = tableModel;
        this.orderModel = orderModel;
        this.restaurantModel = restaurantModel;
        this.organizationModel = organizationModel;
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
    async create(dto, organizationId) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        const restaurantObjectId = new mongoose_2.Types.ObjectId(dto.restaurantId);
        await this.validateActiveSubscription(dto.restaurantId);
        const currentCount = await this.tableModel.countDocuments({
            restaurantId: restaurantObjectId,
        });
        if (organizationId) {
            const org = await this.organizationModel
                .findById(organizationId.toString())
                .populate('subscriptionPlan');
            if (org?.subscriptionPlan) {
                const plan = org.subscriptionPlan;
                if (plan.maxTables !== undefined &&
                    plan.maxTables > 0 &&
                    currentCount >= plan.maxTables) {
                    throw new common_1.BadRequestException('Maximum table limit reached per restaurant.');
                }
            }
        }
        return this.tableModel.create({
            ...dto,
            restaurantId: restaurantObjectId,
        });
    }
    async findAll(restaurantId, query) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'asc', } = query || {};
        if (!mongoose_2.Types.ObjectId.isValid(restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        const filter = {
            restaurantId: new mongoose_2.Types.ObjectId(restaurantId),
        };
        const range = (0, date_range_1.getDateRangeFromPreset)(query?.datePreset);
        if (range) {
            filter.createdAt = { $gte: range.from, $lte: range.to };
        }
        if (search) {
            filter.$or = [{ tableNumber: { $regex: search, $options: 'i' } }];
        }
        const sort = {};
        if (sortBy) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }
        else {
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
        const tableIds = data.map((table) => table._id);
        const activeOrders = tableIds.length
            ? await this.orderModel
                .find({
                tableId: { $in: tableIds },
                status: { $ne: order_schema_1.OrderStatus.CANCELLED },
                $nor: [
                    {
                        status: order_schema_1.OrderStatus.SERVED,
                        paymentStatus: order_schema_1.PaymentStatus.PAID,
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
        const tablesWithEngageStatus = data.map((table) => {
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
    async getPublicInfo(id) {
        const table = await this.tableModel
            .findById(id)
            .select('tableNumber capacity isActive');
        if (!table)
            throw new common_1.NotFoundException('Table not found');
        return table;
    }
    async findOne(id) {
        const table = await this.tableModel.findById(id);
        if (!table)
            throw new common_1.NotFoundException('Table not found');
        return table;
    }
    async update(id, dto) {
        const table = await this.tableModel.findByIdAndUpdate(id, dto, {
            new: true,
        });
        if (!table)
            throw new common_1.NotFoundException('Table not found');
        return table;
    }
    async remove(id) {
        const table = await this.tableModel.findByIdAndDelete(id);
        if (!table)
            throw new common_1.NotFoundException('Table not found');
        return { message: 'Table deleted' };
    }
};
exports.TablesService = TablesService;
exports.TablesService = TablesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(table_schema_1.Table.name)),
    __param(1, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(2, (0, mongoose_1.InjectModel)(restaurant_schema_1.Restaurant.name)),
    __param(3, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], TablesService);
//# sourceMappingURL=tables.service.js.map