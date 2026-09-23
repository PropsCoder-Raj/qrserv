import { Document, Types } from 'mongoose';
export declare class Table {
    tableNumber: string;
    capacity: number;
    restaurantId: Types.ObjectId;
    qrCode: string;
    isActive: boolean;
}
export type TableDocument = Table & Document;
export declare const TableSchema: import("mongoose").Schema<Table, import("mongoose").Model<Table, any, any, any, (Document<unknown, any, Table, any, import("mongoose").DefaultSchemaOptions> & Table & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Table, any, import("mongoose").DefaultSchemaOptions> & Table & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Table>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Table, Document<unknown, {}, Table, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Table & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    tableNumber?: import("mongoose").SchemaDefinitionProperty<string, Table, Document<unknown, {}, Table, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Table & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    capacity?: import("mongoose").SchemaDefinitionProperty<number, Table, Document<unknown, {}, Table, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Table & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    restaurantId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Table, Document<unknown, {}, Table, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Table & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    qrCode?: import("mongoose").SchemaDefinitionProperty<string, Table, Document<unknown, {}, Table, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Table & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Table, Document<unknown, {}, Table, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Table & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, Table>;
