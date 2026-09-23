import { WithdrawBankDetailType } from '../../../schemas/withdraw-bank-detail.schema';
export declare class CreateWithdrawBankDetailDto {
    bankDetailType: WithdrawBankDetailType;
    customBankDetailLabel?: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
}
