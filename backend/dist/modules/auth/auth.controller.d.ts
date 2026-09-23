import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasscodeLoginDto } from './dto/passcode-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: import("../../schemas").UserRole;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: import("../../schemas").UserRole;
            organizationId: import("mongoose").Types.ObjectId;
            restaurantId: import("mongoose").Types.ObjectId;
        };
    }>;
    loginManager(passcodeLoginDto: PasscodeLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: import("../../schemas").UserRole;
            organizationId: import("mongoose").Types.ObjectId;
            restaurantId: import("mongoose").Types.ObjectId;
        };
    }>;
    loginStaff(passcodeLoginDto: PasscodeLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: import("../../schemas").UserRole;
            organizationId: import("mongoose").Types.ObjectId;
            restaurantId: import("mongoose").Types.ObjectId;
        };
    }>;
    refresh(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
