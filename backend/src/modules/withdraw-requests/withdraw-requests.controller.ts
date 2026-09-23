import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Role, Roles } from '../../common/decorators';
import { WithdrawRequestsService } from './withdraw-requests.service';
import { CreateWithdrawRequestDto } from './dto/create-withdraw-request.dto';
import { ListWithdrawRequestsDto } from './dto/list-withdraw-requests.dto';
import { ApproveWithdrawRequestDto } from './dto/approve-withdraw-request.dto';
import { PayWithdrawRequestDto } from './dto/pay-withdraw-request.dto';
import { CreateWithdrawBankDetailDto } from './dto/create-withdraw-bank-detail.dto';
import { UpdateWithdrawBankDetailDto } from './dto/update-withdraw-bank-detail.dto';

@ApiTags('Withdraw Requests')
@ApiBearerAuth()
@Controller('api/withdraw-requests')
export class WithdrawRequestsController {
  constructor(
    private readonly withdrawRequestsService: WithdrawRequestsService,
  ) {}

  @Post()
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Create withdraw request (ORG_ADMIN only)' })
  create(
    @Body() dto: CreateWithdrawRequestDto,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.withdrawRequestsService.create(organizationId, userId, dto);
  }

  @Get('bank-details')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: 'List saved withdraw bank details for the current org admin' })
  getBankDetails(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.withdrawRequestsService.getBankDetails(organizationId, userId);
  }

  @Post('bank-details')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Create or update a saved withdraw bank detail' })
  createBankDetail(
    @Body() dto: CreateWithdrawBankDetailDto,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.withdrawRequestsService.createBankDetail(organizationId, userId, dto);
  }

  @Patch('bank-details/:id')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Update a saved withdraw bank detail' })
  updateBankDetail(
    @Param('id') id: string,
    @Body() dto: UpdateWithdrawBankDetailDto,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.withdrawRequestsService.updateBankDetail(id, organizationId, userId, dto);
  }

  @Delete('bank-details/:id')
  @Roles(Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Delete a saved withdraw bank detail' })
  removeBankDetail(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.withdrawRequestsService.removeBankDetail(id, organizationId, userId);
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.MANAGER,
    Role.STAFF,
  )
  @ApiOperation({
    summary: 'List withdraw requests with role-based organization scoping',
  })
  async findAll(
    @Query() query: ListWithdrawRequestsDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') restaurantId?: string,
  ) {
    const resolvedOrganizationId =
      role === Role.SUPER_ADMIN
        ? undefined
        : await this.withdrawRequestsService.resolveOrganizationId(
          organizationId,
          restaurantId,
        );

    return this.withdrawRequestsService.findAll(query, {
      role,
      organizationId: resolvedOrganizationId || undefined,
    });
  }

  @Get('summary')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.RESTAURANT_OWNER,
    Role.MANAGER,
    Role.STAFF,
  )
  @ApiOperation({
    summary: 'Get available withdraw amount summary for the current organization',
  })
  async getSummary(
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') restaurantId?: string,
  ) {
    const resolvedOrganizationId =
      await this.withdrawRequestsService.resolveOrganizationId(
        organizationId,
        restaurantId,
      );
    if (!resolvedOrganizationId) {
      return {
        razorpayCollectedAmount: 0,
        paidWithdrawAmount: 0,
        availableAmount: 0,
        withdrawChargePercentage:
          this.withdrawRequestsService.getWithdrawChargePercentage(),
        withdrawChargeGstPercentage:
          this.withdrawRequestsService.getWithdrawChargeGstPercentage(),
      };
    }

    return this.withdrawRequestsService.getAvailableSummary(
      resolvedOrganizationId,
    );
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a withdraw request (SUPER_ADMIN only)' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveWithdrawRequestDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.withdrawRequestsService.approve(id, userId, dto);
  }

  @Patch(':id/pay')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Mark an approved withdraw request as paid (SUPER_ADMIN only)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentReference: { type: 'string' },
        paymentNote: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimeTypes.includes(file?.mimetype)) {
          return cb(new Error('Only PNG, JPG, PDF, DOC, and DOCX files are allowed'), false);
        }

        cb(null, true);
      },
    }),
  )
  markPaid(
    @Param('id') id: string,
    @Body() dto: PayWithdrawRequestDto,
    @UploadedFile() file: any,
    @CurrentUser('userId') userId: string,
  ) {
    return this.withdrawRequestsService.markPaid(id, userId, dto, file);
  }
}
