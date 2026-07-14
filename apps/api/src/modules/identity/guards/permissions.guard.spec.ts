import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

describe('PermissionsGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new PermissionsGuard(reflector);

  function createContext(user?: { permissions: string[] }) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as never;
  }

  it('allows when no permissions are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows users with all required permissions', () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key: string) =>
      key === PERMISSIONS_KEY ? ['user.read', 'user.manage'] : undefined,
    );
    expect(
      guard.canActivate(
        createContext({ permissions: ['user.read', 'user.manage', 'booking.create'] }),
      ),
    ).toBe(true);
  });

  it('denies users missing a required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key: string) =>
      key === PERMISSIONS_KEY ? ['user.manage'] : undefined,
    );
    expect(() => guard.canActivate(createContext({ permissions: ['user.read'] }))).toThrow(
      ForbiddenException,
    );
  });
});
