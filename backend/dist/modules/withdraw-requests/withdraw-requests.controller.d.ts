import { WithdrawRequestsService } from './withdraw-requests.service';
import { CreateWithdrawRequestDto } from './dto/create-withdraw-request.dto';
import { ListWithdrawRequestsDto } from './dto/list-withdraw-requests.dto';
import { ApproveWithdrawRequestDto } from './dto/approve-withdraw-request.dto';
import { PayWithdrawRequestDto } from './dto/pay-withdraw-request.dto';
import { CreateWithdrawBankDetailDto } from './dto/create-withdraw-bank-detail.dto';
import { UpdateWithdrawBankDetailDto } from './dto/update-withdraw-bank-detail.dto';
export declare class WithdrawRequestsController {
    private readonly withdrawRequestsService;
    constructor(withdrawRequestsService: WithdrawRequestsService);
    create(dto: CreateWithdrawRequestDto, organizationId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/withdraw-request.schema").WithdrawRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/withdraw-request.schema").WithdrawRequest & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getBankDetails(organizationId: string, userId: string): Promise<(import("../../schemas/withdraw-bank-detail.schema").WithdrawBankDetail & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    createBankDetail(dto: CreateWithdrawBankDetailDto, organizationId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/withdraw-bank-detail.schema").WithdrawBankDetailDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/withdraw-bank-detail.schema").WithdrawBankDetail & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateBankDetail(id: string, dto: UpdateWithdrawBankDetailDto, organizationId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/withdraw-bank-detail.schema").WithdrawBankDetailDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/withdraw-bank-detail.schema").WithdrawBankDetail & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    removeBankDetail(id: string, organizationId: string, userId: string): Promise<{
        success: boolean;
    }>;
    findAll(query: ListWithdrawRequestsDto, role?: string, organizationId?: string, restaurantId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas/withdraw-request.schema").WithdrawRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/withdraw-request.schema").WithdrawRequest & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
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
    getSummary(organizationId?: string, restaurantId?: string): Promise<{
        razorpayCollectedAmount: number;
        paidWithdrawAmount: number;
        availableAmount: number;
        withdrawChargePercentage: number;
        withdrawChargeGstPercentage: number;
    }>;
    approve(id: string, dto: ApproveWithdrawRequestDto, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/withdraw-request.schema").WithdrawRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/withdraw-request.schema").WithdrawRequest & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    markPaid(id: string, dto: PayWithdrawRequestDto, file: any, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/withdraw-request.schema").WithdrawRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas/withdraw-request.schema").WithdrawRequest & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
