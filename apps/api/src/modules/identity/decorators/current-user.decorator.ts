import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../interfaces/auth.interfaces';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    return request.user;
  },
);
