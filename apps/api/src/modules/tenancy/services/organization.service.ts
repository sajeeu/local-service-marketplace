import { Injectable } from '@nestjs/common';
import type { Organization, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface CreateOrganizationInput {
  tenantId: string;
  legalName: string;
  displayName: string;
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  logo?: string | null;
}

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: CreateOrganizationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Organization> {
    const client = tx ?? this.prisma;
    return client.organization.create({
      data: {
        tenantId: input.tenantId,
        legalName: input.legalName.trim(),
        displayName: input.displayName.trim(),
        description: input.description?.trim() || null,
        phone: input.phone?.trim() || null,
        website: input.website?.trim() || null,
        logo: input.logo?.trim() || null,
      },
    });
  }

  async findByTenantId(tenantId: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { tenantId } });
  }
}
