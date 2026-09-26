import { Document } from 'mongoose';
export declare class SubscriptionOffer {
    months: number;
    offerPercent: number;
}
export declare class Subscription {
    name: string;
    price: number;
    discountType: 'none' | 'flat' | 'percentage';
    discountValue: number;
    isPaymentGatewayAllocated: boolean;
    isMenuPdfEnabled: boolean;
    duration: number;
    razorpayPlanId: string;
    maxTables: number;
    maxMenuItems: number;
    maxCategories: number;
    maxRestaurants: number;
    customerDataAccess: string;
    features: string[];
    offers: SubscriptionOffer[];
    isActive: boolean;
}
export type SubscriptionDocument = Subscription & Document;
export declare const SubscriptionSchema: import("mongoose").Schema<Subscription, import("mongoose").Model<Subscription, any, any, any, (Document<unknown, any, Subscription, any, import("mongoose").DefaultSchemaOptions> & Subscription & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Subscription, any, import("mongoose").DefaultSchemaOptions> & Subscription & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, Subscription>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Subscription, Document<unknown, {}, Subscription, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    price?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    discountType?: import("mongoose").SchemaDefinitionProperty<"none" | "flat" | "percentage", Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    discountValue?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    isPaymentGatewayAllocated?: import("mongoose").SchemaDefinitionProperty<boolean, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    isMenuPdfEnabled?: import("mongoose").SchemaDefinitionProperty<boolean, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    duration?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    razorpayPlanId?: import("mongoose").SchemaDefinitionProperty<string, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    maxTables?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    maxMenuItems?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    maxCategories?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    maxRestaurants?: import("mongoose").SchemaDefinitionProperty<number, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    customerDataAccess?: import("mongoose").SchemaDefinitionProperty<string, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    features?: import("mongoose").SchemaDefinitionProperty<string[], Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    offers?: import("mongoose").SchemaDefinitionProperty<SubscriptionOffer[], Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    isActive?: import("mongoose").SchemaDefinitionProperty<boolean, Subscription, Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, Subscription>;
