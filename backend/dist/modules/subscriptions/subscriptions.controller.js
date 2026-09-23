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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const subscriptions_service_1 = require("./subscriptions.service");
const create_subscription_dto_1 = require("./dto/create-subscription.dto");
const update_subscription_dto_1 = require("./dto/update-subscription.dto");
const assign_subscription_dto_1 = require("./dto/assign-subscription.dto");
const verify_subscription_payment_dto_1 = require("./dto/verify-subscription-payment.dto");
const decorators_1 = require("../../common/decorators");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
const purchase_subscription_dto_1 = require("./dto/purchase-subscription.dto");
const create_autopay_subscription_dto_1 = require("./dto/create-autopay-subscription.dto");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
let SubscriptionsController = class SubscriptionsController {
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }
    create(dto) {
        return this.subscriptionsService.create(dto);
    }
    findAll(query) {
        return this.subscriptionsService.findAll(query);
    }
    findAllPlans() {
        return this.subscriptionsService.findAllPlans();
    }
    findAllPlansWithApiKey() {
        return this.subscriptionsService.findAllPlans();
    }
    async purchase(dto, user, organizationId, userId) {
        const subscription = await this.subscriptionsService.findOne(dto.subscriptionId);
        if (subscription.isPaymentGatewayAllocated) {
            throw new common_1.BadRequestException('Payment gateway is allocated for this plan. Use create-order to continue.');
        }
        console.log('CurrentUser JSON:', JSON.stringify(user, null, 2));
        return this.subscriptionsService.purchaseSubscription(dto.subscriptionId, dto.months, dto.autoPay, organizationId, userId);
    }
    async createSubscriptionOrder(dto, organizationId) {
        console.log('🚀 ~ SubscriptionsController ~ createSubscriptionOrder ~ dto:', dto);
        console.log('🚀 ~ SubscriptionsController ~ createSubscriptionOrder ~ organizationId:', organizationId);
        return this.subscriptionsService.createSubscriptionOrder(dto.subscriptionId, dto.months, dto.autoPay, organizationId);
    }
    createAutopaySubscription(dto, organizationId, userId) {
        return this.subscriptionsService.createAutopaySubscription(dto.subscriptionId, dto.months, organizationId, userId);
    }
    verifySubscriptionPayment(user, dto, organizationId, userId) {
        console.log('🚀 ~ SubscriptionsController ~ verifySubscriptionPayment ~ user:', user);
        console.log('🚀 ~ SubscriptionsController ~ verifySubscriptionPayment ~ userId:', userId);
        console.log('🚀 ~ SubscriptionsController ~ verifySubscriptionPayment ~ organizationId:', organizationId);
        return this.subscriptionsService.verifySubscriptionPayment(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature, dto.subscriptionId, dto.months, dto.autoPay, organizationId, userId);
    }
    getMyHistory(organizationId) {
        return this.subscriptionsService.getSubscriptionHistory(organizationId);
    }
    getMyActivePlan(organizationId) {
        return this.subscriptionsService.getActiveSubscriptionPlan(organizationId);
    }
    setMyAutoPay(organizationId, enabled) {
        return this.subscriptionsService.setAutoPayEnabled(organizationId, enabled);
    }
    webhook(req, body) {
        const signature = req.headers?.['x-razorpay-signature'] || '';
        const rawBody = req.rawBody || '';
        return this.subscriptionsService.handleWebhook(body, signature, rawBody);
    }
    getAllHistory(query) {
        return this.subscriptionsService.getAllSubscriptionHistory(query);
    }
    getPlanAnalytics() {
        return this.subscriptionsService.getPlanAnalytics();
    }
    findOne(id) {
        return this.subscriptionsService.findOne(id);
    }
    update(id, dto) {
        return this.subscriptionsService.update(id, dto);
    }
    remove(id) {
        return this.subscriptionsService.remove(id);
    }
    assign(dto) {
        return this.subscriptionsService.assignToOrganization(dto);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a subscription plan' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_dto_1.CreateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscription plans' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available subscription plans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "findAllPlans", null);
__decorate([
    (0, common_1.Get)('public/plans'),
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all available subscription plans (API KEY auth)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "findAllPlansWithApiKey", null);
__decorate([
    (0, common_1.Post)('purchase'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase a free subscription plan directly' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __param(3, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchase_subscription_dto_1.PurchaseSubscriptionDto, Object, String, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "purchase", null);
__decorate([
    (0, common_1.Post)('create-order'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a Razorpay order for subscription purchase',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchase_subscription_dto_1.PurchaseSubscriptionDto, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "createSubscriptionOrder", null);
__decorate([
    (0, common_1.Post)('create-autopay-subscription'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Create Razorpay subscription (recurring) for auto-pay (paid plans)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('organizationId')),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_autopay_subscription_dto_1.CreateAutopaySubscriptionDto, String, String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "createAutopaySubscription", null);
__decorate([
    (0, common_1.Post)('verify-payment'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify Razorpay payment and activate subscription',
    }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __param(3, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_subscription_payment_dto_1.VerifySubscriptionPaymentDto, String, String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "verifySubscriptionPayment", null);
__decorate([
    (0, common_1.Get)('my-history'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Get subscription purchase history for current org',
    }),
    __param(0, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getMyHistory", null);
__decorate([
    (0, common_1.Get)('my-active-plan'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get active subscription plan for current org' }),
    __param(0, (0, decorators_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getMyActivePlan", null);
__decorate([
    (0, common_1.Patch)('my-auto-pay'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Enable/disable auto-pay for current org subscription',
    }),
    __param(0, (0, decorators_1.CurrentUser)('organizationId')),
    __param(1, (0, common_1.Body)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "setMyAutoPay", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Razorpay subscription webhook handler' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "webhook", null);
__decorate([
    (0, common_1.Get)('all-history'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all subscription purchase history (super admin)',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getAllHistory", null);
__decorate([
    (0, common_1.Get)('analytics/plans'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Get subscription analytics by plan with active and total purchase counts',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getPlanAnalytics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get a subscription plan by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a subscription plan' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_subscription_dto_1.UpdateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a subscription plan' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a subscription to an organization' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_subscription_dto_1.AssignSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "assign", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('Subscriptions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/subscriptions'),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map