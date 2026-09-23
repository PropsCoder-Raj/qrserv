import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    create(dto: CreateTableDto, user?: any, role?: string, organizationId?: string, userRestaurantId?: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").TableDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Table & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(restaurantId: string, query?: PaginationQueryDto, role?: string, organizationId?: string, userRestaurantId?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPublicInfo(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").TableDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Table & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").TableDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Table & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, dto: UpdateTableDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").TableDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").Table & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
