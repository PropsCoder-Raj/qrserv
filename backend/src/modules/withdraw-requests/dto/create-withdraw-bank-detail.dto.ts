import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WithdrawBankDetailType } from '../../../schemas/withdraw-bank-detail.schema';

export class CreateWithdrawBankDetailDto {
  @ApiProperty({
    enum: WithdrawBankDetailType,
    example: WithdrawBankDetailType.PERSONAL,
  })
  @IsEnum(WithdrawBankDetailType)
  bankDetailType: WithdrawBankDetailType;

  @ApiPropertyOptional({ example: 'Personal Account' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  customBankDetailLabel?: string;

  @ApiProperty({ example: 'Acme Foods Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  accountHolderName: string;

  @ApiProperty({ example: 'State Bank of India' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  bankName: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  accountNumber: string;

  @ApiProperty({ example: 'SBIN0001234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ifscCode: string;
}
