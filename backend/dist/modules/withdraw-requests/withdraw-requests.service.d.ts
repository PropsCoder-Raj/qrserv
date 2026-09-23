import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { OrderDocument } from '../../schemas/order.schema';
import { RestaurantDocument } from '../../schemas/restaurant.schema';
import { WithdrawBankDetail, WithdrawBankDetailDocument } from '../../schemas/withdraw-bank-detail.schema';
import { WithdrawRequest, WithdrawRequestDocument } from '../../schemas/withdraw-request.schema';
import { ApproveWithdrawRequestDto } from './dto/approve-withdraw-request.dto';
import { CreateWithdrawBankDetailDto } from './dto/create-withdraw-bank-detail.dto';
import { CreateWithdrawRequestDto } from './dto/create-withdraw-request.dto';
import { ListWithdrawRequestsDto } from './dto/list-withdraw-requests.dto';
import { PayWithdrawRequestDto } from './dto/pay-withdraw-request.dto';
import { UpdateWithdrawBankDetailDto } from './dto/update-withdraw-bank-detail.dto';
export declare class WithdrawRequestsService {
    private configService;
    private withdrawBankDetailModel;
    private withdrawRequestModel;
    private restaurantModel;
    private orderModel;
    constructor(configService: ConfigService, withdrawBankDetailModel: Model<WithdrawBankDetailDocument>, withdrawRequestModel: Model<WithdrawRequestDocument>, restaurantModel: Model<RestaurantDocument>, orderModel: Model<OrderDocument>);
    getWithdrawChargePercentage(): number;
    getWithdrawChargeGstPercentage(): number;
    private calculateWithdrawAmounts;
    private toObjectId;
    resolveOrganizationId(organizationId?: string, restaurantId?: string): Promise<string | null>;
    private normalizeBankDetailInput;
    private getOwnedBankDetail;
    getBankDetails(organizationId: string, userId: string): Promise<(WithdrawBankDetail & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    createBankDetail(organizationId: string, userId: string, dto: CreateWithdrawBankDetailDto): Promise<import("mongoose").Document<unknown, {}, WithdrawBankDetailDocument, {}, import("mongoose").DefaultSchemaOptions> & WithdrawBankDetail & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateBankDetail(id: string, organizationId: string, userId: string, dto: UpdateWithdrawBankDetailDto): Promise<import("mongoose").Document<unknown, {}, WithdrawBankDetailDocument, {}, import("mongoose").DefaultSchemaOptions> & WithdrawBankDetail & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    removeBankDetail(id: string, organizationId: string, userId: string): Promise<{
        success: boolean;
    }>;
    create(organizationId: string, requestedByUserId: string, dto: CreateWithdrawRequestDto): Promise<import("mongoose").Document<unknown, {}, WithdrawRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & WithdrawRequest & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getAvailableSummary(organizationId: string | Types.ObjectId): Promise<{
        razorpayCollectedAmount: number;
        paidWithdrawAmount: number;
        availableAmount: number;
        withdrawChargePercentage: number;
        withdrawChargeGstPercentage: number;
    }>;
    findAll(query: ListWithdrawRequestsDto, scope?: {
        organizationId?: string;
        role?: string;
    }): Promise<{
        data: (import("mongoose").Document<unknown, {}, WithdrawRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & WithdrawRequest & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    approve(id: string, approvedByUserId: string, dto: ApproveWithdrawRequestDto): Promise<import("mongoose").Document<unknown, {}, WithdrawRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & WithdrawRequest & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    markPaid(id: string, paidByUserId: string, dto: PayWithdrawRequestDto, file: any): Promise<import("mongoose").Document<unknown, {}, WithdrawRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & WithdrawRequest & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
