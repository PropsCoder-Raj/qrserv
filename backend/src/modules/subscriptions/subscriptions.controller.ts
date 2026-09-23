import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { VerifySubscriptionPaymentDto } from './dto/verify-subscription-payment.dto';
import { Roles, Role, CurrentUser } from '../../common/decorators';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';
import { CreateAutopaySubscriptionDto } from './dto/create-autopay-subscription.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a subscription plan' })
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all subscription plans' })
  findAll(@Query() query?: PaginationQueryDto) {
    return this.subscriptionsService.findAll(query);
  }

  @Get('plans')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Get all available subscription plans' })
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Get('public/plans')
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Get all available subscription plans (API KEY auth)',
  })
  findAllPlansWithApiKey() {
    return this.subscriptionsService.findAllPlans();
  }

  @Post('purchase')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Purchase a free subscription plan directly' })
  async purchase(
    @Body() dto: PurchaseSubscriptionDto,
    @CurrentUser() user: any,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const subscription = await this.subscriptionsService.findOne(
      dto.subscriptionId,
    );
    if (subscription.isPaymentGatewayAllocated) {
      throw new BadRequestException(
        'Payment gateway is allocated for this plan. Use create-order to continue.',
      );
    }

    console.log('CurrentUser JSON:', JSON.stringify(user, null, 2));
    return this.subscriptionsService.purchaseSubscription(
      dto.subscriptionId,
      dto.months,
      dto.autoPay,
      organizationId,
      userId,
    );
  }

  @Post('create-order')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({
    summary: 'Create a Razorpay order for subscription purchase',
  })
  async createSubscriptionOrder(
    @Body() dto: PurchaseSubscriptionDto,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    console.log(
      '🚀 ~ SubscriptionsController ~ createSubscriptionOrder ~ dto:',
      dto,
    );
    console.log(
      '🚀 ~ SubscriptionsController ~ createSubscriptionOrder ~ organizationId:',
      organizationId,
    );
    return this.subscriptionsService.createSubscriptionOrder(
      dto.subscriptionId,
      dto.months,
      dto.autoPay,
      organizationId,
    );
  }

  @Post('create-autopay-subscription')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({
    summary:
      'Create Razorpay subscription (recurring) for auto-pay (paid plans)',
  })
  createAutopaySubscription(
    @Body() dto: CreateAutopaySubscriptionDto,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.subscriptionsService.createAutopaySubscription(
      dto.subscriptionId,
      dto.months,
      organizationId,
      userId,
    );
  }

  @Post('verify-payment')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({
    summary: 'Verify Razorpay payment and activate subscription',
  })
  verifySubscriptionPayment(
    @CurrentUser() user: any,
    @Body() dto: VerifySubscriptionPaymentDto,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    console.log(
      '🚀 ~ SubscriptionsController ~ verifySubscriptionPayment ~ user:',
      user,
    );
    console.log(
      '🚀 ~ SubscriptionsController ~ verifySubscriptionPayment ~ userId:',
      userId,
    );
    console.log(
      '🚀 ~ SubscriptionsController ~ verifySubscriptionPayment ~ organizationId:',
      organizationId,
    );
    return this.subscriptionsService.verifySubscriptionPayment(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
      dto.subscriptionId,
      dto.months,
      dto.autoPay,
      organizationId,
      userId,
    );
  }

  @Get('my-history')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({
    summary: 'Get subscription purchase history for current org',
  })
  getMyHistory(@CurrentUser('organizationId') organizationId: string) {
    return this.subscriptionsService.getSubscriptionHistory(organizationId);
  }

  @Get('my-active-plan')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Get active subscription plan for current org' })
  getMyActivePlan(@CurrentUser('organizationId') organizationId: string) {
    return this.subscriptionsService.getActiveSubscriptionPlan(organizationId);
  }

  @Patch('my-auto-pay')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({
    summary: 'Enable/disable auto-pay for current org subscription',
  })
  setMyAutoPay(
    @CurrentUser('organizationId') organizationId: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.subscriptionsService.setAutoPayEnabled(organizationId, enabled);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Razorpay subscription webhook handler' })
  webhook(@Req() req: any, @Body() body: any) {
    const signature = req.headers?.['x-razorpay-signature'] || '';
    const rawBody = req.rawBody || '';
    return this.subscriptionsService.handleWebhook(body, signature, rawBody);
  }

  @Get('all-history')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all subscription purchase history (super admin)',
  })
  getAllHistory(@Query() query: PaginationQueryDto) {
    return this.subscriptionsService.getAllSubscriptionHistory(query);
  }

  @Get('analytics/plans')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Get subscription analytics by plan with active and total purchase counts',
  })
  getPlanAnalytics() {
    return this.subscriptionsService.getPlanAnalytics();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a subscription plan' })
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a subscription plan' })
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  @Post('assign')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign a subscription to an organization' })
  assign(@Body() dto: AssignSubscriptionDto) {
    return this.subscriptionsService.assignToOrganization(dto);
  }
}
