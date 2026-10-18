import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { CancelOrderItemDto } from './dto/cancel-order-item.dto';
import { RollbackFailedOrderDto } from './dto/rollback-failed-order.dto';
import { UpdateCustomerOrderItemsDto } from './dto/update-customer-order-items.dto';
import { UpdateOrderItemsDto } from './dto/update-order-items.dto';
import { CurrentUser, Public, Roles, Role } from '../../common/decorators';
import { OrderStatus } from '../../schemas/order.schema';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Orders')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.CAPTAIN,
    Role.MANAGER,
  )
  @ApiOperation({ summary: 'Create an order from the admin panel' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Public()
  @Post('customer/create')
  @ApiOperation({
    summary:
      'Place customer app order and create Razorpay payment order if enabled by subscription',
  })
  createForCustomerApp(@Body() dto: CreateOrderDto) {
    return this.ordersService.createForCustomerApp(dto);
  }

  @Public()
  @Post('customer/rollback-failed')
  @ApiOperation({
    summary:
      'Rollback a customer order when Razorpay payment is cancelled/failed',
  })
  rollbackFailedCustomerOrder(@Body() dto: RollbackFailedOrderDto) {
    return this.ordersService.rollbackFailedCustomerOrder(
      dto.orderId,
      dto.razorpayOrderId,
    );
  }

  @Public()
  @Patch('customer/:id/items')
  @ApiOperation({
    summary: 'Update items for an unpaid table order from customer app',
  })
  updateCustomerTableOrderItems(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerOrderItemsDto,
  ) {
    return this.ordersService.updateCustomerTableOrderItems(id, dto.items);
  }

  // Static GET routes MUST be declared before parameterized routes (:id)
  @Get()
  @ApiBearerAuth()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.CAPTAIN,
    Role.MANAGER,
    Role.KITCHEN,
    Role.STAFF,
  )
  @ApiOperation({ summary: 'Get orders (filtered by restaurant/status)' })
  async findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: OrderStatus,
    @Query() query?: PaginationQueryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.SUPER_ADMIN) {
      return this.ordersService.findAll(
        restaurantId || undefined,
        status,
        query,
      );
    }
    if (role === Role.ORG_ADMIN && organizationId) {
      if (restaurantId) {
        await this.ordersService.validateOrgRestaurant(
          restaurantId,
          organizationId,
        );
        return this.ordersService.findAll(restaurantId, status, query);
      }
      return this.ordersService.findAllByOrganization(
        organizationId,
        status,
        query,
      );
    }
    // restaurant_owner, captain, kitchen, manager, staff — always scope to their restaurant
    const effectiveRestaurantId = userRestaurantId || restaurantId;
    return this.ordersService.findAll(effectiveRestaurantId, status, query);
  }

  @Get('stats')
  @ApiBearerAuth()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.CAPTAIN,
    Role.MANAGER,
    Role.KITCHEN,
    Role.STAFF,
  )
  @ApiOperation({ summary: 'Get order statistics and revenue data' })
  async getStats(
    @Query('restaurantId') restaurantId?: string,
    @Query() query?: PaginationQueryDto,
    @CurrentUser() user?: any,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.SUPER_ADMIN) {
      return this.ordersService.getStats(restaurantId, query);
    }
    if (role === Role.ORG_ADMIN && organizationId) {
      if (restaurantId) {
        await this.ordersService.validateOrgRestaurant(
          restaurantId,
          organizationId,
        );
        return this.ordersService.getStats(restaurantId, query);
      }
      return this.ordersService.getStatsByOrganization(
        organizationId,
        query,
      );
    }
    // restaurant_owner, manager, staff — always scope to their restaurant
    const effectiveRestaurantId = userRestaurantId || restaurantId;
    return this.ordersService.getStats(
      effectiveRestaurantId,
      query,
    );
  }

  @Public()
  @Get('history/:phone')
  @ApiOperation({ summary: 'Get order history by customer phone (public)' })
  findByPhone(@Param('phone') phone: string) {
    return this.ordersService.findByPhone(phone);
  }

  @Public()
  @Get(':id/invoice')
  @ApiOperation({ summary: 'Get order invoice payload (public)' })
  getInvoice(@Param('id') id: string) {
    return this.ordersService.getInvoice(id);
  }

  // Parameterized routes MUST come after all static routes
  @Public()
  @Get(':id/status')
  @ApiOperation({ summary: 'Track order status (public)' })
  getStatus(@Param('id') id: string) {
    return this.ordersService.getStatus(id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.CAPTAIN,
    Role.MANAGER,
    Role.KITCHEN,
    Role.STAFF,
  )
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/payment-status')
  @ApiBearerAuth()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.CAPTAIN,
    Role.MANAGER,
    Role.KITCHEN,
    Role.STAFF,
  )
  @ApiOperation({ summary: 'Update payment status' })
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, dto);
  }

  @Patch(':id/payment-method')
  @ApiBearerAuth()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.CAPTAIN,
    Role.MANAGER,
    Role.KITCHEN,
    Role.STAFF,
  )
  @ApiOperation({ summary: 'Update payment method' })
  updatePaymentMethod(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.ordersService.updatePaymentMethod(id, dto);
  }

  @Patch(':id/items')
  @ApiBearerAuth()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.CAPTAIN,
    Role.MANAGER,
  )
  @ApiOperation({ summary: 'Update order items and coupon code' })
  updateOrderItems(
    @Param('id') id: string,
    @Body() dto: UpdateOrderItemsDto,
    @CurrentUser('role') role: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') restaurantId?: string,
  ) {
    return this.ordersService.updateOrderItems(
      id,
      dto,
      role,
      organizationId,
      restaurantId,
    );
  }

  @Patch(':id/items/cancel')
  @ApiBearerAuth()
  @Roles(Role.CAPTAIN, Role.MANAGER, Role.KITCHEN, Role.STAFF)
  @ApiOperation({
    summary: 'Cancel single order item quantity (captain/kitchen/manager/staff)',
  })
  cancelOrderItem(
    @Param('id') id: string,
    @Body() dto: CancelOrderItemDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.ordersService.cancelOrderItem(id, dto, userId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.CAPTAIN,
    Role.MANAGER,
  )
  @ApiOperation({ summary: 'Delete a cancelled order (admin/captain/manager)' })
  remove(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') restaurantId?: string,
  ) {
    return this.ordersService.remove(id, role, organizationId, restaurantId);
  }
}
