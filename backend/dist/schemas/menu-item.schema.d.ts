import { Document, Types } from 'mongoose';
export declare enum ItemType {
    FOOD = "food",
    LIQUOR = "liquor"
}
export declare class MenuItem {
    name: string;
    description: string;
    price: number;
    image: string;
    categoryId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    isVeg: boolean;
    isAvailable: boolean;
    preparationTime: number;
    itemType: ItemType;
}
export type MenuItemDocument = MenuItem & Document;
export declare const MenuItemSchema: import("mongoose").Schema<MenuItem, import("mongoose").Model<MenuItem, any, any, any, (Document<unknown, any, MenuItem, any, import("mongoose").DefaultSchemaOptions> & MenuItem & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, MenuItem, any, import("mongoose").DefaultSchemaOptions> & MenuItem & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, MenuItem>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MenuItem, Document<unknown, {}, MenuItem, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    description?: import("mongoose").SchemaDefinitionProperty<string, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    price?: import("mongoose").SchemaDefinitionProperty<number, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    image?: import("mongoose").SchemaDefinitionProperty<string, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    categoryId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    restaurantId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    isVeg?: import("mongoose").SchemaDefinitionProperty<boolean, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    isAvailable?: import("mongoose").SchemaDefinitionProperty<boolean, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    preparationTime?: import("mongoose").SchemaDefinitionProperty<number, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    itemType?: import("mongoose").SchemaDefinitionProperty<ItemType, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, MenuItem>;
