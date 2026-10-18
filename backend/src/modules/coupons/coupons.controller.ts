import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, Role, Roles } from '../../common/decorators';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponsService } from './coupons.service';
import { roundTo3 } from '../../common/utils/precision';

@ApiTags('Coupons')
@Controller('api/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate a coupon against current restaurant cart items' })
  async validate(@Body() dto: ValidateCouponDto) {
    const items = await this.couponsService.priceOrderItems(dto.restaurantId, dto.items);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const { coupon, discountAmount } = await this.couponsService.validateCoupon(
      dto.restaurantId,
      dto.code,
      subtotal,
    );
    return {
      couponCode: coupon.code,
      subtotalAmount: roundTo3(subtotal),
      discountAmount,
      totalAmount: Math.max(0, roundTo3(subtotal - discountAmount)),
    };
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'List coupons for a restaurant' })
  async findAll(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    const effectiveRestaurantId = await this.couponsService.resolveRestaurantId(
      restaurantId,
      role,
      organizationId,
      userRestaurantId,
    );
    return this.couponsService.findAll(effectiveRestaurantId);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a coupon' })
  async create(
    @Body() dto: CreateCouponDto & { restaurantId?: string },
    @CurrentUser('role') role: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    const restaurantId = await this.couponsService.resolveRestaurantId(
      dto.restaurantId,
      role,
      organizationId,
      userRestaurantId,
    );
    return this.couponsService.create(dto, restaurantId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update a coupon' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
    @CurrentUser('role') role: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    return this.couponsService.update(id, dto, role, organizationId, userRestaurantId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Delete a coupon' })
  remove(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    return this.couponsService.remove(id, role, organizationId, userRestaurantId);
  }
}
