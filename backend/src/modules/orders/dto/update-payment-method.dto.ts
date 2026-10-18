import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '../../../schemas/order.schema';

export class UpdatePaymentMethodDto {
  @ApiProperty({ enum: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.ONLINE] })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn([
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.ONLINE,
    'cash',
    'card',
    'online',
  ])
  paymentMethod: PaymentMethod;
}
