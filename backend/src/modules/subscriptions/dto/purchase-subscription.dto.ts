import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';

export class PurchaseSubscriptionDto {
  @ApiProperty({ description: 'ID of the subscription plan to purchase' })
  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  @ApiProperty({
    description:
      'Selected duration in months for the purchase. Defaults to 1 if omitted.',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  months?: number;

  @ApiProperty({
    description: 'Enable auto-pay for subscription renewal (if supported).',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoPay?: boolean;
}
