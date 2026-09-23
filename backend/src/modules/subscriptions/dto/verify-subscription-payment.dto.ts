import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class VerifySubscriptionPaymentDto {
  @ApiProperty({ description: 'ID of the subscription plan' })
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

  @ApiProperty({ description: 'Razorpay order ID' })
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Razorpay payment ID' })
  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'Razorpay signature for verification' })
  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @ApiProperty({
    description: 'Enable auto-pay for subscription renewal (if supported).',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoPay?: boolean;
}
