import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { AppConfig } from '../../../config/env.validation';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantContextService } from '../../tenancy/services/tenant-context.service';
import { toCurrentTenantResponse } from '../../tenancy/utils/tenancy.mapper';
import type { AuthenticatedUser, JwtAccessPayload } from '../interfaces/auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
    private readonly tenantContextService: TenantContextService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET', { infer: true }),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtAccessPayload): Promise<AuthenticatedUser> {
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

    const headerRaw = req.headers['x-tenant-id'];
    const headerTenantId = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;

    const context = await this.tenantContextService.resolve({
      userId: user.id,
      headerTenantId,
      jwtTenantId: payload.tid,
      storedTenantId: user.activeTenantId,
    });

    const tenantContext = context
      ? toCurrentTenantResponse(context.tenant, context.membership, context.organization)
      : null;

    return {
      id: user.id,
      email: user.email,
      roles,
      permissions,
      activeTenantId: context?.tenant.id ?? user.activeTenantId,
      tenantContext,
      tenantPermissions: context?.permissions ?? [],
    };
  }
}
