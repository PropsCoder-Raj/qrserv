import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OrderStatistics,
  OrderStatisticsSchema,
} from '../../schemas/order-statistics.schema';
import { OrderStatisticsService } from './order-statistics.service';
import { OrderStatisticsController } from './order-statistics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderStatistics.name, schema: OrderStatisticsSchema },
    ]),
  ],
  controllers: [OrderStatisticsController],
  providers: [OrderStatisticsService],
  exports: [OrderStatisticsService],
})
export class OrderStatisticsModule {}
