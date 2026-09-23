import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Restaurant, RestaurantSchema } from '../../schemas/restaurant.schema';
import {
  Organization,
  OrganizationSchema,
} from '../../schemas/organization.schema';
import {
  Subscription,
  SubscriptionSchema,
} from '../../schemas/subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
