import { Document, Types } from 'mongoose';
export declare enum ItemType {
    FOOD = "food",
    LIQUOR = "liquor"
}
export declare class CustomizationOption {
    name: string;
    emoji: string;
    priceDelta: number;
}
export declare const CustomizationOptionSchema: import("mongoose").Schema<CustomizationOption, import("mongoose").Model<CustomizationOption, any, any, any, (Document<unknown, any, CustomizationOption, any, import("mongoose").DefaultSchemaOptions> & CustomizationOption & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, CustomizationOption, any, import("mongoose").DefaultSchemaOptions> & CustomizationOption & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, CustomizationOption>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CustomizationOption, Document<unknown, {}, CustomizationOption, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<CustomizationOption & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, CustomizationOption, Document<unknown, {}, CustomizationOption, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<CustomizationOption & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    emoji?: import("mongoose").SchemaDefinitionProperty<string, CustomizationOption, Document<unknown, {}, CustomizationOption, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<CustomizationOption & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    priceDelta?: import("mongoose").SchemaDefinitionProperty<number, CustomizationOption, Document<unknown, {}, CustomizationOption, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<CustomizationOption & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, CustomizationOption>;
export declare class MenuItemCustomization {
    spiceLevels: CustomizationOption[];
    addOns: CustomizationOption[];
    allowSpecialInstructions: boolean;
}
export declare const MenuItemCustomizationSchema: import("mongoose").Schema<MenuItemCustomization, import("mongoose").Model<MenuItemCustomization, any, any, any, (Document<unknown, any, MenuItemCustomization, any, import("mongoose").DefaultSchemaOptions> & MenuItemCustomization & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, MenuItemCustomization, any, import("mongoose").DefaultSchemaOptions> & MenuItemCustomization & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, MenuItemCustomization>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MenuItemCustomization, Document<unknown, {}, MenuItemCustomization, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItemCustomization & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    spiceLevels?: import("mongoose").SchemaDefinitionProperty<CustomizationOption[], MenuItemCustomization, Document<unknown, {}, MenuItemCustomization, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItemCustomization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    addOns?: import("mongoose").SchemaDefinitionProperty<CustomizationOption[], MenuItemCustomization, Document<unknown, {}, MenuItemCustomization, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItemCustomization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    allowSpecialInstructions?: import("mongoose").SchemaDefinitionProperty<boolean, MenuItemCustomization, Document<unknown, {}, MenuItemCustomization, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItemCustomization & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, MenuItemCustomization>;
export declare class MenuItem {
    name: string;
    description: string;
    ingredients: string;
    price: number;
    image: string;
    categoryId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    isVeg: boolean;
    isAvailable: boolean;
    preparationTime: number;
    itemType: ItemType;
    customization: MenuItemCustomization;
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
    ingredients?: import("mongoose").SchemaDefinitionProperty<string, MenuItem, Document<unknown, {}, MenuItem, {
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
    customization?: import("mongoose").SchemaDefinitionProperty<MenuItemCustomization, MenuItem, Document<unknown, {}, MenuItem, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<MenuItem & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, MenuItem>;
