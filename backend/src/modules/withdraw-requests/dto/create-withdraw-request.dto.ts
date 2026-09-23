import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWithdrawRequestDto {
  @ApiProperty({ example: 1500 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: '67f91f5d0f2a2a0a4df1b201' })
  @IsOptional()
  @IsMongoId()
  bankDetailId?: string;

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

  @ApiPropertyOptional({ example: 'Withdraw weekly settlement' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
