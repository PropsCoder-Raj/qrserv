import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { MenuItem, MenuItemDocument } from '../../schemas/menu-item.schema';
import { RestaurantDocument } from '../../schemas/restaurant.schema';
import { OrganizationDocument } from '../../schemas/organization.schema';
import { CacheService } from '../../common/cache/cache.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class MenusService {
    private categoryModel;
    private menuItemModel;
    private restaurantModel;
    private organizationModel;
    private cacheService;
    constructor(categoryModel: Model<CategoryDocument>, menuItemModel: Model<MenuItemDocument>, restaurantModel: Model<RestaurantDocument>, organizationModel: Model<OrganizationDocument>, cacheService: CacheService);
    validateOrgRestaurant(restaurantId: string, organizationId: string): Promise<void>;
    validateActiveSubscription(restaurantId: string): Promise<void>;
    private removeMenuItemImageFile;
    createCategory(dto: CreateCategoryDto, organizationId: string): Promise<import("mongoose").Document<unknown, {}, CategoryDocument, {}, import("mongoose").DefaultSchemaOptions> & Category & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findCategories(restaurantId: string, query?: PaginationQueryDto, includeInactive?: boolean): Promise<{
        data: (import("mongoose").Document<unknown, {}, CategoryDocument, {}, import("mongoose").DefaultSchemaOptions> & Category & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<import("mongoose").Document<unknown, {}, CategoryDocument, {}, import("mongoose").DefaultSchemaOptions> & Category & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    removeCategory(id: string): Promise<{
        message: string;
    }>;
    createMenuItem(dto: CreateMenuItemDto, organizationId: string): Promise<import("mongoose").Document<unknown, {}, MenuItemDocument, {}, import("mongoose").DefaultSchemaOptions> & MenuItem & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findMenuItems(restaurantId: string, categoryId?: string, query?: PaginationQueryDto, includeInactive?: boolean): Promise<{
        data: (import("mongoose").Document<unknown, {}, MenuItemDocument, {}, import("mongoose").DefaultSchemaOptions> & MenuItem & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<import("mongoose").Document<unknown, {}, MenuItemDocument, {}, import("mongoose").DefaultSchemaOptions> & MenuItem & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    uploadMenuItemImage(id: string, file: any): Promise<{
        message: string;
        image: string;
    }>;
    removeMenuItem(id: string): Promise<{
        message: string;
    }>;
    getFullMenu(restaurantId: string): Promise<unknown>;
}
