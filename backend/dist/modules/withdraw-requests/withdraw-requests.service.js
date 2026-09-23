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
exports.WithdrawRequestsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
const date_range_1 = require("../../common/utils/date-range");
const order_schema_1 = require("../../schemas/order.schema");
const restaurant_schema_1 = require("../../schemas/restaurant.schema");
const withdraw_bank_detail_schema_1 = require("../../schemas/withdraw-bank-detail.schema");
const withdraw_request_schema_1 = require("../../schemas/withdraw-request.schema");
let WithdrawRequestsService = class WithdrawRequestsService {
    constructor(configService, withdrawBankDetailModel, withdrawRequestModel, restaurantModel, orderModel) {
        this.configService = configService;
        this.withdrawBankDetailModel = withdrawBankDetailModel;
        this.withdrawRequestModel = withdrawRequestModel;
        this.restaurantModel = restaurantModel;
        this.orderModel = orderModel;
    }
    getWithdrawChargePercentage() {
        const configuredValue = Number(this.configService.get('withdraw.chargePercentage') || 0);
        if (Number.isNaN(configuredValue)) {
            return 0;
        }
        return Math.max(0, configuredValue);
    }
    getWithdrawChargeGstPercentage() {
        const configuredValue = Number(this.configService.get('withdraw.chargeGstPercentage') || 0);
        if (Number.isNaN(configuredValue)) {
            return 0;
        }
        return Math.max(0, configuredValue);
    }
    calculateWithdrawAmounts(amount) {
        const requestAmount = Number(amount || 0);
        const chargePercentage = this.getWithdrawChargePercentage();
        const chargeGstPercentage = this.getWithdrawChargeGstPercentage();
        const chargeBaseAmount = Number(((requestAmount * chargePercentage) / 100).toFixed(2));
        const chargeGstAmount = Number(((chargeBaseAmount * chargeGstPercentage) / 100).toFixed(2));
        const chargeAmount = Number((chargeBaseAmount + chargeGstAmount).toFixed(2));
        const netAmount = Number((requestAmount - chargeAmount).toFixed(2));
        return {
            chargePercentage,
            chargeBaseAmount,
            chargeGstPercentage,
            chargeGstAmount,
            chargeAmount,
            netAmount,
        };
    }
    toObjectId(value, fieldName) {
        if (value instanceof mongoose_2.Types.ObjectId) {
            return value;
        }
        if (!mongoose_2.Types.ObjectId.isValid(value)) {
            throw new common_1.BadRequestException(`Invalid ${fieldName}`);
        }
        return new mongoose_2.Types.ObjectId(value);
    }
    async resolveOrganizationId(organizationId, restaurantId) {
        if (organizationId) {
            if (!mongoose_2.Types.ObjectId.isValid(organizationId)) {
                throw new common_1.BadRequestException('Invalid organizationId');
            }
            return organizationId;
        }
        if (!restaurantId)
            return null;
        if (!mongoose_2.Types.ObjectId.isValid(restaurantId)) {
            throw new common_1.BadRequestException('Invalid restaurantId');
        }
        const restaurant = await this.restaurantModel
            .findById(restaurantId)
            .select('organizationId')
            .lean();
        return restaurant?.organizationId?.toString() || null;
    }
    normalizeBankDetailInput(dto, current) {
        const bankDetailType = dto.bankDetailType ||
            current?.bankDetailType ||
            withdraw_bank_detail_schema_1.WithdrawBankDetailType.PERSONAL;
        const customBankDetailLabel = dto.customBankDetailLabel?.trim() ??
            current?.customBankDetailLabel?.trim() ??
            '';
        const accountHolderName = dto.accountHolderName?.trim() ?? current?.accountHolderName?.trim() ?? '';
        const bankName = dto.bankName?.trim() ?? current?.bankName?.trim() ?? '';
        const accountNumber = dto.accountNumber?.trim() ?? current?.accountNumber?.trim() ?? '';
        const ifscCode = (dto.ifscCode?.trim() ?? current?.ifscCode?.trim() ?? '').toUpperCase();
        if (bankDetailType === withdraw_bank_detail_schema_1.WithdrawBankDetailType.OTHER && !customBankDetailLabel) {
            throw new common_1.BadRequestException('Custom bank detail label is required for Other');
        }
        return {
            bankDetailType,
            customBankDetailLabel,
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode,
        };
    }
    async getOwnedBankDetail(id, organizationId, userId) {
        const bankDetail = await this.withdrawBankDetailModel.findOne({
            _id: this.toObjectId(id, 'bankDetailId'),
            organizationId: this.toObjectId(organizationId, 'organizationId'),
            userId: this.toObjectId(userId, 'userId'),
        });
        if (!bankDetail) {
            throw new common_1.NotFoundException('Saved bank detail not found');
        }
        return bankDetail;
    }
    async getBankDetails(organizationId, userId) {
        return this.withdrawBankDetailModel
            .find({
            organizationId: this.toObjectId(organizationId, 'organizationId'),
            userId: this.toObjectId(userId, 'userId'),
        })
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean();
    }
    async createBankDetail(organizationId, userId, dto) {
        const organizationObjectId = this.toObjectId(organizationId, 'organizationId');
        const userObjectId = this.toObjectId(userId, 'userId');
        const normalized = this.normalizeBankDetailInput(dto);
        return this.withdrawBankDetailModel.create({
            organizationId: organizationObjectId,
            userId: userObjectId,
            ...normalized,
        });
    }
    async updateBankDetail(id, organizationId, userId, dto) {
        const bankDetail = await this.getOwnedBankDetail(id, organizationId, userId);
        const normalized = this.normalizeBankDetailInput(dto, bankDetail);
        bankDetail.bankDetailType = normalized.bankDetailType;
        bankDetail.customBankDetailLabel = normalized.customBankDetailLabel;
        bankDetail.accountHolderName = normalized.accountHolderName;
        bankDetail.bankName = normalized.bankName;
        bankDetail.accountNumber = normalized.accountNumber;
        bankDetail.ifscCode = normalized.ifscCode;
        return bankDetail.save();
    }
    async removeBankDetail(id, organizationId, userId) {
        const bankDetail = await this.getOwnedBankDetail(id, organizationId, userId);
        await bankDetail.deleteOne();
        return { success: true };
    }
    async create(organizationId, requestedByUserId, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(organizationId)) {
            throw new common_1.BadRequestException('Invalid organizationId');
        }
        if (!mongoose_2.Types.ObjectId.isValid(requestedByUserId)) {
            throw new common_1.BadRequestException('Invalid requestedByUserId');
        }
        if (dto.bankDetailId && !mongoose_2.Types.ObjectId.isValid(dto.bankDetailId)) {
            throw new common_1.BadRequestException('Invalid bankDetailId');
        }
        const summary = await this.getAvailableSummary(organizationId);
        if (Number(dto.amount) > Number(summary.availableAmount)) {
            throw new common_1.BadRequestException('Requested amount exceeds available withdraw amount');
        }
        let savedBankDetail = null;
        if (dto.bankDetailId) {
            savedBankDetail = await this.getOwnedBankDetail(dto.bankDetailId, organizationId, requestedByUserId);
        }
        const accountHolderName = savedBankDetail
            ? savedBankDetail.accountHolderName
            : dto.accountHolderName.trim();
        const bankName = savedBankDetail ? savedBankDetail.bankName : dto.bankName.trim();
        const accountNumber = savedBankDetail
            ? savedBankDetail.accountNumber
            : dto.accountNumber.trim();
        const ifscCode = savedBankDetail
            ? savedBankDetail.ifscCode
            : dto.ifscCode.toUpperCase().trim();
        const withdrawAmounts = this.calculateWithdrawAmounts(Number(dto.amount));
        return this.withdrawRequestModel.create({
            organizationId: new mongoose_2.Types.ObjectId(organizationId),
            requestedByUserId: new mongoose_2.Types.ObjectId(requestedByUserId),
            amount: dto.amount,
            ...withdrawAmounts,
            note: dto.note?.trim() || '',
            bankDetailId: savedBankDetail?._id || null,
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode,
            status: withdraw_request_schema_1.WithdrawRequestStatus.PENDING,
        });
    }
    async getAvailableSummary(organizationId) {
        const organizationObjectId = organizationId instanceof mongoose_2.Types.ObjectId
            ? organizationId
            : new mongoose_2.Types.ObjectId(organizationId);
        const restaurants = await this.restaurantModel
            .find({ organizationId: organizationObjectId })
            .select('_id')
            .lean();
        const restaurantIds = restaurants.map((restaurant) => restaurant._id instanceof mongoose_2.Types.ObjectId
            ? restaurant._id
            : new mongoose_2.Types.ObjectId(restaurant._id));
        let razorpayCollectedAmount = 0;
        if (restaurantIds.length) {
            const [orderStats] = await this.orderModel.aggregate([
                {
                    $match: {
                        restaurantId: { $in: restaurantIds },
                        paymentStatus: order_schema_1.PaymentStatus.PAID,
                        razorpayPaymentId: { $exists: true, $ne: '' },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$totalAmount' },
                    },
                },
            ]);
            razorpayCollectedAmount = Number(orderStats?.totalAmount || 0);
        }
        const [withdrawStats] = await this.withdrawRequestModel.aggregate([
            {
                $match: {
                    organizationId: organizationObjectId,
                    status: withdraw_request_schema_1.WithdrawRequestStatus.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                },
            },
        ]);
        const paidWithdrawAmount = Number(withdrawStats?.totalAmount || 0);
        const availableAmount = Math.max(0, razorpayCollectedAmount - paidWithdrawAmount);
        return {
            razorpayCollectedAmount,
            paidWithdrawAmount,
            availableAmount,
            withdrawChargePercentage: this.getWithdrawChargePercentage(),
            withdrawChargeGstPercentage: this.getWithdrawChargeGstPercentage(),
        };
    }
    async findAll(query, scope) {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', status, organizationId, } = query || {};
        const filter = {};
        if (scope?.role === 'super_admin') {
            if (organizationId)
                filter.organizationId = organizationId;
        }
        else {
            filter.organizationId = scope?.organizationId || '__no_org__';
        }
        if (status) {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { bankName: { $regex: search, $options: 'i' } },
                { accountHolderName: { $regex: search, $options: 'i' } },
                { accountNumber: { $regex: search, $options: 'i' } },
                { ifscCode: { $regex: search, $options: 'i' } },
                { paymentReference: { $regex: search, $options: 'i' } },
                { note: { $regex: search, $options: 'i' } },
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
            this.withdrawRequestModel
                .find(filter)
                .populate('organizationId', 'name')
                .populate('requestedByUserId', 'name email role')
                .populate('approvedByUserId', 'name email')
                .populate('paidByUserId', 'name email')
                .populate('bankDetailId')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.withdrawRequestModel.countDocuments(filter).exec(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async approve(id, approvedByUserId, dto) {
        const request = await this.withdrawRequestModel.findById(id);
        if (!request) {
            throw new common_1.NotFoundException('Withdraw request not found');
        }
        if (request.status !== withdraw_request_schema_1.WithdrawRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending withdraw requests can be approved');
        }
        request.status = withdraw_request_schema_1.WithdrawRequestStatus.APPROVED;
        if (!mongoose_2.Types.ObjectId.isValid(approvedByUserId)) {
            throw new common_1.BadRequestException('Invalid approvedByUserId');
        }
        request.approvedByUserId = new mongoose_2.Types.ObjectId(approvedByUserId);
        request.approvedAt = new Date();
        request.approvalNote = dto.approvalNote?.trim() || '';
        return request.save();
    }
    async markPaid(id, paidByUserId, dto, file) {
        const request = await this.withdrawRequestModel.findById(id);
        if (!request) {
            throw new common_1.NotFoundException('Withdraw request not found');
        }
        if (request.status !== withdraw_request_schema_1.WithdrawRequestStatus.APPROVED) {
            throw new common_1.BadRequestException('Only approved withdraw requests can be marked as paid');
        }
        if (!file) {
            throw new common_1.BadRequestException('Payment proof file is required');
        }
        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
            throw new common_1.BadRequestException('Invalid payment proof upload');
        }
        const uploadsDir = path.resolve(process.cwd(), 'uploads', 'withdraw_request_paid');
        await fs.mkdir(uploadsDir, { recursive: true });
        const extension = path.extname(file.originalname || '').toLowerCase() || '.bin';
        const filename = `${request._id}-${Date.now()}${extension}`;
        const diskPath = path.join(uploadsDir, filename);
        await fs.writeFile(diskPath, file.buffer);
        request.status = withdraw_request_schema_1.WithdrawRequestStatus.PAID;
        if (!mongoose_2.Types.ObjectId.isValid(paidByUserId)) {
            throw new common_1.BadRequestException('Invalid paidByUserId');
        }
        request.paidByUserId = new mongoose_2.Types.ObjectId(paidByUserId);
        request.paidAt = new Date();
        request.paymentReference = dto.paymentReference?.trim() || '';
        request.paymentNote = dto.paymentNote?.trim() || '';
        request.paymentProofUrl = `/uploads/withdraw_request_paid/${filename}`;
        request.paymentProofName = file.originalname || filename;
        return request.save();
    }
};
exports.WithdrawRequestsService = WithdrawRequestsService;
exports.WithdrawRequestsService = WithdrawRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(withdraw_bank_detail_schema_1.WithdrawBankDetail.name)),
    __param(2, (0, mongoose_1.InjectModel)(withdraw_request_schema_1.WithdrawRequest.name)),
    __param(3, (0, mongoose_1.InjectModel)(restaurant_schema_1.Restaurant.name)),
    __param(4, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], WithdrawRequestsService);
//# sourceMappingURL=withdraw-requests.service.js.map