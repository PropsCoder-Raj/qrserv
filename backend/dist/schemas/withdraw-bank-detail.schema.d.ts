import { Document, Types } from 'mongoose';
export declare enum WithdrawBankDetailType {
    PERSONAL = "personal",
    OTHER = "other"
}
export declare class WithdrawBankDetail {
    organizationId: Types.ObjectId;
    userId: Types.ObjectId;
    bankDetailType: WithdrawBankDetailType;
    customBankDetailLabel: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
}
export type WithdrawBankDetailDocument = WithdrawBankDetail & Document;
export declare const WithdrawBankDetailSchema: import("mongoose").Schema<WithdrawBankDetail, import("mongoose").Model<WithdrawBankDetail, any, any, any, (Document<unknown, any, WithdrawBankDetail, any, import("mongoose").DefaultSchemaOptions> & WithdrawBankDetail & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, WithdrawBankDetail, any, import("mongoose").DefaultSchemaOptions> & WithdrawBankDetail & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, WithdrawBankDetail>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    organizationId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    bankDetailType?: import("mongoose").SchemaDefinitionProperty<WithdrawBankDetailType, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    customBankDetailLabel?: import("mongoose").SchemaDefinitionProperty<string, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    accountHolderName?: import("mongoose").SchemaDefinitionProperty<string, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    bankName?: import("mongoose").SchemaDefinitionProperty<string, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    accountNumber?: import("mongoose").SchemaDefinitionProperty<string, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
    ifscCode?: import("mongoose").SchemaDefinitionProperty<string, WithdrawBankDetail, Document<unknown, {}, WithdrawBankDetail, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<WithdrawBankDetail & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }>;
}, WithdrawBankDetail>;
