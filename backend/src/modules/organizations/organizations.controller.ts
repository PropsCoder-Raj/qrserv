import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentUser, Roles, Role } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('api/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new organization (SUPER_ADMIN only)' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Get all organizations' })
  findAll(
    @Query() query?: PaginationQueryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      return this.organizationsService.findById(organizationId);
    }
    return this.organizationsService.findAll(query);
  }

  @Get('my')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: "Get current user's organization (ORG_ADMIN)" })
  findMyOrganization(@CurrentUser('organizationId') organizationId: string) {
    return this.organizationsService.findOne(organizationId);
  }

  @Get(':id/order-summary')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({
    summary:
      'Get organization order summary (total orders and Razorpay paid orders)',
  })
  getOrderSummary(
    @Param('id') id: string,
    @Query('restaurantId') restaurantId?: string,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      return this.organizationsService.getOrderSummary(
        organizationId,
        restaurantId,
      );
    }
    return this.organizationsService.getOrderSummary(id, restaurantId);
  }

  @Get(':id/razorpay-orders')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({
    summary:
      'Get organization Razorpay paid order history with pagination and search',
  })
  getRazorpayOrderHistory(
    @Param('id') id: string,
    @Query() query?: PaginationQueryDto,
    @Query('restaurantId') restaurantId?: string,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    const nextQuery = restaurantId
      ? ({ ...(query || {}), restaurantId } as PaginationQueryDto & {
          restaurantId: string;
        })
      : query;

    if (role === Role.ORG_ADMIN && organizationId) {
      return this.organizationsService.getRazorpayOrderHistory(
        organizationId,
        nextQuery,
      );
    }
    return this.organizationsService.getRazorpayOrderHistory(id, nextQuery);
  }

  @Get(':id/razorpay-payment/:paymentId')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({
    summary: 'Get full Razorpay payment details for an organization payment',
  })
  getRazorpayPaymentDetails(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      return this.organizationsService.getRazorpayPaymentDetails(
        organizationId,
        paymentId,
      );
    }
    return this.organizationsService.getRazorpayPaymentDetails(id, paymentId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      return this.organizationsService.findOne(organizationId);
    }
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Update an organization' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      return this.organizationsService.update(organizationId, dto);
    }
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an organization (SUPER_ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Get(':id/restaurants')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Get all restaurants in an organization' })
  findRestaurants(
    @Param('id') id: string,
    @Query() query?: PaginationQueryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      return this.organizationsService.findRestaurants(organizationId, query);
    }
    return this.organizationsService.findRestaurants(id, query);
  }
}
