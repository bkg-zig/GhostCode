import { Controller, Post, Body, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Response } from 'express';

class RegisterDto {
  @IsEmail()
  email: string;
}

class SetupPasswordDto {
  @IsString()
  apiKey: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register with email - API key will be sent via email' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.registerEmailOnly(registerDto.email);
    return {
      message: 'Registration successful! Check your email for the API key setup link.',
      email: result.email,
      // In dev mode, return the API key directly (in production, only send via email)
      setupUrl: `${process.env.FRONTEND_URL || 'http://localhost:4004'}/setup?key=${result.apiKey}`
    };
  }

  @Post('setup')
  @ApiOperation({ summary: 'Setup password with API key from email' })
  async setupPassword(@Body() setupDto: SetupPasswordDto) {
    return this.authService.setupPassword(setupDto.apiKey, setupDto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    const maxAgeMs = parseInt(process.env.JWT_COOKIE_MAX_AGE_MS || '', 10) || 7 * 24 * 60 * 60 * 1000;
    const secureCookie = process.env.NODE_ENV === 'production';

    res.cookie('ghost_token', result.access_token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: secureCookie ? 'none' : 'lax',
      maxAge: maxAgeMs,
    });

    return {
      user: result.user,
      access_token: result.access_token,
      message: 'Login successful',
    };
  }
}
