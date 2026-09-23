import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasscodeLoginDto } from './dto/passcode-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private toObjectId(
    value: string | Types.ObjectId | null | undefined,
    fieldName: string,
  ) {
    if (!value) {
      throw new UnauthorizedException(`Invalid ${fieldName}`);
    }

    if (value instanceof Types.ObjectId) {
      return value;
    }

    const valueString = value.toString().trim();
    if (!Types.ObjectId.isValid(valueString)) {
      throw new UnauthorizedException(`Invalid ${fieldName}`);
    }

    return new Types.ObjectId(valueString);
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: registerDto.email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userModel.create({
      ...registerDto,
      password: hashedPassword,
      role: registerDto.role || UserRole.RESTAURANT_OWNER,
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

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
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

  async loginManager(dto: PasscodeLoginDto) {
    return this.loginWithRole(dto, UserRole.MANAGER);
  }

  async loginStaff(dto: PasscodeLoginDto) {
    return this.loginWithRole(dto, UserRole.STAFF);
  }

  private async loginWithRole(dto: PasscodeLoginDto, role: UserRole) {
    const restaurantObjectId = this.toObjectId(
      dto.restaurantId,
      'restaurantId',
    );
    const query: any = {
      role,
      isActive: true,
      restaurantId: restaurantObjectId,
      passcode: { $exists: true, $ne: null },
    };

    const users = await this.userModel.find(query);

    let matchedUser: UserDocument | null = null;
    for (const user of users) {
      const isMatch = await bcrypt.compare(dto.passcode, user.passcode);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid passcode');
    }

    const tokens = await this.generateTokens(matchedUser);
    await this.updateRefreshToken(
      matchedUser._id.toString(),
      tokens.refreshToken,
    );

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

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiration') as any,
      }),
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiration',
        ) as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }
}
