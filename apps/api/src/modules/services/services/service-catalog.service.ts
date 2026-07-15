import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  MessageResponse,
  ServiceDto,
  ServiceFaqDto,
  ServiceListResponse,
  ServiceLocationDto,
  ServiceMediaDto,
  ServiceRequirementDto,
  ServiceTagDto,
} from '@local-service-marketplace/shared-types';
import {
  MembershipRole,
  PricingModel,
  Prisma,
  ProviderVerificationStatus,
  RoleName,
  ServiceStatus,
} from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { STORAGE_PORT, type StoragePort } from '../../../infrastructure/storage/storage.port';
import type {
  AuthenticatedUser,
  RequestContextMeta,
} from '../../identity/interfaces/auth.interfaces';
import { AuditService } from '../../identity/services/audit.service';
import { SEARCH_EVENTS } from '../../search/constants';
import {
  CreateServiceDto,
  CreateServiceFaqDto,
  CreateServiceLocationDto,
  CreateServiceMediaDto,
  CreateServiceRequirementDto,
  CreateServiceTagDto,
  ServiceFaqInputDto,
  ServiceLocationInputDto,
  ServiceMediaInputDto,
  ServiceRequirementInputDto,
  UpdateServiceDto,
  UpdateServiceFaqDto,
  UpdateServiceLocationDto,
  UpdateServiceMediaDto,
  UpdateServiceRequirementDto,
} from '../dto/service.dto';
import {
  SERVICE_INCLUDE,
  toFaqDto,
  toLocationDto,
  toMediaDto,
  toRequirementDto,
  toServiceDto,
  toServiceListItemDto,
  toTagDto,
  type ServiceWithRelations,
} from '../mappers/service.mapper';
import { slugify } from '../utils/slugify';
import { CategoryService } from './category.service';

