import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderStatisticsService } from './order-statistics.service';
import { CurrentUser, Roles, Role } from '../../common/decorators';

@ApiTags('Order Statistics')
@Controller('api/order-statistics')
export class OrderStatisticsController {
  constructor(private readonly orderStatisticsService: OrderStatisticsService) {}

  @Post('reset')
  @ApiBearerAuth()
  @Roles(Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({
    summary:
      'Reset order statistics counters to 0 (org admin resets all restaurants in the org, restaurant owner resets only their own restaurant)',
  })
  async reset(
    @CurrentUser('role') role: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('restaurantId') restaurantId: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('Organization not found for this user');
    }

    if (role === Role.RESTAURANT_OWNER) {
      if (!restaurantId) {
        throw new BadRequestException('Restaurant not found for this user');
      }
      await this.orderStatisticsService.resetForRestaurant(
        organizationId,
        restaurantId,
      );
      return { message: 'Order statistics reset for your restaurant' };
    }

    if (role === Role.ORG_ADMIN) {
      await this.orderStatisticsService.resetForOrganization(organizationId);
      return { message: 'Order statistics reset for your organization' };
    }

    throw new ForbiddenException(
      'Only organization admins and restaurant owners can reset order statistics',
    );
  }
}
