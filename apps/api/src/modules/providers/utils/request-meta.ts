import type { Request } from 'express';
import type { RequestContextMeta } from '../../identity/interfaces/auth.interfaces';

export function getRequestMeta(req: Request): RequestContextMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];

  return {
    ipAddress: forwardedIp?.trim() || req.ip,
    userAgent: req.headers['user-agent'],
  };
}
