import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { ProviderPrivateProfileDto } from '@local-service-marketplace/shared-types';
import { ProviderVerificationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  AuthenticatedUser,
  RequestContextMeta,
} from '../../identity/interfaces/auth.interfaces';
import { AuditService } from '../../identity/services/audit.service';
import { SEARCH_EVENTS } from '../../search/constants';
import { ReviewProviderVerificationDto, SubmitProviderVerificationDto } from '../dto/provider.dto';
import { STORAGE_PORT, type StoragePort } from '../interfaces/storage-port';
import { toPrivateProfileDto, type ProviderWithRelations } from '../mappers/provider.mapper';
import { ProviderService } from './provider.service';

const PROVIDER_INCLUDE = {
  qualifications: true,
  certifications: true,
  languages: true,
  verifications: {
    orderBy: { submittedAt: 'desc' as const },
  },
} satisfies Prisma.ProviderInclude;

@Injectable()
export class ProviderVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerService: ProviderService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async submitMine(
    user: AuthenticatedUser,
    dto: SubmitProviderVerificationDto,
    meta?: RequestContextMeta,
  ): Promise<ProviderPrivateProfileDto> {
    const profile = await this.providerService.getOrCreateMe(user, meta);

    if (
      profile.verificationStatus === ProviderVerificationStatus.UNDER_REVIEW ||
      profile.verificationStatus === ProviderVerificationStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Verification cannot be submitted while under review or already verified',
      );
    }

    const documentMetadata = dto.documents.map((doc) => ({
      filename: doc.filename.trim(),
      mimeType: doc.mimeType.trim(),
      sizeBytes: doc.sizeBytes,
      url: doc.url ? this.storage.resolvePublicUrl(doc.url) : undefined,
    }));

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.providerVerification.create({
        data: {
          providerId: profile.id,
          status: ProviderVerificationStatus.UNDER_REVIEW,
          documentMetadata,
        },
      });

      return tx.provider.update({
        where: { id: profile.id },
        data: { verificationStatus: ProviderVerificationStatus.UNDER_REVIEW },
        include: PROVIDER_INCLUDE,
      });
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'PROVIDER_VERIFICATION_SUBMITTED',
      resourceType: 'Provider',
      resourceId: profile.id,
      metadata: { documentCount: documentMetadata.length },
      ...meta,
    });

    return toPrivateProfileDto(updated);
  }

  async review(
    admin: AuthenticatedUser,
    providerId: string,
    dto: ReviewProviderVerificationDto,
    meta?: RequestContextMeta,
  ): Promise<ProviderPrivateProfileDto> {
    if (dto.action === 'REJECT' && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('rejectionReason is required when rejecting verification');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: PROVIDER_INCLUDE,
    });

    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    const nextStatus = this.mapActionToStatus(dto.action);
    const latestOpen = provider.verifications.find(
      (row) =>
        row.status === ProviderVerificationStatus.UNDER_REVIEW ||
        row.status === ProviderVerificationStatus.PENDING,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      if (latestOpen) {
        await tx.providerVerification.update({
          where: { id: latestOpen.id },
          data: {
            status: nextStatus,
            reviewedAt: new Date(),
            reviewedByUserId: admin.id,
            rejectionReason: dto.action === 'REJECT' ? dto.rejectionReason!.trim() : null,
          },
        });
      } else {
        await tx.providerVerification.create({
          data: {
            providerId,
            status: nextStatus,
            submittedAt: new Date(),
            reviewedAt: new Date(),
            reviewedByUserId: admin.id,
            rejectionReason: dto.action === 'REJECT' ? dto.rejectionReason!.trim() : null,
          },
        });
      }

      return tx.provider.update({
        where: { id: providerId },
        data: {
          verificationStatus: nextStatus,
          isActive: nextStatus !== ProviderVerificationStatus.SUSPENDED,
        },
        include: PROVIDER_INCLUDE,
      });
    });

    await this.auditService.log({
      actorUserId: admin.id,
      action: 'PROVIDER_VERIFICATION_REVIEWED',
      resourceType: 'Provider',
      resourceId: providerId,
      metadata: {
        action: dto.action,
        status: nextStatus,
        verificationId: latestOpen?.id ?? null,
      },
      ...meta,
    });

    this.eventEmitter.emit(SEARCH_EVENTS.PROVIDER_UPSERT, { providerId });
    return toPrivateProfileDto(updated as ProviderWithRelations);
  }

  private mapActionToStatus(
    action: ReviewProviderVerificationDto['action'],
  ): ProviderVerificationStatus {
    switch (action) {
      case 'APPROVE':
        return ProviderVerificationStatus.VERIFIED;
      case 'REJECT':
        return ProviderVerificationStatus.REJECTED;
      case 'SUSPEND':
        return ProviderVerificationStatus.SUSPENDED;
      default:
        throw new BadRequestException('Unsupported verification review action');
    }
  }
}
