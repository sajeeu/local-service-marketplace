import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const guard = new TenantGuard(reflector as unknown as Reflector);

  function createContext(user: unknown): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows routes that do not require a tenant', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('rejects when tenant context is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(() => guard.canActivate(createContext({ id: 'u1' }))).toThrow(ForbiddenException);
  });

  it('allows when active tenant and membership are present', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(
      guard.canActivate(
        createContext({
          tenantContext: {
            tenant: { status: 'ACTIVE' },
            membership: { status: 'ACTIVE' },
          },
        }),
      ),
    ).toBe(true);
  });
});
