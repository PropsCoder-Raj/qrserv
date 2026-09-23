import { Model, Types } from 'mongoose';
import { Table, TableDocument } from '../../schemas/table.schema';
import { OrderDocument } from '../../schemas/order.schema';
import { RestaurantDocument } from '../../schemas/restaurant.schema';
import { OrganizationDocument } from '../../schemas/organization.schema';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class TablesService {
    private tableModel;
    private orderModel;
    private restaurantModel;
    private organizationModel;
    constructor(tableModel: Model<TableDocument>, orderModel: Model<OrderDocument>, restaurantModel: Model<RestaurantDocument>, organizationModel: Model<OrganizationDocument>);
    validateOrgRestaurant(restaurantId: string, organizationId: string): Promise<void>;
    validateActiveSubscription(restaurantId: string): Promise<void>;
    create(dto: CreateTableDto, organizationId: string): Promise<import("mongoose").Document<unknown, {}, TableDocument, {}, import("mongoose").DefaultSchemaOptions> & Table & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(restaurantId: string, query?: PaginationQueryDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPublicInfo(id: string): Promise<import("mongoose").Document<unknown, {}, TableDocument, {}, import("mongoose").DefaultSchemaOptions> & Table & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, TableDocument, {}, import("mongoose").DefaultSchemaOptions> & Table & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, dto: UpdateTableDto): Promise<import("mongoose").Document<unknown, {}, TableDocument, {}, import("mongoose").DefaultSchemaOptions> & Table & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
