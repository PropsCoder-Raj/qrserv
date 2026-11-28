import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, Role, Roles } from '../../common/decorators';
import { DesignRequestUser, DesignService } from './design.service';
import { UpdateStoreDesignDto } from './dto/update-store-design.dto';

@ApiTags('Design')
@Controller('api/design')
export class DesignController {
  constructor(private readonly designService: DesignService) {}

  @Public()
  @Get(':restaurantId')
  @ApiOperation({
    summary:
      'Get storefront design configuration for a restaurant (auto-returns Classic defaults if none exists)',
  })
  getDesign(@Param('restaurantId') restaurantId: string) {
    return this.designService.getDesign(restaurantId);
  }

  @Put(':restaurantId')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({
    summary: 'Validate and save/publish storefront design configuration',
  })
  upsertDesign(
    @Param('restaurantId') restaurantId: string,
    @Body() updateStoreDesignDto: UpdateStoreDesignDto,
    @CurrentUser() user: DesignRequestUser,
  ) {
    return this.designService.upsertDesign(
      restaurantId,
      updateStoreDesignDto,
      user,
    );
  }

  @Post(':restaurantId/reset')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({
    summary: 'Reset storefront design configuration back to Classic defaults',
  })
  resetDesign(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: DesignRequestUser,
  ) {
    return this.designService.resetDesign(restaurantId, user);
  }
}
