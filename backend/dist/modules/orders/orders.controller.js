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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const update_order_status_dto_1 = require("./dto/update-order-status.dto");
const update_payment_status_dto_1 = require("./dto/update-payment-status.dto");
const cancel_order_item_dto_1 = require("./dto/cancel-order-item.dto");
const rollback_failed_order_dto_1 = require("./dto/rollback-failed-order.dto");
const update_customer_order_items_dto_1 = require("./dto/update-customer-order-items.dto");
const decorators_1 = require("../../common/decorators");
const order_schema_1 = require("../../schemas/order.schema");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    create(dto) {
        return this.ordersService.create(dto);
    }
    createForCustomerApp(dto) {
        return this.ordersService.createForCustomerApp(dto);
    }
    rollbackFailedCustomerOrder(dto) {
        return this.ordersService.rollbackFailedCustomerOrder(dto.orderId, dto.razorpayOrderId);
    }
    updateCustomerTableOrderItems(id, dto) {
        return this.ordersService.updateCustomerTableOrderItems(id, dto.items);
    }
    async findAll(restaurantId, status, query, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.SUPER_ADMIN) {
            return this.ordersService.findAll(restaurantId || undefined, status, query);
        }
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            if (restaurantId) {
                await this.ordersService.validateOrgRestaurant(restaurantId, organizationId);
                return this.ordersService.findAll(restaurantId, status, query);
            }
            return this.ordersService.findAllByOrganization(organizationId, status, query);
        }
        const effectiveRestaurantId = userRestaurantId || restaurantId;
        return this.ordersService.findAll(effectiveRestaurantId, status, query);
    }
    async getStats(restaurantId, query, user, role, organizationId, userRestaurantId) {
        if (role === decorators_1.Role.SUPER_ADMIN) {
            return this.ordersService.getStats(restaurantId, query?.datePreset);
        }
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            if (restaurantId) {
                await this.ordersService.validateOrgRestaurant(restaurantId, organizationId);
                return this.ordersService.getStats(restaurantId, query?.datePreset);
            }
            return this.ordersService.getStatsByOrganization(organizationId, query?.datePreset);
        }
        const effectiveRestaurantId = userRestaurantId || restaurantId;
        return this.ordersService.getStats(effectiveRestaurantId, query?.datePreset);
    }
    findByPhone(phone) {
        return this.ordersService.findByPhone(phone);
    }
    getStatus(id) {
        return this.ordersService.getStatus(id);
    }
    findOne(id) {
        return this.ordersService.findOne(id);
    }
    updateStatus(id, dto) {
        return this.ordersService.updateStatus(id, dto);
    }
    updatePaymentStatus(id, dto) {
        return this.ordersService.updatePaymentStatus(id, dto);
    }
    cancelOrderItem(id, dto, userId) {
        return this.ordersService.cancelOrderItem(id, dto, userId);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Place a new order (public, no auth)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('customer/create'),
    (0, swagger_1.ApiOperation)({
        summary: 'Place customer app order and create Razorpay payment order if enabled by subscription',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createForCustomerApp", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('customer/rollback-failed'),
    (0, swagger_1.ApiOperation)({
        summary: 'Rollback a customer order when Razorpay payment is cancelled/failed',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rollback_failed_order_dto_1.RollbackFailedOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "rollbackFailedCustomerOrder", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Patch)('customer/:id/items'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update items for an unpaid table order from customer app',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_customer_order_items_dto_1.UpdateCustomerOrderItemsDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateCustomerTableOrderItems", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER, decorators_1.Role.STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Get orders (filtered by restaurant/status)' }),
    __param(0, (0, common_1.Query)('restaurantId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, decorators_1.CurrentUser)('role')),
    __param(4, (0, decorators_1.CurrentUser)('organizationId')),
    __param(5, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, pagination_query_dto_1.PaginationQueryDto, String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER, decorators_1.Role.STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Get order statistics and revenue data' }),
    __param(0, (0, common_1.Query)('restaurantId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __param(3, (0, decorators_1.CurrentUser)('role')),
    __param(4, (0, decorators_1.CurrentUser)('organizationId')),
    __param(5, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getStats", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('history/:phone'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order history by customer phone (public)' }),
    __param(0, (0, common_1.Param)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findByPhone", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Track order status (public)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get order by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER, decorators_1.Role.STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update order status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_order_status_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/payment-status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER, decorators_1.Role.STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update payment status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_payment_status_dto_1.UpdatePaymentStatusDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updatePaymentStatus", null);
__decorate([
    (0, common_1.Patch)(':id/items/cancel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, decorators_1.Roles)(decorators_1.Role.MANAGER, decorators_1.Role.STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel single order item quantity (manager/staff)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancel_order_item_dto_1.CancelOrderItemDto, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "cancelOrderItem", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, common_1.Controller)('api/orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map