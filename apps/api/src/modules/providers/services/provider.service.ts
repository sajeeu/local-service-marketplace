import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ProviderListResponse,
  ProviderPrivateProfileDto,
  ProviderPublicProfileDto,
} from '@local-service-marketplace/shared-types';
import { MembershipRole, Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  AuthenticatedUser,
  RequestContextMeta,
} from '../../identity/interfaces/auth.interfaces';
import { AuditService } from '../../identity/services/audit.service';
import {
  CreateProviderAvailabilityDto,
  ProviderCertificationInputDto,
  ProviderLanguageInputDto,
  ProviderQualificationInputDto,
  UpdateProviderProfileDto,
} from '../dto/provider.dto';
import { STORAGE_PORT, type StoragePort } from '../interfaces/storage-port';
import {
  toListItemDto,
  toPrivateProfileDto,
  toPublicProfileDto,
  type ProviderWithRelations,
} from '../mappers/provider.mapper';

const PROVIDER_INCLUDE = {
  qualifications: true,
  certifications: true,
  languages: true,
  verifications: {
    orderBy: { submittedAt: 'desc' as const },
  },
} satisfies Prisma.ProviderInclude;

@Injectable()
export class ProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async getOrCreateMe(
    user: AuthenticatedUser,
    meta?: RequestContextMeta,
  ): Promise<ProviderPrivateProfileDto> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessProviderDomain(user);

    const existing = await this.prisma.provider.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      include: PROVIDER_INCLUDE,
    });

    if (existing) {
      return toPrivateProfileDto(existing);
    }

    const displayName = this.defaultDisplayName(user.email);
    const created = await this.prisma.provider.create({
      data: {
        tenantId,
        userId: user.id,
        displayName,
      },
      include: PROVIDER_INCLUDE,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'PROVIDER_CREATED',
      resourceType: 'Provider',
      resourceId: created.id,
      metadata: { tenantId, source: 'ensure_me' },
      ...meta,
    });

    return toPrivateProfileDto(created);
  }

  async updateMe(
    user: AuthenticatedUser,
    dto: UpdateProviderProfileDto,
    meta?: RequestContextMeta,
  ): Promise<ProviderPrivateProfileDto> {
    const provider = await this.getOrCreateMe(user, meta);
    return this.updateById(user, provider.id, dto, meta, { allowSelfOnly: true });
  }

  async listForTenant(
    user: AuthenticatedUser,
    page = 1,
    limit = 20,
  ): Promise<ProviderListResponse> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessProviderDomain(user);

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.provider.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.provider.count({ where: { tenantId } }),
    ]);

    return {
      items: rows.map(toListItemDto),
      meta: { page, limit, total },
    };
  }

  async updateById(
    user: AuthenticatedUser,
    providerId: string,
    dto: UpdateProviderProfileDto,
    meta?: RequestContextMeta,
    options?: { allowSelfOnly?: boolean },
  ): Promise<ProviderPrivateProfileDto> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessProviderDomain(user);

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: PROVIDER_INCLUDE,
    });

    if (!provider || provider.tenantId !== tenantId) {
      throw new NotFoundException('Provider profile not found');
    }

    this.assertCanManageProvider(user, provider, options?.allowSelfOnly === true);

    this.validateProfessionalData(dto);

    const profilePhoto =
      dto.profilePhoto === undefined
        ? undefined
        : dto.profilePhoto
          ? this.storage.resolvePublicUrl(dto.profilePhoto)
          : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.provider.update({
        where: { id: providerId },
        data: {
          ...(dto.displayName !== undefined ? { displayName: dto.displayName.trim() } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio?.trim() || null } : {}),
          ...(profilePhoto !== undefined ? { profilePhoto } : {}),
          ...(dto.yearsOfExperience !== undefined
            ? { yearsOfExperience: dto.yearsOfExperience }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      if (dto.qualifications) {
        await tx.providerQualification.deleteMany({ where: { providerId } });
        if (dto.qualifications.length > 0) {
          await tx.providerQualification.createMany({
            data: dto.qualifications.map((row) => ({
              providerId,
              title: row.title.trim(),
              issuer: row.issuer.trim(),
              issueDate: this.parseDateOnly(row.issueDate),
              expiryDate: row.expiryDate ? this.parseDateOnly(row.expiryDate) : null,
              documentUrl: row.documentUrl ? this.storage.resolvePublicUrl(row.documentUrl) : null,
            })),
          });
        }
      }

      if (dto.certifications) {
        await tx.providerCertification.deleteMany({ where: { providerId } });
        if (dto.certifications.length > 0) {
          await tx.providerCertification.createMany({
            data: dto.certifications.map((row) => ({
              providerId,
              name: row.name.trim(),
              issuer: row.issuer.trim(),
              issueDate: row.issueDate ? this.parseDateOnly(row.issueDate) : null,
              expiryDate: row.expiryDate ? this.parseDateOnly(row.expiryDate) : null,
              credentialId: row.credentialId?.trim() || null,
              documentUrl: row.documentUrl ? this.storage.resolvePublicUrl(row.documentUrl) : null,
            })),
          });
        }
      }

      if (dto.languages) {
        await tx.providerLanguage.deleteMany({ where: { providerId } });
        if (dto.languages.length > 0) {
          await tx.providerLanguage.createMany({
            data: dto.languages.map((row) => ({
              providerId,
              code: row.code.trim().toLowerCase(),
              label: row.label.trim(),
              proficiency: row.proficiency?.trim() || null,
            })),
          });
        }
      }

      return tx.provider.findUniqueOrThrow({
        where: { id: providerId },
        include: PROVIDER_INCLUDE,
      });
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'PROVIDER_UPDATED',
      resourceType: 'Provider',
      resourceId: providerId,
      metadata: {
        tenantId,
        fields: Object.keys(dto),
      },
      ...meta,
    });

    return toPrivateProfileDto(updated);
  }

  async getPublicProfile(providerId: string): Promise<ProviderPublicProfileDto> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: PROVIDER_INCLUDE,
    });

    if (!provider || !provider.isActive) {
      throw new NotFoundException('Provider profile not found');
    }

    return toPublicProfileDto(provider);
  }

  async getOwnedProviderOrThrow(user: AuthenticatedUser): Promise<ProviderWithRelations> {
    const tenantId = this.requireActiveTenantId(user);
    const provider = await this.prisma.provider.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      include: PROVIDER_INCLUDE,
    });

    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return provider;
  }

  validateAvailabilityTimes(startTime: string, endTime: string): void {
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
  }

  assertAvailabilityDto(dto: CreateProviderAvailabilityDto): void {
    this.validateAvailabilityTimes(dto.startTime, dto.endTime);
  }

  private requireActiveTenantId(user: AuthenticatedUser): string {
    const tenantId = user.tenantContext?.tenant.id ?? user.activeTenantId;
    if (!tenantId || !user.tenantContext) {
      throw new ForbiddenException('Active tenant context is required');
    }
    if (user.tenantContext.tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Active tenant is not available');
    }
    return tenantId;
  }

  private assertCanAccessProviderDomain(user: AuthenticatedUser): void {
    const eligible =
      user.roles.includes(RoleName.PROVIDER) ||
      user.roles.includes(RoleName.BUSINESS) ||
      user.roles.includes(RoleName.ADMIN);

    if (!eligible) {
      throw new ForbiddenException('Provider access is required');
    }
  }

  private assertCanManageProvider(
    user: AuthenticatedUser,
    provider: { userId: string; tenantId: string },
    selfOnly: boolean,
  ): void {
    if (user.roles.includes(RoleName.ADMIN)) {
      return;
    }

    if (provider.userId === user.id) {
      return;
    }

    if (selfOnly) {
      throw new ForbiddenException('You can only manage your own provider profile');
    }

    const membershipRole = user.tenantContext?.membership.role;
    const canManageTenant =
      membershipRole === MembershipRole.OWNER || membershipRole === MembershipRole.ADMIN;

    if (!canManageTenant || user.tenantContext?.tenant.id !== provider.tenantId) {
      throw new ForbiddenException('You cannot manage this provider profile');
    }
  }

  private defaultDisplayName(email: string): string {
    const local = email.split('@')[0]?.trim() || 'Provider';
    return local.slice(0, 100);
  }

  private parseDateOnly(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }
    return date;
  }

  private validateProfessionalData(dto: UpdateProviderProfileDto): void {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (dto.qualifications) {
      this.validateQualifications(dto.qualifications, today);
    }
    if (dto.certifications) {
      this.validateCertifications(dto.certifications, today);
    }
    if (dto.languages) {
      this.validateLanguages(dto.languages);
    }
  }

  private validateQualifications(rows: ProviderQualificationInputDto[], today: Date): void {
    for (const row of rows) {
      const issueDate = this.parseDateOnly(row.issueDate);
      if (issueDate > today) {
        throw new BadRequestException('Qualification issueDate cannot be in the future');
      }
      if (row.expiryDate) {
        const expiryDate = this.parseDateOnly(row.expiryDate);
        if (expiryDate < issueDate) {
          throw new BadRequestException('Qualification expiryDate must be on or after issueDate');
        }
      }
    }
  }

  private validateCertifications(rows: ProviderCertificationInputDto[], today: Date): void {
    for (const row of rows) {
      const issueDate = row.issueDate ? this.parseDateOnly(row.issueDate) : null;
      if (issueDate && issueDate > today) {
        throw new BadRequestException('Certification issueDate cannot be in the future');
      }
      if (row.expiryDate) {
        const expiryDate = this.parseDateOnly(row.expiryDate);
        if (issueDate && expiryDate < issueDate) {
          throw new BadRequestException('Certification expiryDate must be on or after issueDate');
        }
      }
    }
  }

  private validateLanguages(rows: ProviderLanguageInputDto[]): void {
    const seen = new Set<string>();
    for (const row of rows) {
      const code = row.code.trim().toLowerCase();
      if (seen.has(code)) {
        throw new BadRequestException(`Duplicate language code: ${code}`);
      }
      seen.add(code);
    }
  }
}
