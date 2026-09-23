import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasscodeLoginDto } from './dto/passcode-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('login-manager')
  @ApiOperation({ summary: 'Login with passcode (manager only)' })
  loginManager(@Body() passcodeLoginDto: PasscodeLoginDto) {
    return this.authService.loginManager(passcodeLoginDto);
  }

  @Public()
  @Post('login-staff')
  @ApiOperation({ summary: 'Login with passcode (staff only)' })
  loginStaff(@Body() passcodeLoginDto: PasscodeLoginDto) {
    return this.authService.loginStaff(passcodeLoginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }
}
