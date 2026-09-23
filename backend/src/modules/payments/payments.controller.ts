import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { Public } from '../../common/decorators';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('create-order')
  @ApiOperation({ summary: 'Create a Razorpay order for payment' })
  createOrder(@Body() dto: CreatePaymentOrderDto) {
    return this.paymentsService.createOrder(dto);
  }

  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Verify Razorpay payment' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  webhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}
