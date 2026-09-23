import { PartialType } from '@nestjs/swagger';
import { CreateWithdrawBankDetailDto } from './create-withdraw-bank-detail.dto';

export class UpdateWithdrawBankDetailDto extends PartialType(
  CreateWithdrawBankDetailDto,
) {}
