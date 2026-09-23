import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PayWithdrawRequestDto {
  @ApiPropertyOptional({ example: 'UTR1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentReference?: string;

  @ApiPropertyOptional({ example: 'Transferred via bank NEFT' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentNote?: string;
}
