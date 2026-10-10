import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from '../../schemas/coupon.schema';
import { CouponUsage, CouponUsageSchema } from '../../schemas/coupon-usage.schema';
import { MenuItem, MenuItemSchema } from '../../schemas/menu-item.schema';
import { Restaurant, RestaurantSchema } from '../../schemas/restaurant.schema';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
      { name: CouponUsage.name, schema: CouponUsageSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
