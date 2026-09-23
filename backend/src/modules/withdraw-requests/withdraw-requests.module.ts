import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WithdrawBankDetail,
  WithdrawBankDetailSchema,
} from '../../schemas/withdraw-bank-detail.schema';
import {
  WithdrawRequest,
  WithdrawRequestSchema,
} from '../../schemas/withdraw-request.schema';
import { Restaurant, RestaurantSchema } from '../../schemas/restaurant.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { WithdrawRequestsController } from './withdraw-requests.controller';
import { WithdrawRequestsService } from './withdraw-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WithdrawBankDetail.name, schema: WithdrawBankDetailSchema },
      { name: WithdrawRequest.name, schema: WithdrawRequestSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [WithdrawRequestsController],
  providers: [WithdrawRequestsService],
  exports: [WithdrawRequestsService],
})
export class WithdrawRequestsModule {}
