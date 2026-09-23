import { Document, Types } from 'mongoose';
export declare enum RestaurantType {
    SMALL_CART_STALL = "small cart stall",
    DINING = "dining",
    KITCHEN = "kitchen"
}
export declare enum TaxType {
    INCLUSIVE = "inclusive",
    EXCLUSIVE = "exclusive"
}
export declare class Restaurant {
    name: string;
    slug: string;
    owner_name: string;
    restaurant_type: RestaurantType;
    description: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    gst_no: string;
    vat_no: string;
    taxEnabled: boolean;
    taxRate: number;
    taxType: TaxType;
    vatEnabled: boolean;
    vatRate: number;
    vatType: TaxType;
    ownerId: Types.ObjectId;
    organizationId: Types.ObjectId;
    isActive: boolean;
    menuPdf?: string;
}
export type RestaurantDocument = Restaurant & Document;
export declare const RestaurantSchema: import("mongoose").Schema<Restaurant, import("mongoose").Model<Restaurant, any, any, any, (Document<unknown, any, Restaurant, any, import("mongoose").DefaultSchemaOptions> & Restaurant & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Restaurant, any, import("mongoose").DefaultSchemaOptions> & Restaurant & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Restaurant>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Restaurant, Document<unknown, {}, Restaurant, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    slug?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    owner_name?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    restaurant_type?: import("mongoose").SchemaDefinitionProperty<RestaurantType, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    description?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    logo?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    address?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    phone?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    email?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    gst_no?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    vat_no?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    taxEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    taxRate?: import("mongoose").SchemaDefinitionProperty<number, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    taxType?: import("mongoose").SchemaDefinitionProperty<TaxType, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    vatEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    vatRate?: import("mongoose").SchemaDefinitionProperty<number, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    vatType?: import("mongoose").SchemaDefinitionProperty<TaxType, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    ownerId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    organizationId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    menuPdf?: import("mongoose").SchemaDefinitionProperty<string, Restaurant, Document<unknown, {}, Restaurant, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Restaurant & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, Restaurant>;
