import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { UserDocument } from '../../../schemas/user.schema';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private userModel;
    constructor(configService: ConfigService, userModel: Model<UserDocument>);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
    }): Promise<{
        userId: string;
        email: string;
        role: string;
        organizationId: import("mongoose").Types.ObjectId;
        restaurantId: import("mongoose").Types.ObjectId;
    }>;
}
export {};
