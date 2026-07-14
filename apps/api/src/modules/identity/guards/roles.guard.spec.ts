import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  function createContext(user?: { roles: RoleName[] }) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as never;
  }

  it('allows when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows users with a matching role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key: string) =>
      key === ROLES_KEY ? [RoleName.ADMIN] : undefined,
    );
    expect(guard.canActivate(createContext({ roles: [RoleName.ADMIN, RoleName.CUSTOMER] }))).toBe(
      true,
    );
  });

  it('denies users without a required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key: string) =>
      key === ROLES_KEY ? [RoleName.ADMIN] : undefined,
    );
    expect(() => guard.canActivate(createContext({ roles: [RoleName.CUSTOMER] }))).toThrow(
      ForbiddenException,
    );
  });
});
