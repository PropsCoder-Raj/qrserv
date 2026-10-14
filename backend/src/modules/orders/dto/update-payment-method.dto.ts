import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { PaymentMethod } from '../../../schemas/order.schema';

export class UpdatePaymentMethodDto {
  @ApiProperty({ enum: [PaymentMethod.CASH, PaymentMethod.CARD] })
  @IsNotEmpty()
  @IsIn([PaymentMethod.CASH, PaymentMethod.CARD])
  paymentMethod: PaymentMethod;
}
