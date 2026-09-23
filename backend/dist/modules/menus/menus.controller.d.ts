import { MenusService } from './menus.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class MenusController {
    private readonly menusService;
    constructor(menusService: MenusService);
    getFullMenu(restaurantId: string): Promise<unknown>;
    createCategory(dto: CreateCategoryDto, role?: string, organizationId?: string, userRestaurantId?: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").CategoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findCategories(restaurantId: string, includeInactive?: string, query?: PaginationQueryDto, role?: string, organizationId?: string, userRestaurantId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas").CategoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
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
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").CategoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    removeCategory(id: string): Promise<{
        message: string;
    }>;
    createMenuItem(dto: CreateMenuItemDto, role?: string, organizationId?: string, userRestaurantId?: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").MenuItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").MenuItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findMenuItems(restaurantId: string, categoryId?: string, includeInactive?: string, query?: PaginationQueryDto, role?: string, organizationId?: string, userRestaurantId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas").MenuItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").MenuItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
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
    updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").MenuItemDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").MenuItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
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
}
