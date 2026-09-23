import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { Table, TableSchema } from '../../schemas/table.schema';
import { Restaurant, RestaurantSchema } from '../../schemas/restaurant.schema';
import {
  Organization,
  OrganizationSchema,
} from '../../schemas/organization.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
