import { Document, Types } from 'mongoose';
export declare enum WithdrawRequestStatus {
    PENDING = "pending",
    APPROVED = "approved",
    PAID = "paid",
    REJECTED = "rejected"
}
export declare class WithdrawRequest {
    organizationId: Types.ObjectId;
    requestedByUserId: Types.ObjectId;
    amount: number;
    chargePercentage: number;
    chargeBaseAmount: number;
    chargeGstPercentage: number;
    chargeGstAmount: number;
    chargeAmount: number;
    netAmount: number;
    note: string;
    bankDetailId: Types.ObjectId;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    status: WithdrawRequestStatus;
    approvedByUserId: Types.ObjectId;
    approvedAt: Date;
    approvalNote: string;
    paidByUserId: Types.ObjectId;
    paidAt: Date;
    paymentReference: string;
    paymentNote: string;
    paymentProofUrl: string;
    paymentProofName: string;
}
export type WithdrawRequestDocument = WithdrawRequest & Document;
export declare const WithdrawRequestSchema: import("mongoose").Schema<WithdrawRequest, import("mongoose").Model<WithdrawRequest, any, any, any, (Document<unknown, any, WithdrawRequest, any, import("mongoose").DefaultSchemaOptions> & WithdrawRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, WithdrawRequest, any, import("mongoose").DefaultSchemaOptions> & WithdrawRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, WithdrawRequest>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organizationId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    requestedByUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    amount?: import("mongoose").SchemaDefinitionProperty<number, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    chargePercentage?: import("mongoose").SchemaDefinitionProperty<number, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    chargeBaseAmount?: import("mongoose").SchemaDefinitionProperty<number, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    chargeGstPercentage?: import("mongoose").SchemaDefinitionProperty<number, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    chargeGstAmount?: import("mongoose").SchemaDefinitionProperty<number, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    chargeAmount?: import("mongoose").SchemaDefinitionProperty<number, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    netAmount?: import("mongoose").SchemaDefinitionProperty<number, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    note?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    bankDetailId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    accountHolderName?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    bankName?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    accountNumber?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    ifscCode?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    status?: import("mongoose").SchemaDefinitionProperty<WithdrawRequestStatus, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    approvedByUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    approvedAt?: import("mongoose").SchemaDefinitionProperty<Date, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    approvalNote?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    paidByUserId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    paidAt?: import("mongoose").SchemaDefinitionProperty<Date, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    paymentReference?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    paymentNote?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    paymentProofUrl?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    paymentProofName?: import("mongoose").SchemaDefinitionProperty<string, WithdrawRequest, Document<unknown, {}, WithdrawRequest, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, WithdrawRequest>;
