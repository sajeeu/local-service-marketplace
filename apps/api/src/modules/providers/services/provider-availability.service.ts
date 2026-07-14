import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ProviderAvailabilityDto } from '@local-service-marketplace/shared-types';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  AuthenticatedUser,
  RequestContextMeta,
} from '../../identity/interfaces/auth.interfaces';
import { AuditService } from '../../identity/services/audit.service';
import { CreateProviderAvailabilityDto, UpdateProviderAvailabilityDto } from '../dto/provider.dto';
import { toAvailabilityDto } from '../mappers/provider.mapper';
import { ProviderService } from './provider.service';

@Injectable()
export class ProviderAvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerService: ProviderService,
    private readonly auditService: AuditService,
  ) {}

  async listMine(user: AuthenticatedUser): Promise<ProviderAvailabilityDto[]> {
    const provider = await this.providerService.getOrCreateMe(user);
    const rows = await this.prisma.providerAvailability.findMany({
      where: { providerId: provider.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map(toAvailabilityDto);
  }

  async createMine(
    user: AuthenticatedUser,
    dto: CreateProviderAvailabilityDto,
    meta?: RequestContextMeta,
  ): Promise<ProviderAvailabilityDto> {
    this.providerService.assertAvailabilityDto(dto);
    const provider = await this.providerService.getOrCreateMe(user);

    const created = await this.prisma.providerAvailability.create({
      data: {
        providerId: provider.id,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        timezone: dto.timezone.trim(),
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'PROVIDER_AVAILABILITY_CREATED',
      resourceType: 'ProviderAvailability',
      resourceId: created.id,
      metadata: { providerId: provider.id, dayOfWeek: dto.dayOfWeek },
      ...meta,
    });

    return toAvailabilityDto(created);
  }

  async updateMine(
    user: AuthenticatedUser,
    availabilityId: string,
    dto: UpdateProviderAvailabilityDto,
    meta?: RequestContextMeta,
  ): Promise<ProviderAvailabilityDto> {
    const provider = await this.providerService.getOrCreateMe(user);
    const existing = await this.prisma.providerAvailability.findUnique({
      where: { id: availabilityId },
    });

    if (!existing || existing.providerId !== provider.id) {
      throw new NotFoundException('Availability slot not found');
    }

    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;
    this.providerService.validateAvailabilityTimes(startTime, endTime);

    const updated = await this.prisma.providerAvailability.update({
      where: { id: availabilityId },
      data: {
        ...(dto.dayOfWeek !== undefined ? { dayOfWeek: dto.dayOfWeek } : {}),
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone.trim() } : {}),
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'PROVIDER_AVAILABILITY_UPDATED',
      resourceType: 'ProviderAvailability',
      resourceId: updated.id,
      metadata: { providerId: provider.id },
      ...meta,
    });

    return toAvailabilityDto(updated);
  }

  async deleteMine(
    user: AuthenticatedUser,
    availabilityId: string,
    meta?: RequestContextMeta,
  ): Promise<{ message: string }> {
    const provider = await this.providerService.getOrCreateMe(user);
    const existing = await this.prisma.providerAvailability.findUnique({
      where: { id: availabilityId },
    });

    if (!existing || existing.providerId !== provider.id) {
      throw new NotFoundException('Availability slot not found');
    }

    if (existing.providerId !== provider.id) {
      throw new ForbiddenException('You can only delete your own availability');
    }

    await this.prisma.providerAvailability.delete({ where: { id: availabilityId } });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'PROVIDER_AVAILABILITY_DELETED',
      resourceType: 'ProviderAvailability',
      resourceId: availabilityId,
      metadata: { providerId: provider.id },
      ...meta,
    });

    return { message: 'Availability slot deleted' };
  }
}
