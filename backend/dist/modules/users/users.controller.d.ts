import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, role?: string, organizationId?: string, userRestaurantId?: string): Promise<{
        name: string;
        email: string;
        phone: string;
        role: import("../../schemas").UserRole;
        organizationId: import("mongoose").Types.ObjectId;
        restaurantId: import("mongoose").Types.ObjectId;
        isActive: boolean;
        _id: import("mongoose").Types.ObjectId;
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
    findAll(restaurantId?: string, query?: PaginationQueryDto, role?: string, organizationId?: string, userRestaurantId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("../../schemas").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    }> | {
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    update(id: string, updateUserDto: UpdateUserDto, role?: string, organizationId?: string): Promise<import("mongoose").Document<unknown, {}, import("../../schemas").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../schemas").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    remove(id: string, role?: string, organizationId?: string): Promise<{
        message: string;
    }>;
}
