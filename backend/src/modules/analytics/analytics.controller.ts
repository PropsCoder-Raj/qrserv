import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { CurrentUser, Roles, Role } from '../../common/decorators';
import { OrderAnalyticsQueryDto } from './dto/order-analytics-query.dto';

@ApiTags('Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  @Get('orders')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({
    summary:
      'Order analytics by payment method (CASH vs CARD), with restaurant and date-range filters. ' +
      'Super admin can view any/all restaurants, org admin is scoped to their organization, ' +
      'and restaurant owner is always scoped to their own restaurant.',
  })
  async getOrderAnalytics(
    @Query() query: OrderAnalyticsQueryDto,
    @CurrentUser('role') role: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.SUPER_ADMIN) {
      return this.analyticsService.getForSuperAdmin(query);
    }

    if (role === Role.ORG_ADMIN) {
      if (!organizationId) {
        throw new BadRequestException('Organization not found for this user');
      }
      if (query.restaurant_id) {
        await this.restaurantsService.validateOrgRestaurant(
          query.restaurant_id,
          organizationId,
        );
      }
      return this.analyticsService.getForOrganization(organizationId, query);
    }

    // restaurant_owner — always restricted to their own restaurant, regardless
    // of any restaurant_id passed in the query.
    if (!userRestaurantId) {
      throw new BadRequestException('Restaurant not found for this user');
    }
    return this.analyticsService.getForRestaurant(userRestaurantId, query);
  }
}
