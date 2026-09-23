import { Document, Types } from 'mongoose';
export declare class SubscriptionHistory {
    organizationId: Types.ObjectId;
    subscriptionId: Types.ObjectId;
    planName: string;
    price: number;
    duration: number;
    trialDays: number;
    months: number;
    purchasedAt: Date;
    expiresAt: Date;
    purchasedBy: Types.ObjectId;
    status: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    paymentStatus: string;
}
export type SubscriptionHistoryDocument = SubscriptionHistory & Document;
export declare const SubscriptionHistorySchema: import("mongoose").Schema<SubscriptionHistory, import("mongoose").Model<SubscriptionHistory, any, any, any, (Document<unknown, any, SubscriptionHistory, any, import("mongoose").DefaultSchemaOptions> & SubscriptionHistory & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, SubscriptionHistory, any, import("mongoose").DefaultSchemaOptions> & SubscriptionHistory & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, SubscriptionHistory>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organizationId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    subscriptionId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    planName?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    price?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    duration?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    trialDays?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    months?: import("mongoose").SchemaDefinitionProperty<number, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    purchasedAt?: import("mongoose").SchemaDefinitionProperty<Date, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    purchasedBy?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    status?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    razorpayOrderId?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    razorpayPaymentId?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    paymentStatus?: import("mongoose").SchemaDefinitionProperty<string, SubscriptionHistory, Document<unknown, {}, SubscriptionHistory, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<SubscriptionHistory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, SubscriptionHistory>;
