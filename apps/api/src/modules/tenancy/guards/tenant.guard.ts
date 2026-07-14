import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_TENANT_KEY } from '../decorators/require-tenant.decorator';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireTenant = this.reflector.getAllAndOverride<boolean>(REQUIRE_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user?.tenantContext) {
      throw new ForbiddenException('Active tenant context is required');
    }

    if (user.tenantContext.tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Active tenant is not available');
    }

    if (user.tenantContext.membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    return true;
  }
}
