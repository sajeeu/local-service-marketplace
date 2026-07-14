import { Injectable } from '@nestjs/common';
import { MembershipRole, MembershipStatus, type Membership, type Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async createOwnerMembership(
    userId: string,
    tenantId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Membership> {
    const client = tx ?? this.prisma;
    return client.membership.create({
      data: {
        userId,
        tenantId,
        role: MembershipRole.OWNER,
        status: MembershipStatus.ACTIVE,
      },
    });
  }

  async findActiveMembership(userId: string, tenantId: string): Promise<Membership | null> {
    return this.prisma.membership.findFirst({
      where: {
        userId,
        tenantId,
        status: MembershipStatus.ACTIVE,
      },
    });
  }
}
