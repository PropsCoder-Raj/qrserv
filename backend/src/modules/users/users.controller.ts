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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, Roles, Role } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new user' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      if (createUserDto.restaurantId) {
        await this.usersService.validateOrgRestaurant(
          createUserDto.restaurantId,
          organizationId,
        );
      }
      createUserDto.organizationId = organizationId;
    }
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      createUserDto.restaurantId = userRestaurantId;
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Get all users' })
  findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query() query?: PaginationQueryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.ORG_ADMIN) {
      if (!organizationId) {
        return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }
      return this.usersService.findAll(undefined, query, organizationId);
    }
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      return this.usersService.findAll(userRestaurantId, query);
    }
    return this.usersService.findAll(restaurantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      await this.usersService.validateOrgUser(id, organizationId);
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Delete a user' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      await this.usersService.validateOrgUser(id, organizationId);
    }
    return this.usersService.remove(id);
  }
}
