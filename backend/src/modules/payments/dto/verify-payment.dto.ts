import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;
}
