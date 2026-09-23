import { Document, Types } from 'mongoose';
export declare enum PaymentSchemaStatus {
    CREATED = "created",
    CAPTURED = "captured",
    FAILED = "failed"
}
export declare class Payment {
    orderId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
    currency: string;
    status: PaymentSchemaStatus;
}
export type PaymentDocument = Payment & Document;
export declare const PaymentSchema: import("mongoose").Schema<Payment, import("mongoose").Model<Payment, any, any, any, (Document<unknown, any, Payment, any, import("mongoose").DefaultSchemaOptions> & Payment & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Payment, any, import("mongoose").DefaultSchemaOptions> & Payment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, Payment>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Payment, Document<unknown, {}, Payment, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    orderId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Payment, Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    restaurantId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Payment, Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    razorpayOrderId?: import("mongoose").SchemaDefinitionProperty<string, Payment, Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    razorpayPaymentId?: import("mongoose").SchemaDefinitionProperty<string, Payment, Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    razorpaySignature?: import("mongoose").SchemaDefinitionProperty<string, Payment, Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Payment, Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    currency?: import("mongoose").SchemaDefinitionProperty<string, Payment, Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    status?: import("mongoose").SchemaDefinitionProperty<PaymentSchemaStatus, Payment, Document<unknown, {}, Payment, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Payment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, Payment>;
