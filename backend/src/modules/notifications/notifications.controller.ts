import { Body, Controller, Delete, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Role, Roles } from '../../common/decorators';
import { FcmService } from './fcm.service';
import { FcmTokenDto } from './dto/fcm-token.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('fcm-token')
  @Roles(Role.CAPTAIN, Role.KITCHEN)
  @ApiOperation({ summary: 'Register a browser FCM token for staff alerts' })
  async registerToken(
    @CurrentUser('userId') userId: string,
    @Body() dto: FcmTokenDto,
  ) {
    await this.fcmService.registerToken(userId, dto.token);
    return { success: true };
  }

  @Delete('fcm-token')
  @Roles(Role.CAPTAIN, Role.KITCHEN)
  @ApiOperation({ summary: 'Remove a browser FCM token' })
  async unregisterToken(
    @CurrentUser('userId') userId: string,
    @Body() dto: FcmTokenDto,
  ) {
    await this.fcmService.unregisterToken(userId, dto.token);
    return { success: true };
  }
}
