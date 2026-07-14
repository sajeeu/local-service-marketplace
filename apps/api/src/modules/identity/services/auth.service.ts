import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleName, UserStatus, type User } from '@prisma/client';
import type {
  AuthIdentityResponse,
  AuthSessionResponse,
  AuthUser,
  ForgotPasswordResponse,
  MessageResponse,
} from '@local-service-marketplace/shared-types';
import type { AppConfig } from '../../../config/env.validation';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantContextService } from '../../tenancy/services/tenant-context.service';
import {
  TenancyProvisionService,
  type RegisterAccountType,
} from '../../tenancy/services/tenancy-provision.service';
import type { RequestContextMeta } from '../interfaces/auth.interfaces';
import { AccountTypeDto } from '../dto/auth.dto';
import { AuditService } from './audit.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

type UserWithRoles = User & {
  roles: Array<{
    role: {
      name: RoleName;
      permissions: Array<{
        permission: { code: string };
      }>;
    };
  }>;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly tenancyProvisionService: TenancyProvisionService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async register(
    email: string,
    password: string,
    accountType: AccountTypeDto,
    organizationName: string | undefined,
    meta: RequestContextMeta = {},
  ): Promise<AuthSessionResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    if (accountType === AccountTypeDto.BUSINESS && !organizationName?.trim()) {
      throw new BadRequestException('Organization name is required for business accounts');
    }

    const roleName = this.roleForAccountType(accountType);
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`${roleName} role is not seeded`);
    }

    const passwordHash = await this.passwordService.hash(password);

    const { user, tenantContext } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          status: UserStatus.ACTIVE,
          roles: {
            create: {
              roleId: role.id,
            },
          },
        },
      });

      const context = await this.tenancyProvisionService.provisionForRegistration(
        {
          userId: created.id,
          email: normalizedEmail,
          accountType: accountType as RegisterAccountType,
          organizationName,
        },
        tx,
        meta,
      );

      const withRoles = await tx.user.findUnique({
        where: { id: created.id },
        include: this.userInclude(),
      });

      if (!withRoles) {
        throw new Error('Failed to load user after registration');
      }

      return { user: withRoles, tenantContext: context };
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user.id,
      metadata: {
        accountType,
        tenantId: tenantContext.tenant.id,
        tenantType: tenantContext.tenant.type,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'TENANT_CREATED',
      resourceType: 'Tenant',
      resourceId: tenantContext.tenant.id,
      metadata: { type: tenantContext.tenant.type, source: 'registration' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    if (tenantContext.organization) {
      await this.auditService.log({
        actorUserId: user.id,
        action: 'ORGANIZATION_CREATED',
        resourceType: 'Organization',
        resourceId: tenantContext.organization.id,
        metadata: { tenantId: tenantContext.tenant.id, source: 'registration' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }

    await this.auditService.log({
      actorUserId: user.id,
      action: 'MEMBERSHIP_CREATED',
      resourceType: 'Membership',
      resourceId: tenantContext.membership.id,
      metadata: {
        tenantId: tenantContext.tenant.id,
        role: tenantContext.membership.role,
        source: 'registration',
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const roles = this.extractRoles(user);
    const tokens = await this.tokenService.issueTokenPair(
      user,
      roles,
      meta,
      tenantContext.tenant.id,
    );

    return {
      user: this.toAuthUser(user),
      tokens,
      tenantContext,
    };
  }

  async login(
    email: string,
    password: string,
    meta: RequestContextMeta = {},
  ): Promise<AuthSessionResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: this.userInclude(),
    });

    const invalidCredentials = async (): Promise<never> => {
      await this.auditService.log({
        actorUserId: user?.id,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'User',
        resourceId: user?.id,
        metadata: { email: normalizedEmail },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    };

    if (!user) {
      return invalidCredentials();
    }

    const passwordValid = await this.passwordService.verify(password, user.passwordHash);
    if (!passwordValid) {
      return invalidCredentials();
    }

    if (user.status === UserStatus.DISABLED) {
      await this.auditService.log({
        actorUserId: user.id,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'User',
        resourceId: user.id,
        metadata: { reason: 'DISABLED' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = this.extractRoles(user);
    const tokens = await this.tokenService.issueTokenPair(user, roles, meta, user.activeTenantId);
    const tenantContext = await this.tenantContextService.getCurrentForUser(user.id);

    await this.auditService.log({
      actorUserId: user.id,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      user: this.toAuthUser(user),
      tokens,
      tenantContext,
    };
  }

  async refresh(refreshToken: string, meta: RequestContextMeta = {}): Promise<AuthSessionResponse> {
    const { tokens, userId } = await this.tokenService.rotateRefreshToken(refreshToken, meta);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude(),
    });

    if (!user || user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.auditService.log({
      actorUserId: user.id,
      action: 'TOKEN_REFRESHED',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const tenantContext = await this.tenantContextService.getCurrentForUser(user.id);

    return {
      user: this.toAuthUser(user),
      tokens,
      tenantContext,
    };
  }

  async logout(
    userId: string,
    refreshToken: string,
    meta: RequestContextMeta = {},
  ): Promise<MessageResponse> {
    await this.tokenService.revokeRefreshToken(userId, refreshToken);
    await this.auditService.log({
      actorUserId: userId,
      action: 'USER_LOGOUT',
      resourceType: 'User',
      resourceId: userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { message: 'Logged out successfully' };
  }

  async me(userId: string): Promise<AuthIdentityResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude(),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tenantContext = await this.tenantContextService.getCurrentForUser(userId);

    return {
      user: this.toAuthUser(user),
      tenantContext,
    };
  }

  async forgotPassword(
    email: string,
    meta: RequestContextMeta = {},
  ): Promise<ForgotPasswordResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const response: ForgotPasswordResponse = {
      message: 'If an account exists for that email, password reset instructions have been sent.',
    };

    if (!user) {
      return response;
    }

    const rawToken = this.tokenService.generateOpaqueToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.tokenService.hashToken(rawToken),
        expiresAt: this.tokenService.getPasswordResetExpiry(),
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
    if (nodeEnv !== 'production') {
      this.logger.debug(`Password reset token issued for user ${user.id}`);
      response.resetToken = rawToken;
    }

    return response;
  }

  async resetPassword(
    token: string,
    password: string,
    meta: RequestContextMeta = {},
  ): Promise<MessageResponse> {
    const tokenHash = this.tokenService.hashToken(token);
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const passwordHash = await this.passwordService.hash(password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditService.log({
      actorUserId: resetToken.userId,
      action: 'PASSWORD_RESET',
      resourceType: 'User',
      resourceId: resetToken.userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { message: 'Password has been reset successfully' };
  }

  async getPermissionsForUser(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude(),
    });

    if (!user) {
      return [];
    }

    return this.extractPermissions(user);
  }

  private roleForAccountType(accountType: AccountTypeDto): RoleName {
    switch (accountType) {
      case AccountTypeDto.PROVIDER:
        return RoleName.PROVIDER;
      case AccountTypeDto.BUSINESS:
        return RoleName.BUSINESS;
      case AccountTypeDto.CUSTOMER:
      default:
        return RoleName.CUSTOMER;
    }
  }

  private userInclude() {
    return {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    } as const;
  }

  private extractRoles(user: UserWithRoles): RoleName[] {
    return user.roles.map((entry) => entry.role.name);
  }

  private extractPermissions(user: UserWithRoles): string[] {
    const codes = user.roles.flatMap((entry) =>
      entry.role.permissions.map((rp) => rp.permission.code),
    );
    return [...new Set(codes)].sort();
  }

  private toAuthUser(user: UserWithRoles): AuthUser {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      roles: this.extractRoles(user),
      permissions: this.extractPermissions(user),
      activeTenantId: user.activeTenantId,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
