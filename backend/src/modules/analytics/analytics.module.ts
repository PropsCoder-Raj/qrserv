import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Restaurant, RestaurantSchema } from '../../schemas/restaurant.schema';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [
    RestaurantsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
