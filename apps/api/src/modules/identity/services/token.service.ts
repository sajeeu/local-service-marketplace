import { createHash, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { RoleName, User } from '@prisma/client';
import type { AuthTokens } from '@local-service-marketplace/shared-types';
import type { AppConfig } from '../../../config/env.validation';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { JwtAccessPayload, RequestContextMeta } from '../interfaces/auth.interfaces';

type JwtExpiresIn = number | `${number}${'s' | 'm' | 'h' | 'd'}`;

function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const multiplier = multipliers[unit];
  if (multiplier === undefined) {
    throw new Error(`Invalid duration unit: ${unit}`);
  }

  return amount * multiplier;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  generateOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  async issueTokenPair(
    user: Pick<User, 'id' | 'email' | 'activeTenantId'>,
    roles: RoleName[],
    meta: RequestContextMeta = {},
    activeTenantId?: string | null,
  ): Promise<AuthTokens> {
    const accessExpiresIn = this.configService.get('JWT_ACCESS_EXPIRES_IN', {
      infer: true,
    }) as JwtExpiresIn;
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', {
      infer: true,
    }) as JwtExpiresIn;
    const accessSecret = this.configService.get('JWT_ACCESS_SECRET', { infer: true });
    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET', { infer: true });

    const tid = activeTenantId ?? user.activeTenantId ?? undefined;

    const payload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      roles,
      ...(tid ? { tid } : {}),
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti: this.generateOpaqueToken() },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      },
    );

    const expiresAt = new Date(Date.now() + parseDurationToMs(String(refreshExpiresIn)));

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: String(accessExpiresIn),
    };
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    meta: RequestContextMeta = {},
  ): Promise<{ tokens: AuthTokens; userId: string }> {
    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET', { infer: true });

    let payload: { sub?: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub?: string }>(rawRefreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            roles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const roles = existing.user.roles.map((entry) => entry.role.name);
    const tokens = await this.issueTokenPair(
      existing.user,
      roles,
      meta,
      existing.user.activeTenantId,
    );

    const newToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: existing.userId,
        tokenHash: this.hashToken(tokens.refreshToken),
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: newToken?.id,
      },
    });

    return { tokens, userId: existing.userId };
  }

  async revokeRefreshToken(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  getPasswordResetExpiry(): Date {
    const expiresIn = this.configService.get('PASSWORD_RESET_EXPIRES_IN', { infer: true });
    return new Date(Date.now() + parseDurationToMs(expiresIn));
  }
}
