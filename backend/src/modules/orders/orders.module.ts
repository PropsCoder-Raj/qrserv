import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
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
import { PaymentsModule } from '../payments/payments.module';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { Table, TableSchema } from '../../schemas/table.schema';

@Module({
  imports: [
    PaymentsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Table.name, schema: TableSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
