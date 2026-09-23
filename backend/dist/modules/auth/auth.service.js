"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
const user_schema_1 = require("../../schemas/user.schema");
let AuthService = class AuthService {
    constructor(userModel, jwtService, configService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    toObjectId(value, fieldName) {
        if (!value) {
            throw new common_1.UnauthorizedException(`Invalid ${fieldName}`);
        }
        if (value instanceof mongoose_2.Types.ObjectId) {
            return value;
        }
        const valueString = value.toString().trim();
        if (!mongoose_2.Types.ObjectId.isValid(valueString)) {
            throw new common_1.UnauthorizedException(`Invalid ${fieldName}`);
        }
        return new mongoose_2.Types.ObjectId(valueString);
    }
    async register(registerDto) {
        const existing = await this.userModel.findOne({ email: registerDto.email });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.userModel.create({
            ...registerDto,
            password: hashedPassword,
            role: registerDto.role || user_schema_1.UserRole.RESTAURANT_OWNER,
        });
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);
        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        };
    }
    async login(loginDto) {
        const user = await this.userModel.findOne({ email: loginDto.email });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);
        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                restaurantId: user.restaurantId,
            },
            ...tokens,
        };
    }
    async loginManager(dto) {
        return this.loginWithRole(dto, user_schema_1.UserRole.MANAGER);
    }
    async loginStaff(dto) {
        return this.loginWithRole(dto, user_schema_1.UserRole.STAFF);
    }
    async loginWithRole(dto, role) {
        const restaurantObjectId = this.toObjectId(dto.restaurantId, 'restaurantId');
        const query = {
            role,
            isActive: true,
            restaurantId: restaurantObjectId,
            passcode: { $exists: true, $ne: null },
        };
        const users = await this.userModel.find(query);
        let matchedUser = null;
        for (const user of users) {
            const isMatch = await bcrypt.compare(dto.passcode, user.passcode);
            if (isMatch) {
                matchedUser = user;
                break;
            }
        }
        if (!matchedUser) {
            throw new common_1.UnauthorizedException('Invalid passcode');
        }
        const tokens = await this.generateTokens(matchedUser);
        await this.updateRefreshToken(matchedUser._id.toString(), tokens.refreshToken);
        return {
            user: {
                id: matchedUser._id,
                name: matchedUser.name,
                email: matchedUser.email,
                role: matchedUser.role,
                organizationId: matchedUser.organizationId,
                restaurantId: matchedUser.restaurantId,
            },
            ...tokens,
        };
    }
    async refreshTokens(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('jwt.refreshSecret'),
            });
            const user = await this.userModel.findById(payload.sub);
            if (!user || !user.refreshToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!isRefreshTokenValid) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const tokens = await this.generateTokens(user);
            await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);
            return tokens;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async generateTokens(user) {
        const payload = { sub: user._id, email: user.email, role: user.role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.secret'),
                expiresIn: this.configService.get('jwt.expiration'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.refreshSecret'),
                expiresIn: this.configService.get('jwt.refreshExpiration'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.userModel.findByIdAndUpdate(userId, {
            refreshToken: hashedRefreshToken,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map