import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from '../../../config/env.validation';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { AuthenticatedUser, JwtAccessPayload } from '../interfaces/auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const roles = user.roles.map((entry) => entry.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((entry) => entry.role.permissions.map((rp) => rp.permission.code)),
      ),
    ];

    return {
      id: user.id,
      email: user.email,
      roles,
      permissions,
    };
  }
}
