import { OnModuleInit } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';
import { RestaurantDocument } from '../../schemas/restaurant.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class UsersService implements OnModuleInit {
    private userModel;
    private restaurantModel;
    private readonly logger;
    constructor(userModel: Model<UserDocument>, restaurantModel: Model<RestaurantDocument>);
    private toObjectId;
    private normalizeOptionalId;
    validateOrgRestaurant(restaurantId: string | Types.ObjectId, organizationId: string | Types.ObjectId): Promise<void>;
    validateOrgUser(userId: string | Types.ObjectId, organizationId: string | Types.ObjectId): Promise<void>;
    onModuleInit(): Promise<void>;
    private createSuperAdmin;
    create(createUserDto: CreateUserDto): Promise<{
        name: string;
        email: string;
        phone: string;
        role: UserRole;
        organizationId: Types.ObjectId;
        restaurantId: Types.ObjectId;
        isActive: boolean;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    findAll(restaurantId?: string, query?: PaginationQueryDto, organizationId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    private validatePasscodeUnique;
    remove(id: string): Promise<{
        message: string;
    }>;
}
