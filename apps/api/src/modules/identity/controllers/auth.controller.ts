import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type {
  AuthIdentityResponse,
  AuthSessionResponse,
  ForgotPasswordResponse,
  MessageResponse,
} from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import type { AuthenticatedUser, RequestContextMeta } from '../interfaces/auth.interfaces';
import { AuthService } from '../services/auth.service';

function getRequestMeta(req: Request): RequestContextMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];

  return {
    ipAddress: forwardedIp?.trim() || req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a customer, provider, or business account' })
  @ApiOkResponse({ description: 'User registered with tenant context and session issued' })
  register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthSessionResponse> {
    return this.authService.register(
      dto.email,
      dto.password,
      dto.accountType,
      dto.organizationName,
      getRequestMeta(req),
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthSessionResponse> {
    return this.authService.login(dto.email, dto.password, getRequestMeta(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotate refresh token and issue a new session' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<AuthSessionResponse> {
    return this.authService.refresh(dto.refreshToken, getRequestMeta(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogoutDto,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    return this.authService.logout(user.id, dto.refreshToken, getRequestMeta(req));
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user identity and active tenant context' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthIdentityResponse> {
    return this.authService.me(user.id);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Request a password reset token' })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: Request,
  ): Promise<ForgotPasswordResponse> {
    return this.authService.forgotPassword(dto.email, getRequestMeta(req));
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reset password using a reset token' })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request): Promise<MessageResponse> {
    return this.authService.resetPassword(dto.token, dto.password, getRequestMeta(req));
  }
}
