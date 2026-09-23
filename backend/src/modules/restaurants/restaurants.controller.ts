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
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CurrentUser, Roles, Role, Public } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Restaurants')
@Controller('api/restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Create a new restaurant' })
  create(
    @Body() createRestaurantDto: CreateRestaurantDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      createRestaurantDto.organizationId = organizationId;
    }
    return this.restaurantsService.create(createRestaurantDto, userId);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({ summary: 'Get all restaurants' })
  findAll(
    @Query() query?: PaginationQueryDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      return this.restaurantsService.findAll(query, organizationId);
    }
    return this.restaurantsService.findAll(query);
  }

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurants owned by current user' })
  findMyRestaurants(
    @CurrentUser('userId') userId: string,
    @CurrentUser('organizationId') organizationId?: string,
    @CurrentUser('restaurantId') userRestaurantId?: string,
    @CurrentUser('role') role?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    if (role === Role.RESTAURANT_OWNER && userRestaurantId) {
      return this.restaurantsService.findByRestaurantId(userRestaurantId);
    }
    return this.restaurantsService.findByOwner(userId, query, organizationId);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get restaurant by slug (public)' })
  findBySlug(@Param('slug') slug: string) {
    return this.restaurantsService.findBySlug(slug);
  }

  @Public()
  @Get(':id/info')
  @ApiOperation({ summary: 'Get basic restaurant info by ID (public)' })
  getPublicInfo(@Param('id') id: string) {
    return this.restaurantsService.getPublicInfo(id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a restaurant by ID' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.RESTAURANT_OWNER)
  @ApiOperation({ summary: 'Update a restaurant' })
  async update(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      await this.restaurantsService.validateOrgRestaurant(id, organizationId);
    }
    return this.restaurantsService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a restaurant' })
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }

  @Post(':id/menu-pdf')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @ApiOperation({
    summary: 'Upload/replace a restaurant menu PDF (single doc per restaurant)',
  })
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
      // rely on @nestjs/platform-express default multer memory storage
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (file?.mimetype !== 'application/pdf') {
          return cb(new Error('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadMenuPdf(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @CurrentUser('role') role?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    if (role === Role.ORG_ADMIN && organizationId) {
      await this.restaurantsService.validateOrgRestaurant(id, organizationId);
    }
    return this.restaurantsService.uploadMenuPdf(id, file);
  }
}
