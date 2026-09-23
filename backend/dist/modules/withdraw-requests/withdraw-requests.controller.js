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
exports.WithdrawRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const decorators_1 = require("../../common/decorators");
const withdraw_requests_service_1 = require("./withdraw-requests.service");
const create_withdraw_request_dto_1 = require("./dto/create-withdraw-request.dto");
const list_withdraw_requests_dto_1 = require("./dto/list-withdraw-requests.dto");
const approve_withdraw_request_dto_1 = require("./dto/approve-withdraw-request.dto");
const pay_withdraw_request_dto_1 = require("./dto/pay-withdraw-request.dto");
const create_withdraw_bank_detail_dto_1 = require("./dto/create-withdraw-bank-detail.dto");
const update_withdraw_bank_detail_dto_1 = require("./dto/update-withdraw-bank-detail.dto");
let WithdrawRequestsController = class WithdrawRequestsController {
    constructor(withdrawRequestsService) {
        this.withdrawRequestsService = withdrawRequestsService;
    }
    create(dto, organizationId, userId) {
        return this.withdrawRequestsService.create(organizationId, userId, dto);
    }
    getBankDetails(organizationId, userId) {
        return this.withdrawRequestsService.getBankDetails(organizationId, userId);
    }
    createBankDetail(dto, organizationId, userId) {
        return this.withdrawRequestsService.createBankDetail(organizationId, userId, dto);
    }
    updateBankDetail(id, dto, organizationId, userId) {
        return this.withdrawRequestsService.updateBankDetail(id, organizationId, userId, dto);
    }
    removeBankDetail(id, organizationId, userId) {
        return this.withdrawRequestsService.removeBankDetail(id, organizationId, userId);
    }
    async findAll(query, role, organizationId, restaurantId) {
        const resolvedOrganizationId = role === decorators_1.Role.SUPER_ADMIN
            ? undefined
            : await this.withdrawRequestsService.resolveOrganizationId(organizationId, restaurantId);
        return this.withdrawRequestsService.findAll(query, {
            role,
            organizationId: resolvedOrganizationId || undefined,
        });
    }
    async getSummary(organizationId, restaurantId) {
        const resolvedOrganizationId = await this.withdrawRequestsService.resolveOrganizationId(organizationId, restaurantId);
        if (!resolvedOrganizationId) {
            return {
                razorpayCollectedAmount: 0,
                paidWithdrawAmount: 0,
                availableAmount: 0,
                withdrawChargePercentage: this.withdrawRequestsService.getWithdrawChargePercentage(),
                withdrawChargeGstPercentage: this.withdrawRequestsService.getWithdrawChargeGstPercentage(),
            };
        }
        return this.withdrawRequestsService.getAvailableSummary(resolvedOrganizationId);
    }
    approve(id, dto, userId) {
        return this.withdrawRequestsService.approve(id, userId, dto);
    }
    markPaid(id, dto, file, userId) {
        return this.withdrawRequestsService.markPaid(id, userId, dto, file);
    }
};
exports.WithdrawRequestsController = WithdrawRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create withdraw request (ORG_ADMIN only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('organizationId')),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_withdraw_request_dto_1.CreateWithdrawRequestDto, String, String]),
    __metadata("design:returntype", void 0)
], WithdrawRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('bank-details'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List saved withdraw bank details for the current org admin' }),
    __param(0, (0, decorators_1.CurrentUser)('organizationId')),
    __param(1, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WithdrawRequestsController.prototype, "getBankDetails", null);
__decorate([
    (0, common_1.Post)('bank-details'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update a saved withdraw bank detail' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('organizationId')),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_withdraw_bank_detail_dto_1.CreateWithdrawBankDetailDto, String, String]),
    __metadata("design:returntype", void 0)
], WithdrawRequestsController.prototype, "createBankDetail", null);
__decorate([
    (0, common_1.Patch)('bank-details/:id'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a saved withdraw bank detail' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __param(3, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_withdraw_bank_detail_dto_1.UpdateWithdrawBankDetailDto, String, String]),
    __metadata("design:returntype", void 0)
], WithdrawRequestsController.prototype, "updateBankDetail", null);
__decorate([
    (0, common_1.Delete)('bank-details/:id'),
    (0, decorators_1.Roles)(decorators_1.Role.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a saved withdraw bank detail' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('organizationId')),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WithdrawRequestsController.prototype, "removeBankDetail", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER, decorators_1.Role.STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'List withdraw requests with role-based organization scoping',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, decorators_1.CurrentUser)('organizationId')),
    __param(3, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_withdraw_requests_dto_1.ListWithdrawRequestsDto, String, String, String]),
    __metadata("design:returntype", Promise)
], WithdrawRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN, decorators_1.Role.ORG_ADMIN, decorators_1.Role.RESTAURANT_OWNER, decorators_1.Role.MANAGER, decorators_1.Role.STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Get available withdraw amount summary for the current organization',
    }),
    __param(0, (0, decorators_1.CurrentUser)('organizationId')),
    __param(1, (0, decorators_1.CurrentUser)('restaurantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WithdrawRequestsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a withdraw request (SUPER_ADMIN only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_withdraw_request_dto_1.ApproveWithdrawRequestDto, String]),
    __metadata("design:returntype", void 0)
], WithdrawRequestsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/pay'),
    (0, decorators_1.Roles)(decorators_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Mark an approved withdraw request as paid (SUPER_ADMIN only)',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                paymentReference: { type: 'string' },
                paymentNote: { type: 'string' },
                file: { type: 'string', format: 'binary' },
            },
            required: ['file'],
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowedMimeTypes = [
                'application/pdf',
                'image/png',
                'image/jpeg',
                'image/jpg',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            if (!allowedMimeTypes.includes(file?.mimetype)) {
                return cb(new Error('Only PNG, JPG, PDF, DOC, and DOCX files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, decorators_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pay_withdraw_request_dto_1.PayWithdrawRequestDto, Object, String]),
    __metadata("design:returntype", void 0)
], WithdrawRequestsController.prototype, "markPaid", null);
exports.WithdrawRequestsController = WithdrawRequestsController = __decorate([
    (0, swagger_1.ApiTags)('Withdraw Requests'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/withdraw-requests'),
    __metadata("design:paramtypes", [withdraw_requests_service_1.WithdrawRequestsService])
], WithdrawRequestsController);
//# sourceMappingURL=withdraw-requests.controller.js.map