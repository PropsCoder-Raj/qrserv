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
exports.OrganizationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const organizations_service_1 = require("./organizations.service");
const create_organization_dto_1 = require("./dto/create-organization.dto");
const update_organization_dto_1 = require("./dto/update-organization.dto");
const decorators_1 = require("../../common/decorators");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
let OrganizationsController = class OrganizationsController {
    constructor(organizationsService) {
        this.organizationsService = organizationsService;
    }
    create(dto) {
        return this.organizationsService.create(dto);
    }
    findAll(query, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            return this.organizationsService.findById(organizationId);
        }
        return this.organizationsService.findAll(query);
    }
    findMyOrganization(organizationId) {
        return this.organizationsService.findOne(organizationId);
    }
    getOrderSummary(id, restaurantId, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            return this.organizationsService.getOrderSummary(organizationId, restaurantId);
        }
        return this.organizationsService.getOrderSummary(id, restaurantId);
    }
    getRazorpayOrderHistory(id, query, restaurantId, role, organizationId) {
        const nextQuery = restaurantId
            ? { ...(query || {}), restaurantId }
            : query;
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            return this.organizationsService.getRazorpayOrderHistory(organizationId, nextQuery);
        }
        return this.organizationsService.getRazorpayOrderHistory(id, nextQuery);
    }
    getRazorpayPaymentDetails(id, paymentId, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            return this.organizationsService.getRazorpayPaymentDetails(organizationId, paymentId);
        }
        return this.organizationsService.getRazorpayPaymentDetails(id, paymentId);
    }
    findOne(id, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            return this.organizationsService.findOne(organizationId);
        }
        return this.organizationsService.findOne(id);
    }
    update(id, dto, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            return this.organizationsService.update(organizationId, dto);
        }
        return this.organizationsService.update(id, dto);
    }
    remove(id) {
        return this.organizationsService.remove(id);
    }
    findRestaurants(id, query, role, organizationId) {
        if (role === decorators_1.Role.ORG_ADMIN && organizationId) {
            return this.organizationsService.findRestaurants(organizationId, query);
        }
        return this.organizationsService.findRestaurants(id, query);
    }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new organization (SUPER_ADMIN only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_organization_dto_1.CreateOrganizationDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all organizations' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Get current user's organization (ORG_ADMIN)" }),
    __param(0, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findMyOrganization", null);
__decorate([
    (0, common_1.Get)(':id/order-summary'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Get organization order summary (total orders and Razorpay paid orders)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('restaurantId')),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "getOrderSummary", null);
__decorate([
    (0, common_1.Get)(':id/razorpay-orders'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Get organization Razorpay paid order history with pagination and search',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('restaurantId')),
    __param(3, (0, decorators_1.CurrentUser)('role')),
    __param(4, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto, String, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "getRazorpayOrderHistory", null);
__decorate([
    (0, common_1.Get)(':id/razorpay-payment/:paymentId'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Get full Razorpay payment details for an organization payment',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "getRazorpayPaymentDetails", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get organization by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update an organization' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_organization_dto_1.UpdateOrganizationDto, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an organization (SUPER_ADMIN only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/restaurants'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all restaurants in an organization' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, decorators_1.CurrentUser)('role')),
    __param(3, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findRestaurants", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, swagger_1.ApiTags)('Organizations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/organizations'),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map