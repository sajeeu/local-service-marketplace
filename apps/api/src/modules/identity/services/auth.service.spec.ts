import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleName, UserStatus } from '@prisma/client';
import type { AppConfig } from '../../../config/env.validation';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const passwordService = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const tokenService = {
    issueTokenPair: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    generateOpaqueToken: jest.fn(),
    hashToken: jest.fn(),
    getPasswordResetExpiry: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('development'),
  };

  const service = new AuthService(
    prisma as never,
    passwordService as unknown as PasswordService,
    tokenService as unknown as TokenService,
    auditService as unknown as AuditService,
    configService as unknown as ConfigService<AppConfig, true>,
  );

  const userWithRoles = {
    id: 'user-1',
    email: 'customer@example.com',
    passwordHash: 'hashed',
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    roles: [
      {
        role: {
          name: RoleName.CUSTOMER,
          permissions: [{ permission: { code: 'user.read' } }],
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.issueTokenPair.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: '15m',
    });
  });

  it('registers a user with the CUSTOMER role', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.role.findUnique.mockResolvedValue({ id: 'role-customer', name: RoleName.CUSTOMER });
    passwordService.hash.mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue(userWithRoles);

    const result = await service.register('Customer@Example.com', 'SecurePass1!');

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'customer@example.com',
          passwordHash: 'hashed',
          status: UserStatus.ACTIVE,
          roles: { create: { roleId: 'role-customer' } },
        }),
      }),
    );
    expect(result.user.roles).toEqual(['CUSTOMER']);
    expect(result.tokens.accessToken).toBe('access');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_REGISTERED' }),
    );
  });

  it('rejects duplicate registration emails', async () => {
    prisma.user.findUnique.mockResolvedValue(userWithRoles);
    await expect(service.register('customer@example.com', 'SecurePass1!')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('logs in with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(userWithRoles);
    passwordService.verify.mockResolvedValue(true);

    const result = await service.login('customer@example.com', 'SecurePass1!');

    expect(result.user.email).toBe('customer@example.com');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_LOGIN' }),
    );
  });

  it('rejects invalid login credentials safely', async () => {
    prisma.user.findUnique.mockResolvedValue(userWithRoles);
    passwordService.verify.mockResolvedValue(false);

    await expect(service.login('customer@example.com', 'bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_LOGIN_FAILED' }),
    );
  });

  it('refreshes a session via token rotation', async () => {
    tokenService.rotateRefreshToken.mockResolvedValue({
      tokens: { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: '15m' },
      userId: 'user-1',
    });
    prisma.user.findUnique.mockResolvedValue(userWithRoles);

    const result = await service.refresh('old-refresh');

    expect(result.tokens.accessToken).toBe('new-access');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TOKEN_REFRESHED' }),
    );
  });

  it('logs out by revoking the refresh token', async () => {
    tokenService.revokeRefreshToken.mockResolvedValue(undefined);
    const result = await service.logout('user-1', 'refresh-token');
    expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('user-1', 'refresh-token');
    expect(result.message).toMatch(/logged out/i);
  });

  it('issues a reset token for forgot-password in non-production', async () => {
    prisma.user.findUnique.mockResolvedValue(userWithRoles);
    tokenService.generateOpaqueToken.mockReturnValue('raw-reset-token');
    tokenService.hashToken.mockReturnValue('hashed-reset');
    tokenService.getPasswordResetExpiry.mockReturnValue(new Date(Date.now() + 3600_000));
    prisma.passwordResetToken.create.mockResolvedValue({});

    const result = await service.forgotPassword('customer@example.com');

    expect(result.message).toMatch(/if an account exists/i);
    expect(result.resetToken).toBe('raw-reset-token');
  });

  it('rejects invalid reset tokens', async () => {
    tokenService.hashToken.mockReturnValue('hashed');
    prisma.passwordResetToken.findFirst.mockResolvedValue(null);

    await expect(service.resetPassword('bad-token', 'SecurePass1!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
