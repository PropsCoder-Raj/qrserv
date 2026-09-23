import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getDateRangeFromPreset } from '../../common/utils/date-range';
import { Order, OrderDocument, PaymentStatus } from '../../schemas/order.schema';
import { Restaurant, RestaurantDocument } from '../../schemas/restaurant.schema';
import {
  WithdrawBankDetail,
  WithdrawBankDetailDocument,
  WithdrawBankDetailType,
} from '../../schemas/withdraw-bank-detail.schema';
import {
  WithdrawRequest,
  WithdrawRequestDocument,
  WithdrawRequestStatus,
} from '../../schemas/withdraw-request.schema';
import { ApproveWithdrawRequestDto } from './dto/approve-withdraw-request.dto';
import { CreateWithdrawBankDetailDto } from './dto/create-withdraw-bank-detail.dto';
import { CreateWithdrawRequestDto } from './dto/create-withdraw-request.dto';
import { ListWithdrawRequestsDto } from './dto/list-withdraw-requests.dto';
import { PayWithdrawRequestDto } from './dto/pay-withdraw-request.dto';
import { UpdateWithdrawBankDetailDto } from './dto/update-withdraw-bank-detail.dto';

@Injectable()
export class WithdrawRequestsService {
  constructor(
    private configService: ConfigService,
    @InjectModel(WithdrawBankDetail.name)
    private withdrawBankDetailModel: Model<WithdrawBankDetailDocument>,
    @InjectModel(WithdrawRequest.name)
    private withdrawRequestModel: Model<WithdrawRequestDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  getWithdrawChargePercentage() {
    const configuredValue = Number(
      this.configService.get<number>('withdraw.chargePercentage') || 0,
    );

    if (Number.isNaN(configuredValue)) {
      return 0;
    }

    return Math.max(0, configuredValue);
  }

  getWithdrawChargeGstPercentage() {
    const configuredValue = Number(
      this.configService.get<number>('withdraw.chargeGstPercentage') || 0,
    );

    if (Number.isNaN(configuredValue)) {
      return 0;
    }

    return Math.max(0, configuredValue);
  }

  private calculateWithdrawAmounts(amount: number) {
    const requestAmount = Number(amount || 0);
    const chargePercentage = this.getWithdrawChargePercentage();
    const chargeGstPercentage = this.getWithdrawChargeGstPercentage();
    const chargeBaseAmount = Number(
      ((requestAmount * chargePercentage) / 100).toFixed(2),
    );
    const chargeGstAmount = Number(
      ((chargeBaseAmount * chargeGstPercentage) / 100).toFixed(2),
    );
    const chargeAmount = Number(
      (chargeBaseAmount + chargeGstAmount).toFixed(2),
    );
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

  private toObjectId(value: string | Types.ObjectId, fieldName: string) {
    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return new Types.ObjectId(value);
  }

  async resolveOrganizationId(
    organizationId?: string,
    restaurantId?: string,
  ): Promise<string | null> {
    if (organizationId) {
      if (!Types.ObjectId.isValid(organizationId)) {
        throw new BadRequestException('Invalid organizationId');
      }

      return organizationId;
    }

    if (!restaurantId) return null;
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new BadRequestException('Invalid restaurantId');
    }

    const restaurant = await this.restaurantModel
      .findById(restaurantId)
      .select('organizationId')
      .lean();

    return restaurant?.organizationId?.toString() || null;
  }

  private normalizeBankDetailInput(
    dto: Partial<CreateWithdrawBankDetailDto>,
    current?: WithdrawBankDetailDocument | null,
  ) {
    const bankDetailType =
      dto.bankDetailType ||
      current?.bankDetailType ||
      WithdrawBankDetailType.PERSONAL;
    const customBankDetailLabel =
      dto.customBankDetailLabel?.trim() ??
      current?.customBankDetailLabel?.trim() ??
      '';
    const accountHolderName =
      dto.accountHolderName?.trim() ?? current?.accountHolderName?.trim() ?? '';
    const bankName = dto.bankName?.trim() ?? current?.bankName?.trim() ?? '';
    const accountNumber =
      dto.accountNumber?.trim() ?? current?.accountNumber?.trim() ?? '';
    const ifscCode = (dto.ifscCode?.trim() ?? current?.ifscCode?.trim() ?? '').toUpperCase();

    if (bankDetailType === WithdrawBankDetailType.OTHER && !customBankDetailLabel) {
      throw new BadRequestException('Custom bank detail label is required for Other');
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

  private async getOwnedBankDetail(
    id: string,
    organizationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ) {
    const bankDetail = await this.withdrawBankDetailModel.findOne({
      _id: this.toObjectId(id, 'bankDetailId'),
      organizationId: this.toObjectId(organizationId, 'organizationId'),
      userId: this.toObjectId(userId, 'userId'),
    });

    if (!bankDetail) {
      throw new NotFoundException('Saved bank detail not found');
    }

    return bankDetail;
  }

  async getBankDetails(organizationId: string, userId: string) {
    return this.withdrawBankDetailModel
      .find({
        organizationId: this.toObjectId(organizationId, 'organizationId'),
        userId: this.toObjectId(userId, 'userId'),
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
  }

  async createBankDetail(
    organizationId: string,
    userId: string,
    dto: CreateWithdrawBankDetailDto,
  ) {
    const organizationObjectId = this.toObjectId(organizationId, 'organizationId');
    const userObjectId = this.toObjectId(userId, 'userId');

    const normalized = this.normalizeBankDetailInput(dto);

    return this.withdrawBankDetailModel.create({
      organizationId: organizationObjectId,
      userId: userObjectId,
      ...normalized,
    });
  }

  async updateBankDetail(
    id: string,
    organizationId: string,
    userId: string,
    dto: UpdateWithdrawBankDetailDto,
  ) {
    const bankDetail = await this.getOwnedBankDetail(id, organizationId, userId);
    const normalized = this.normalizeBankDetailInput(dto, bankDetail);

    bankDetail.bankDetailType = normalized.bankDetailType as WithdrawBankDetailType;
    bankDetail.customBankDetailLabel = normalized.customBankDetailLabel;
    bankDetail.accountHolderName = normalized.accountHolderName;
    bankDetail.bankName = normalized.bankName;
    bankDetail.accountNumber = normalized.accountNumber;
    bankDetail.ifscCode = normalized.ifscCode;

    return bankDetail.save();
  }

  async removeBankDetail(id: string, organizationId: string, userId: string) {
    const bankDetail = await this.getOwnedBankDetail(id, organizationId, userId);
    await bankDetail.deleteOne();
    return { success: true };
  }

  async create(
    organizationId: string,
    requestedByUserId: string,
    dto: CreateWithdrawRequestDto,
  ) {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Invalid organizationId');
    }
    if (!Types.ObjectId.isValid(requestedByUserId)) {
      throw new BadRequestException('Invalid requestedByUserId');
    }
    if (dto.bankDetailId && !Types.ObjectId.isValid(dto.bankDetailId)) {
      throw new BadRequestException('Invalid bankDetailId');
    }

    const summary = await this.getAvailableSummary(organizationId);
    if (Number(dto.amount) > Number(summary.availableAmount)) {
      throw new BadRequestException(
        'Requested amount exceeds available withdraw amount',
      );
    }

    let savedBankDetail: WithdrawBankDetailDocument | null = null;
    if (dto.bankDetailId) {
      savedBankDetail = await this.getOwnedBankDetail(
        dto.bankDetailId,
        organizationId,
        requestedByUserId,
      );
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
      organizationId: new Types.ObjectId(organizationId),
      requestedByUserId: new Types.ObjectId(requestedByUserId),
      amount: dto.amount,
      ...withdrawAmounts,
      note: dto.note?.trim() || '',
      bankDetailId: savedBankDetail?._id || null,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      status: WithdrawRequestStatus.PENDING,
    });
  }

  async getAvailableSummary(organizationId: string | Types.ObjectId) {
    const organizationObjectId =
      organizationId instanceof Types.ObjectId
        ? organizationId
        : new Types.ObjectId(organizationId);
    const restaurants = await this.restaurantModel
      .find({ organizationId: organizationObjectId })
      .select('_id')
      .lean();
    const restaurantIds = restaurants.map((restaurant: any) =>
      restaurant._id instanceof Types.ObjectId
        ? restaurant._id
        : new Types.ObjectId(restaurant._id),
    );

    let razorpayCollectedAmount = 0;
    if (restaurantIds.length) {
      const [orderStats] = await this.orderModel.aggregate([
        {
          $match: {
            restaurantId: { $in: restaurantIds },
            paymentStatus: PaymentStatus.PAID,
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
          status: WithdrawRequestStatus.PAID,
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
    const availableAmount = Math.max(
      0,
      razorpayCollectedAmount - paidWithdrawAmount,
    );

    return {
      razorpayCollectedAmount,
      paidWithdrawAmount,
      availableAmount,
      withdrawChargePercentage: this.getWithdrawChargePercentage(),
      withdrawChargeGstPercentage: this.getWithdrawChargeGstPercentage(),
    };
  }

  async findAll(
    query: ListWithdrawRequestsDto,
    scope?: {
      organizationId?: string;
      role?: string;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'desc',
      status,
      organizationId,
    } = query || {};

    const filter: any = {};

    if (scope?.role === 'super_admin') {
      if (organizationId) filter.organizationId = organizationId;
    } else {
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

    const range = getDateRangeFromPreset(query?.datePreset);
    if (range) {
      filter.createdAt = { $gte: range.from, $lte: range.to };
    }

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
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

  async approve(
    id: string,
    approvedByUserId: string,
    dto: ApproveWithdrawRequestDto,
  ) {
    const request = await this.withdrawRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Withdraw request not found');
    }
    if (request.status !== WithdrawRequestStatus.PENDING) {
      throw new BadRequestException(
        'Only pending withdraw requests can be approved',
      );
    }

    request.status = WithdrawRequestStatus.APPROVED;
    if (!Types.ObjectId.isValid(approvedByUserId)) {
      throw new BadRequestException('Invalid approvedByUserId');
    }

    request.approvedByUserId = new Types.ObjectId(approvedByUserId);
    request.approvedAt = new Date();
    request.approvalNote = dto.approvalNote?.trim() || '';

    return request.save();
  }

  async markPaid(
    id: string,
    paidByUserId: string,
    dto: PayWithdrawRequestDto,
    file: any,
  ) {
    const request = await this.withdrawRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Withdraw request not found');
    }
    if (request.status !== WithdrawRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved withdraw requests can be marked as paid',
      );
    }

    if (!file) {
      throw new BadRequestException('Payment proof file is required');
    }
    if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException('Invalid payment proof upload');
    }

    const uploadsDir = path.resolve(
      process.cwd(),
      'uploads',
      'withdraw_request_paid',
    );
    await fs.mkdir(uploadsDir, { recursive: true });

    const extension = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const filename = `${request._id}-${Date.now()}${extension}`;
    const diskPath = path.join(uploadsDir, filename);

    await fs.writeFile(diskPath, file.buffer);

    request.status = WithdrawRequestStatus.PAID;
    if (!Types.ObjectId.isValid(paidByUserId)) {
      throw new BadRequestException('Invalid paidByUserId');
    }

    request.paidByUserId = new Types.ObjectId(paidByUserId);
    request.paidAt = new Date();
    request.paymentReference = dto.paymentReference?.trim() || '';
    request.paymentNote = dto.paymentNote?.trim() || '';
    request.paymentProofUrl = `/uploads/withdraw_request_paid/${filename}`;
    request.paymentProofName = file.originalname || filename;

    return request.save();
  }
}
