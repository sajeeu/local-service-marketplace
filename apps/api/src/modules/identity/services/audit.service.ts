import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { RequestContextMeta } from '../interfaces/auth.interfaces';

export interface AuditLogInput extends RequestContextMeta {
  actorUserId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }
}
