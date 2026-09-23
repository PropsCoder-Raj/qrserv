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
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { CurrentUser, Roles, Role, Public } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Tables')
@ApiBearerAuth()
@Controller('api/tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create a table' })
  async create(
    @Body() dto: CreateTableDto,
    @CurrentUser() user?: any,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      await this.tablesService.validateOrgRestaurant(
        dto.restaurantId,
        organizationId,
      );
    }
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      dto.restaurantId = userRestaurantId;
    }
    return this.tablesService.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Get tables by restaurant' })
  async findAll(
    @Query('restaurantId') restaurantId: string,
    @Query() query?: PaginationQueryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId && restaurantId) {
      await this.tablesService.validateOrgRestaurant(
        restaurantId,
        organizationId,
      );
    }
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      restaurantId = userRestaurantId;
    }
    return this.tablesService.findAll(restaurantId, query);
  }

  @Public()
  @Get(':id/info')
  @ApiOperation({ summary: 'Get basic table info by ID (public)' })
  getPublicInfo(@Param('id') id: string) {
    return this.tablesService.getPublicInfo(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a table by ID' })
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update a table' })
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Delete a table' })
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
