import { ConflictException, Injectable } from '@nestjs/common';
import { TenantStatus, TenantType, type Prisma, type Tenant } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { slugify } from '../utils/tenancy.mapper';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(
    input: {
      name: string;
      type: TenantType;
      status?: TenantStatus;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Tenant> {
    const client = tx ?? this.prisma;
    const slug = await this.generateUniqueSlug(input.name, client);

    return client.tenant.create({
      data: {
        name: input.name,
        slug,
        type: input.type,
        status: input.status ?? TenantStatus.ACTIVE,
      },
    });
  }

  async findById(tenantId: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id: tenantId } });
  }

  async userOwnsBusinessTenant(userId: string): Promise<boolean> {
    const existing = await this.prisma.membership.findFirst({
      where: {
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
        tenant: {
          type: TenantType.BUSINESS,
        },
      },
    });

    return Boolean(existing);
  }

  private async generateUniqueSlug(
    name: string,
    client: Prisma.TransactionClient | PrismaService,
  ): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let attempt = 0;

    while (attempt < 20) {
      const existing = await client.tenant.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      attempt += 1;
      candidate = `${base}-${attempt + 1}`;
    }

    throw new ConflictException('Unable to allocate a unique tenant slug');
  }
}
