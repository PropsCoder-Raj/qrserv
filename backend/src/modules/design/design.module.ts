import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StoreDesign,
  StoreDesignSchema,
} from '../../schemas/store-design.schema';
import { Restaurant, RestaurantSchema } from '../../schemas/restaurant.schema';
import { DesignController } from './design.controller';
import { DesignService } from './design.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreDesign.name, schema: StoreDesignSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
  ],
  controllers: [DesignController],
  providers: [DesignService],
  exports: [DesignService],
})
export class DesignModule {}
