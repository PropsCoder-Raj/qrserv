import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orderId: string;
}
