import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthSessionResponse } from '@local-service-marketplace/shared-types';
import type { Request } from 'express';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import type {
  AuthenticatedUser,
  RequestContextMeta,
} from '../../identity/interfaces/auth.interfaces';
import { TokenService } from '../../identity/services/token.service';
import { CreateOrganizationDto } from '../dto/tenancy.dto';
import { TenantGuard } from '../guards/tenant.guard';
import { TenancyProvisionService } from '../services/tenancy-provision.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RoleName } from '@prisma/client';

function getRequestMeta(req: Request): RequestContextMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];

  return {
    ipAddress: forwardedIp?.trim() || req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@ApiTags('organizations')
@ApiBearerAuth()
@Controller({ path: 'organizations', version: '1' })
@UseGuards(TenantGuard)
export class OrganizationsController {
  constructor(
    private readonly tenancyProvisionService: TenancyProvisionService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a business organization (one owned business tenant per user)',
  })
  @ApiCreatedResponse({ description: 'Organization created and set as active tenant' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganizationDto,
    @Req() req: Request,
  ): Promise<AuthSessionResponse> {
    const meta = getRequestMeta(req);
    const tenantContext = await this.tenancyProvisionService.createBusinessOrganizationForUser(
      user.id,
      dto,
      meta,
    );

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
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

    if (!dbUser) {
      throw new Error('User not found after organization creation');
    }

    const roles = dbUser.roles.map((entry) => entry.role.name as RoleName);
    const permissions = [
      ...new Set(
        dbUser.roles.flatMap((entry) => entry.role.permissions.map((rp) => rp.permission.code)),
      ),
    ].sort();

    const tokens = await this.tokenService.issueTokenPair(
      dbUser,
      roles,
      meta,
      tenantContext.tenant.id,
    );

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        status: dbUser.status,
        emailVerifiedAt: dbUser.emailVerifiedAt?.toISOString() ?? null,
        roles,
        permissions,
        activeTenantId: dbUser.activeTenantId,
        createdAt: dbUser.createdAt.toISOString(),
      },
      tokens,
      tenantContext,
    };
  }
}
