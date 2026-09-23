import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenusService } from './menus.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CurrentUser, Roles, Role, Public } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Menus')
@Controller('api')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // --- Public full menu ---

  @Public()
  @Get('menu/:restaurantId')
  @ApiOperation({ summary: 'Get full menu by restaurant (public)' })
  getFullMenu(@Param('restaurantId') restaurantId: string) {
    return this.menusService.getFullMenu(restaurantId);
  }

  // --- Categories ---

  @Post('categories')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create a category' })
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      await this.menusService.validateOrgRestaurant(
        dto.restaurantId,
        organizationId,
      );
    }
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      dto.restaurantId = userRestaurantId;
    }
    return this.menusService.createCategory(dto, organizationId);
  }

  @Get('categories')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get categories by restaurant' })
  async findCategories(
    @Query('restaurantId') restaurantId: string,
    @Query('includeInactive') includeInactive?: string,
    @Query() query?: PaginationQueryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId && restaurantId) {
      await this.menusService.validateOrgRestaurant(
        restaurantId,
        organizationId,
      );
    }
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      restaurantId = userRestaurantId;
    }
    return this.menusService.findCategories(
      restaurantId,
      query,
      includeInactive === 'true',
    );
  }

  @Patch('categories/:id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menusService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Delete a category' })
  removeCategory(@Param('id') id: string) {
    return this.menusService.removeCategory(id);
  }

  // --- Menu Items ---

  @Post('menu-items')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create a menu item' })
  async createMenuItem(
    @Body() dto: CreateMenuItemDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      await this.menusService.validateOrgRestaurant(
        dto.restaurantId,
        organizationId,
      );
    }
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      dto.restaurantId = userRestaurantId;
    }
    return this.menusService.createMenuItem(dto, organizationId);
  }

  @Get('menu-items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get menu items by restaurant' })
  async findMenuItems(
    @Query('restaurantId') restaurantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query() query?: PaginationQueryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId && restaurantId) {
      await this.menusService.validateOrgRestaurant(
        restaurantId,
        organizationId,
      );
    }
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      restaurantId = userRestaurantId;
    }
    return this.menusService.findMenuItems(
      restaurantId,
      categoryId,
      query,
      includeInactive === 'true',
    );
  }

  @Patch('menu-items/:id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update a menu item' })
  updateMenuItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menusService.updateMenuItem(id, dto);
  }

  @Post('menu-items/:id/image')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Upload or replace a menu item image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
        ];

        if (!allowedMimeTypes.includes(file?.mimetype)) {
          return cb(new Error('Only PNG, JPG, JPEG, and WEBP files are allowed'), false);
        }

        cb(null, true);
      },
    }),
  )
  uploadMenuItemImage(@Param('id') id: string, @UploadedFile() file: any) {
    return this.menusService.uploadMenuItemImage(id, file);
  }

  @Delete('menu-items/:id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Delete a menu item' })
  removeMenuItem(@Param('id') id: string) {
    return this.menusService.removeMenuItem(id);
  }
}
