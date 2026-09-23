import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { MenuItem, MenuItemSchema } from '../../schemas/menu-item.schema';
import { Restaurant, RestaurantSchema } from '../../schemas/restaurant.schema';
import {
  Organization,
  OrganizationSchema,
} from '../../schemas/organization.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
