import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { UserDocument, UserRole } from '../../schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasscodeLoginDto } from './dto/passcode-login.dto';
export declare class AuthService {
    private userModel;
    private jwtService;
    private configService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService, configService: ConfigService);
    private toObjectId;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: Types.ObjectId;
            name: string;
            email: string;
            role: UserRole;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: Types.ObjectId;
            name: string;
            email: string;
            role: UserRole;
            organizationId: Types.ObjectId;
            restaurantId: Types.ObjectId;
        };
    }>;
    loginManager(dto: PasscodeLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: Types.ObjectId;
            name: string;
            email: string;
            role: UserRole;
            organizationId: Types.ObjectId;
            restaurantId: Types.ObjectId;
        };
    }>;
    loginStaff(dto: PasscodeLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: Types.ObjectId;
            name: string;
            email: string;
            role: UserRole;
            organizationId: Types.ObjectId;
            restaurantId: Types.ObjectId;
        };
    }>;
    private loginWithRole;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private generateTokens;
    private updateRefreshToken;
}
