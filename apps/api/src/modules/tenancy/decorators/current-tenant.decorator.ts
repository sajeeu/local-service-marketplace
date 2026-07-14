import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { CurrentTenantResponse } from '@local-service-marketplace/shared-types';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentTenantResponse | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    return request.user?.tenantContext ?? null;
  },
);