@Injectable()
export class ServiceCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly categoryService: CategoryService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  private emitServiceUpsert(serviceId: string): void {
    this.eventEmitter.emit(SEARCH_EVENTS.SERVICE_UPSERT, { serviceId });
  }

  private emitServiceRemove(serviceId: string): void {
    this.eventEmitter.emit(SEARCH_EVENTS.SERVICE_REMOVE, { serviceId });
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateServiceDto,
    meta?: RequestContextMeta,
  ): Promise<ServiceDto> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);
    this.validatePricing(dto.pricingModel, dto.basePrice);
    this.validateNestedCollections(dto);

    const provider = await this.resolveWritableProvider(user, tenantId);
    await this.categoryService.assertActiveCategory(dto.categoryId);

    const slug = await this.allocateServiceSlug(provider.id, dto.title);

    const created = await this.prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          providerId: provider.id,
          categoryId: dto.categoryId,
          title: dto.title.trim(),
          slug,
          shortDescription: dto.shortDescription?.trim() || null,
          description: dto.description?.trim() || null,
          pricingModel: dto.pricingModel,
          basePrice:
            dto.basePrice === undefined || dto.basePrice === null
              ? null
              : new Prisma.Decimal(dto.basePrice),
          currency: (dto.currency ?? 'USD').toUpperCase(),
          duration: dto.duration ?? null,
          cancellationPolicy: dto.cancellationPolicy?.trim() || null,
          instantBookingEnabled: dto.instantBookingEnabled ?? false,
          featured: dto.featured ?? false,
          status: ServiceStatus.DRAFT,
        },
      });

      await this.replaceChildren(tx, service.id, dto);
      return tx.service.findUniqueOrThrow({
        where: { id: service.id },
        include: SERVICE_INCLUDE,
      });
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'SERVICE_CREATED',
      resourceType: 'Service',
      resourceId: created.id,
      metadata: { tenantId, providerId: provider.id, status: created.status },
      ...meta,
    });

    return toServiceDto(created);
  }

  async listMine(user: AuthenticatedUser, page = 1, limit = 20): Promise<ServiceListResponse> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);

    const where = await this.buildAccessibleServicesWhere(user, tenantId);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      items: rows.map(toServiceListItemDto),
      meta: { page, limit, total },
    };
  }

  async getById(user: AuthenticatedUser, serviceId: string): Promise<ServiceDto> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);
    const service = await this.getAccessibleServiceOrThrow(user, tenantId, serviceId);
    return toServiceDto(service);
  }

  async update(
    user: AuthenticatedUser,
    serviceId: string,
    dto: UpdateServiceDto,
    meta?: RequestContextMeta,
  ): Promise<ServiceDto> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);
    const existing = await this.getAccessibleServiceOrThrow(user, tenantId, serviceId, true);

    if (existing.status === ServiceStatus.ARCHIVED) {
      throw new BadRequestException('Archived services cannot be edited');
    }

    const pricingModel = dto.pricingModel ?? existing.pricingModel;
    const basePrice =
      dto.basePrice !== undefined ? dto.basePrice : decimalToNumber(existing.basePrice);
    this.validatePricing(pricingModel, basePrice);
    this.validateNestedCollections(dto);

    if (dto.categoryId) {
      await this.categoryService.assertActiveCategory(dto.categoryId);
    }

    const shouldRegenerateSlug =
      dto.title !== undefined &&
      dto.title.trim() !== existing.title &&
      (existing.status === ServiceStatus.DRAFT || existing.status === ServiceStatus.PAUSED);

    const slug = shouldRegenerateSlug
      ? await this.allocateServiceSlug(existing.providerId, dto.title!, serviceId)
      : existing.slug;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.service.update({
        where: { id: serviceId },
        data: {
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.title !== undefined ? { title: dto.title.trim(), slug } : {}),
          ...(dto.shortDescription !== undefined
            ? { shortDescription: dto.shortDescription?.trim() || null }
            : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.pricingModel !== undefined ? { pricingModel: dto.pricingModel } : {}),
          ...(dto.basePrice !== undefined
            ? {
                basePrice: dto.basePrice === null ? null : new Prisma.Decimal(dto.basePrice),
              }
            : {}),
          ...(dto.currency !== undefined ? { currency: dto.currency.toUpperCase() } : {}),
          ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
          ...(dto.cancellationPolicy !== undefined
            ? { cancellationPolicy: dto.cancellationPolicy?.trim() || null }
            : {}),
          ...(dto.instantBookingEnabled !== undefined
            ? { instantBookingEnabled: dto.instantBookingEnabled }
            : {}),
          ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
        },
      });

      await this.replaceChildren(tx, serviceId, dto);

      return tx.service.findUniqueOrThrow({
        where: { id: serviceId },
        include: SERVICE_INCLUDE,
      });
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'SERVICE_UPDATED',
      resourceType: 'Service',
      resourceId: serviceId,
      metadata: { tenantId, fields: Object.keys(dto) },
      ...meta,
    });

    this.emitServiceUpsert(serviceId);
    return toServiceDto(updated);
  }

  async remove(
    user: AuthenticatedUser,
    serviceId: string,
    meta?: RequestContextMeta,
  ): Promise<MessageResponse> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);
    const existing = await this.getAccessibleServiceOrThrow(user, tenantId, serviceId, true);

    if (existing.status === ServiceStatus.PUBLISHED) {
      throw new BadRequestException('Publish must be paused or archived before deleting');
    }

    await this.prisma.service.delete({ where: { id: serviceId } });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'SERVICE_DELETED',
      resourceType: 'Service',
      resourceId: serviceId,
      metadata: { tenantId, previousStatus: existing.status },
      ...meta,
    });

    this.emitServiceRemove(serviceId);
    return { message: 'Service deleted' };
  }

  async publish(
    user: AuthenticatedUser,
    serviceId: string,
    meta?: RequestContextMeta,
  ): Promise<ServiceDto> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);
    const existing = await this.getAccessibleServiceOrThrow(user, tenantId, serviceId, true);

    if (existing.status === ServiceStatus.ARCHIVED) {
      throw new BadRequestException('Archived services cannot be published');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: existing.providerId },
    });
    if (!provider || provider.verificationStatus !== ProviderVerificationStatus.VERIFIED) {
      throw new ForbiddenException('Only verified providers may publish services');
    }

    this.assertReadyToPublish(existing);

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        status: ServiceStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? new Date(),
      },
      include: SERVICE_INCLUDE,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'SERVICE_PUBLISHED',
      resourceType: 'Service',
      resourceId: serviceId,
      metadata: { tenantId },
      ...meta,
    });

    this.emitServiceUpsert(serviceId);
    return toServiceDto(updated);
  }

  async pause(
    user: AuthenticatedUser,
    serviceId: string,
    meta?: RequestContextMeta,
  ): Promise<ServiceDto> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);
    const existing = await this.getAccessibleServiceOrThrow(user, tenantId, serviceId, true);

    if (existing.status !== ServiceStatus.PUBLISHED) {
      throw new BadRequestException('Only published services can be paused');
    }

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.PAUSED },
      include: SERVICE_INCLUDE,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'SERVICE_PAUSED',
      resourceType: 'Service',
      resourceId: serviceId,
      metadata: { tenantId },
      ...meta,
    });

    this.emitServiceRemove(serviceId);
    return toServiceDto(updated);
  }

  async archive(
    user: AuthenticatedUser,
    serviceId: string,
    meta?: RequestContextMeta,
  ): Promise<ServiceDto> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);
    await this.getAccessibleServiceOrThrow(user, tenantId, serviceId, true);

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: ServiceStatus.ARCHIVED },
      include: SERVICE_INCLUDE,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'SERVICE_ARCHIVED',
      resourceType: 'Service',
      resourceId: serviceId,
      metadata: { tenantId },
      ...meta,
    });

    this.emitServiceRemove(serviceId);
    return toServiceDto(updated);
  }

  async addMedia(
    user: AuthenticatedUser,
    serviceId: string,
    dto: CreateServiceMediaDto,
  ): Promise<ServiceMediaDto> {
    const service = await this.requireEditableService(user, serviceId);
    const count = await this.prisma.serviceMedia.count({ where: { serviceId } });
    if (count >= 20) {
      throw new BadRequestException('A service may have at most 20 media items');
    }

    const created = await this.prisma.serviceMedia.create({
      data: {
        serviceId: service.id,
        type: dto.type,
        url: this.storage.resolvePublicUrl(dto.url),
        altText: dto.altText?.trim() || null,
        sortOrder: dto.sortOrder ?? count,
      },
    });
    this.emitServiceUpsert(serviceId);
    return toMediaDto(created);
  }

  async updateMedia(
    user: AuthenticatedUser,
    serviceId: string,
    mediaId: string,
    dto: UpdateServiceMediaDto,
  ): Promise<ServiceMediaDto> {
    await this.requireEditableService(user, serviceId);
    const media = await this.prisma.serviceMedia.findFirst({
      where: { id: mediaId, serviceId },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const updated = await this.prisma.serviceMedia.update({
      where: { id: mediaId },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.url !== undefined ? { url: this.storage.resolvePublicUrl(dto.url) } : {}),
        ...(dto.altText !== undefined ? { altText: dto.altText?.trim() || null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    this.emitServiceUpsert(serviceId);
    return toMediaDto(updated);
  }

  async removeMedia(
    user: AuthenticatedUser,
    serviceId: string,
    mediaId: string,
  ): Promise<MessageResponse> {
    await this.requireEditableService(user, serviceId);
    const media = await this.prisma.serviceMedia.findFirst({
      where: { id: mediaId, serviceId },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    await this.prisma.serviceMedia.delete({ where: { id: mediaId } });
    this.emitServiceUpsert(serviceId);
    return { message: 'Media deleted' };
  }

  async addTag(
    user: AuthenticatedUser,
    serviceId: string,
    dto: CreateServiceTagDto,
  ): Promise<ServiceTagDto> {
    await this.requireEditableService(user, serviceId);
    const name = dto.name.trim();
    const slug = slugify(name, 50);
    const count = await this.prisma.serviceTag.count({ where: { serviceId } });
    if (count >= 20) {
      throw new BadRequestException('A service may have at most 20 tags');
    }

    try {
      const created = await this.prisma.serviceTag.create({
        data: { serviceId, name, slug },
      });
      this.emitServiceUpsert(serviceId);
      return toTagDto(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Tag already exists on this service');
      }
      throw error;
    }
  }

  async removeTag(
    user: AuthenticatedUser,
    serviceId: string,
    tagId: string,
  ): Promise<MessageResponse> {
    await this.requireEditableService(user, serviceId);
    const tag = await this.prisma.serviceTag.findFirst({ where: { id: tagId, serviceId } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    await this.prisma.serviceTag.delete({ where: { id: tagId } });
    this.emitServiceUpsert(serviceId);
    return { message: 'Tag deleted' };
  }

  async addFaq(
    user: AuthenticatedUser,
    serviceId: string,
    dto: CreateServiceFaqDto,
  ): Promise<ServiceFaqDto> {
    await this.requireEditableService(user, serviceId);
    const count = await this.prisma.serviceFaq.count({ where: { serviceId } });
    if (count >= 30) {
      throw new BadRequestException('A service may have at most 30 FAQs');
    }
    const created = await this.prisma.serviceFaq.create({
      data: {
        serviceId,
        question: dto.question.trim(),
        answer: dto.answer.trim(),
        sortOrder: dto.sortOrder ?? count,
      },
    });
    return toFaqDto(created);
  }

  async updateFaq(
    user: AuthenticatedUser,
    serviceId: string,
    faqId: string,
    dto: UpdateServiceFaqDto,
  ): Promise<ServiceFaqDto> {
    await this.requireEditableService(user, serviceId);
    const faq = await this.prisma.serviceFaq.findFirst({ where: { id: faqId, serviceId } });
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    const updated = await this.prisma.serviceFaq.update({
      where: { id: faqId },
      data: {
        ...(dto.question !== undefined ? { question: dto.question.trim() } : {}),
        ...(dto.answer !== undefined ? { answer: dto.answer.trim() } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return toFaqDto(updated);
  }

  async removeFaq(
    user: AuthenticatedUser,
    serviceId: string,
    faqId: string,
  ): Promise<MessageResponse> {
    await this.requireEditableService(user, serviceId);
    const faq = await this.prisma.serviceFaq.findFirst({ where: { id: faqId, serviceId } });
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    await this.prisma.serviceFaq.delete({ where: { id: faqId } });
    return { message: 'FAQ deleted' };
  }

  async addRequirement(
    user: AuthenticatedUser,
    serviceId: string,
    dto: CreateServiceRequirementDto,
  ): Promise<ServiceRequirementDto> {
    await this.requireEditableService(user, serviceId);
    const count = await this.prisma.serviceRequirement.count({ where: { serviceId } });
    if (count >= 30) {
      throw new BadRequestException('A service may have at most 30 requirements');
    }
    const created = await this.prisma.serviceRequirement.create({
      data: {
        serviceId,
        description: dto.description.trim(),
        isRequired: dto.isRequired ?? true,
        sortOrder: dto.sortOrder ?? count,
      },
    });
    return toRequirementDto(created);
  }

  async updateRequirement(
    user: AuthenticatedUser,
    serviceId: string,
    requirementId: string,
    dto: UpdateServiceRequirementDto,
  ): Promise<ServiceRequirementDto> {
    await this.requireEditableService(user, serviceId);
    const requirement = await this.prisma.serviceRequirement.findFirst({
      where: { id: requirementId, serviceId },
    });
    if (!requirement) {
      throw new NotFoundException('Requirement not found');
    }
    const updated = await this.prisma.serviceRequirement.update({
      where: { id: requirementId },
      data: {
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.isRequired !== undefined ? { isRequired: dto.isRequired } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return toRequirementDto(updated);
  }

  async removeRequirement(
    user: AuthenticatedUser,
    serviceId: string,
    requirementId: string,
  ): Promise<MessageResponse> {
    await this.requireEditableService(user, serviceId);
    const requirement = await this.prisma.serviceRequirement.findFirst({
      where: { id: requirementId, serviceId },
    });
    if (!requirement) {
      throw new NotFoundException('Requirement not found');
    }
    await this.prisma.serviceRequirement.delete({ where: { id: requirementId } });
    return { message: 'Requirement deleted' };
  }

  async addLocation(
    user: AuthenticatedUser,
    serviceId: string,
    dto: CreateServiceLocationDto,
  ): Promise<ServiceLocationDto> {
    await this.requireEditableService(user, serviceId);
    const count = await this.prisma.serviceLocation.count({ where: { serviceId } });
    if (count >= 10) {
      throw new BadRequestException('A service may have at most 10 locations');
    }
    this.validateLocation(dto);
    const created = await this.prisma.serviceLocation.create({
      data: {
        serviceId,
        type: dto.type,
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        country: dto.country?.trim() || null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        serviceRadius: dto.serviceRadius ?? null,
      },
    });
    this.emitServiceUpsert(serviceId);
    return toLocationDto(created);
  }

  async updateLocation(
    user: AuthenticatedUser,
    serviceId: string,
    locationId: string,
    dto: UpdateServiceLocationDto,
  ): Promise<ServiceLocationDto> {
    await this.requireEditableService(user, serviceId);
    const location = await this.prisma.serviceLocation.findFirst({
      where: { id: locationId, serviceId },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    this.validateLocation({
      type: dto.type ?? location.type,
      city: dto.city !== undefined ? dto.city : location.city,
      state: dto.state !== undefined ? dto.state : location.state,
      country: dto.country !== undefined ? dto.country : location.country,
      latitude: dto.latitude !== undefined ? dto.latitude : location.latitude,
      longitude: dto.longitude !== undefined ? dto.longitude : location.longitude,
      serviceRadius: dto.serviceRadius !== undefined ? dto.serviceRadius : location.serviceRadius,
    });

    const updated = await this.prisma.serviceLocation.update({
      where: { id: locationId },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.city !== undefined ? { city: dto.city?.trim() || null } : {}),
        ...(dto.state !== undefined ? { state: dto.state?.trim() || null } : {}),
        ...(dto.country !== undefined ? { country: dto.country?.trim() || null } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.serviceRadius !== undefined ? { serviceRadius: dto.serviceRadius } : {}),
      },
    });
    this.emitServiceUpsert(serviceId);
    return toLocationDto(updated);
  }

  async removeLocation(
    user: AuthenticatedUser,
    serviceId: string,
    locationId: string,
  ): Promise<MessageResponse> {
    await this.requireEditableService(user, serviceId);
    const location = await this.prisma.serviceLocation.findFirst({
      where: { id: locationId, serviceId },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    await this.prisma.serviceLocation.delete({ where: { id: locationId } });
    this.emitServiceUpsert(serviceId);
    return { message: 'Location deleted' };
  }

  private async requireEditableService(
    user: AuthenticatedUser,
    serviceId: string,
  ): Promise<ServiceWithRelations> {
    const tenantId = this.requireActiveTenantId(user);
    this.assertCanAccessServiceDomain(user);
    const service = await this.getAccessibleServiceOrThrow(user, tenantId, serviceId, true);
    if (service.status === ServiceStatus.ARCHIVED) {
      throw new BadRequestException('Archived services cannot be edited');
    }
    return service;
  }

  private async replaceChildren(
    tx: Prisma.TransactionClient,
    serviceId: string,
    dto: {
      tags?: string[];
      locations?: ServiceLocationInputDto[];
      faqs?: ServiceFaqInputDto[];
      requirements?: ServiceRequirementInputDto[];
      media?: ServiceMediaInputDto[];
    },
  ): Promise<void> {
    if (dto.tags) {
      await tx.serviceTag.deleteMany({ where: { serviceId } });
      if (dto.tags.length > 0) {
        const unique = new Map<string, string>();
        for (const raw of dto.tags) {
          const name = raw.trim();
          if (!name) {
            continue;
          }
          unique.set(slugify(name, 50), name);
        }
        if (unique.size > 0) {
          await tx.serviceTag.createMany({
            data: [...unique.entries()].map(([slug, name]) => ({
              serviceId,
              name,
              slug,
            })),
          });
        }
      }
    }

    if (dto.locations) {
      await tx.serviceLocation.deleteMany({ where: { serviceId } });
      if (dto.locations.length > 0) {
        for (const location of dto.locations) {
          this.validateLocation(location);
        }
        await tx.serviceLocation.createMany({
          data: dto.locations.map((location) => ({
            serviceId,
            type: location.type,
            city: location.city?.trim() || null,
            state: location.state?.trim() || null,
            country: location.country?.trim() || null,
            latitude: location.latitude ?? null,
            longitude: location.longitude ?? null,
            serviceRadius: location.serviceRadius ?? null,
          })),
        });
      }
    }

    if (dto.faqs) {
      await tx.serviceFaq.deleteMany({ where: { serviceId } });
      if (dto.faqs.length > 0) {
        await tx.serviceFaq.createMany({
          data: dto.faqs.map((faq, index) => ({
            serviceId,
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            sortOrder: faq.sortOrder ?? index,
          })),
        });
      }
    }

    if (dto.requirements) {
      await tx.serviceRequirement.deleteMany({ where: { serviceId } });
      if (dto.requirements.length > 0) {
        await tx.serviceRequirement.createMany({
          data: dto.requirements.map((requirement, index) => ({
            serviceId,
            description: requirement.description.trim(),
            isRequired: requirement.isRequired ?? true,
            sortOrder: requirement.sortOrder ?? index,
          })),
        });
      }
    }

    if (dto.media) {
      await tx.serviceMedia.deleteMany({ where: { serviceId } });
      if (dto.media.length > 0) {
        await tx.serviceMedia.createMany({
          data: dto.media.map((media, index) => ({
            serviceId,
            type: media.type,
            url: this.storage.resolvePublicUrl(media.url),
            altText: media.altText?.trim() || null,
            sortOrder: media.sortOrder ?? index,
          })),
        });
      }
    }
  }

  private validateNestedCollections(dto: {
    tags?: string[];
    locations?: ServiceLocationInputDto[];
    faqs?: ServiceFaqInputDto[];
    requirements?: ServiceRequirementInputDto[];
    media?: ServiceMediaInputDto[];
  }): void {
    if (dto.media && dto.media.length > 20) {
      throw new BadRequestException('A service may have at most 20 media items');
    }
    if (dto.tags && dto.tags.length > 20) {
      throw new BadRequestException('A service may have at most 20 tags');
    }
    if (dto.locations && dto.locations.length > 10) {
      throw new BadRequestException('A service may have at most 10 locations');
    }
    if (dto.faqs && dto.faqs.length > 30) {
      throw new BadRequestException('A service may have at most 30 FAQs');
    }
    if (dto.requirements && dto.requirements.length > 30) {
      throw new BadRequestException('A service may have at most 30 requirements');
    }
  }

  private validatePricing(pricingModel: PricingModel, basePrice?: number | null): void {
    if (pricingModel === PricingModel.QUOTE_REQUIRED) {
      return;
    }
    if (basePrice === undefined || basePrice === null) {
      throw new BadRequestException('basePrice is required for the selected pricing model');
    }
    if (basePrice < 0) {
      throw new BadRequestException('basePrice must be zero or greater');
    }
  }

  private validateLocation(location: {
    type: string;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    serviceRadius?: number | null;
  }): void {
    if (location.type === 'REMOTE') {
      return;
    }

    const hasCoords =
      location.latitude !== null &&
      location.latitude !== undefined &&
      location.longitude !== null &&
      location.longitude !== undefined;
    const hasPlace = Boolean(location.city?.trim() || location.country?.trim());

    if (!hasCoords && !hasPlace) {
      throw new BadRequestException(
        'Non-remote locations require city/country or latitude/longitude',
      );
    }
  }

  private assertReadyToPublish(service: ServiceWithRelations): void {
    if (!service.title.trim() || service.title.trim().length < 3) {
      throw new BadRequestException('Title is required to publish');
    }
    if (!service.description?.trim() || service.description.trim().length < 20) {
      throw new BadRequestException('A detailed description is required to publish');
    }
    if (!service.categoryId) {
      throw new BadRequestException('Category is required to publish');
    }
    if (service.pricingModel !== PricingModel.QUOTE_REQUIRED) {
      if (service.basePrice === null) {
        throw new BadRequestException('basePrice is required to publish');
      }
    }
    if (!service.duration || service.duration < 1) {
      throw new BadRequestException('Duration is required to publish');
    }
    if (service.locations.length === 0) {
      throw new BadRequestException('At least one location is required to publish');
    }
  }

  private async allocateServiceSlug(
    providerId: string,
    title: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(title);
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const existing = await this.prisma.service.findUnique({
        where: { providerId_slug: { providerId, slug: candidate } },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
    }
    throw new ConflictException('Unable to allocate a unique service slug');
  }

  private async resolveWritableProvider(
    user: AuthenticatedUser,
    tenantId: string,
  ): Promise<{ id: string; userId: string; tenantId: string }> {
    if (user.roles.includes(RoleName.ADMIN)) {
      const provider = await this.prisma.provider.findFirst({
        where: { userId: user.id, tenantId },
      });
      if (provider) {
        return provider;
      }
    }

    const provider = await this.prisma.provider.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
    });

    if (!provider) {
      throw new NotFoundException(
        'Provider profile not found. Complete provider onboarding first.',
      );
    }

    this.assertCanManageProviderServices(user, provider);
    return provider;
  }

  private async buildAccessibleServicesWhere(
    user: AuthenticatedUser,
    tenantId: string,
  ): Promise<Prisma.ServiceWhereInput> {
    if (user.roles.includes(RoleName.ADMIN)) {
      return { provider: { tenantId } };
    }

    const membershipRole = user.tenantContext?.membership.role;
    const canManageTenant =
      membershipRole === MembershipRole.OWNER || membershipRole === MembershipRole.ADMIN;

    if (canManageTenant && user.roles.includes(RoleName.BUSINESS)) {
      return { provider: { tenantId } };
    }

    return { provider: { tenantId, userId: user.id } };
  }

  private async getAccessibleServiceOrThrow(
    user: AuthenticatedUser,
    tenantId: string,
    serviceId: string,
    forManage = false,
  ): Promise<ServiceWithRelations> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        ...SERVICE_INCLUDE,
        provider: true,
      },
    });

    if (!service || service.provider.tenantId !== tenantId) {
      throw new NotFoundException('Service not found');
    }

    if (forManage) {
      this.assertCanManageProviderServices(user, service.provider);
    } else {
      const where = await this.buildAccessibleServicesWhere(user, tenantId);
      const allowed = await this.prisma.service.count({
        where: { AND: [{ id: serviceId }, where] },
      });
      if (!allowed) {
        throw new NotFoundException('Service not found');
      }
    }

    return service;
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

  private assertCanAccessServiceDomain(user: AuthenticatedUser): void {
    const eligible =
      user.roles.includes(RoleName.PROVIDER) ||
      user.roles.includes(RoleName.BUSINESS) ||
      user.roles.includes(RoleName.ADMIN) ||
      user.roles.includes(RoleName.CUSTOMER);

    if (!eligible) {
      throw new ForbiddenException('Service catalog access is required');
    }
  }

  private assertCanManageProviderServices(
    user: AuthenticatedUser,
    provider: { userId: string; tenantId: string },
  ): void {
    if (user.roles.includes(RoleName.ADMIN)) {
      return;
    }

    if (provider.userId === user.id) {
      return;
    }

    const membershipRole = user.tenantContext?.membership.role;
    const canManageTenant =
      membershipRole === MembershipRole.OWNER || membershipRole === MembershipRole.ADMIN;

    if (
      user.roles.includes(RoleName.BUSINESS) &&
      canManageTenant &&
      user.tenantContext?.tenant.id === provider.tenantId
    ) {
      return;
    }

    throw new ForbiddenException('You cannot manage this service');
  }
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }
  return Number(value.toString());
}
