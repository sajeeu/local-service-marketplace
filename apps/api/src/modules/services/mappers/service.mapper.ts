import type {
  CategoryDto,
  CategoryTreeNodeDto,
  ServiceDto,
  ServiceFaqDto,
  ServiceListItemDto,
  ServiceLocationDto,
  ServiceMediaDto,
  ServiceRequirementDto,
  ServiceTagDto,
} from '@local-service-marketplace/shared-types';
import type {
  Category,
  Prisma,
  Service,
  ServiceFaq,
  ServiceLocation,
  ServiceMedia,
  ServiceRequirement,
  ServiceTag,
} from '@prisma/client';

export type ServiceWithRelations = Service & {
  category?: Category;
  media: ServiceMedia[];
  tags: ServiceTag[];
  locations: ServiceLocation[];
  faqs: ServiceFaq[];
  requirements: ServiceRequirement[];
};

export const SERVICE_INCLUDE = {
  category: true,
  media: { orderBy: { sortOrder: 'asc' as const } },
  tags: { orderBy: { name: 'asc' as const } },
  locations: true,
  faqs: { orderBy: { sortOrder: 'asc' as const } },
  requirements: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ServiceInclude;

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }
  return Number(value.toString());
}

export function toCategoryDto(category: Category): CategoryDto {
  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toCategoryTree(
  categories: Category[],
  parentId: string | null = null,
): CategoryTreeNodeDto[] {
  return categories
    .filter((category) => category.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((category) => ({
      ...toCategoryDto(category),
      children: toCategoryTree(categories, category.id),
    }));
}

export function toMediaDto(media: ServiceMedia): ServiceMediaDto {
  return {
    id: media.id,
    type: media.type,
    url: media.url,
    altText: media.altText,
    sortOrder: media.sortOrder,
  };
}

export function toTagDto(tag: ServiceTag): ServiceTagDto {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

export function toLocationDto(location: ServiceLocation): ServiceLocationDto {
  return {
    id: location.id,
    type: location.type,
    city: location.city,
    state: location.state,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    serviceRadius: location.serviceRadius,
  };
}

export function toFaqDto(faq: ServiceFaq): ServiceFaqDto {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    sortOrder: faq.sortOrder,
  };
}

export function toRequirementDto(requirement: ServiceRequirement): ServiceRequirementDto {
  return {
    id: requirement.id,
    description: requirement.description,
    isRequired: requirement.isRequired,
    sortOrder: requirement.sortOrder,
  };
}

export function toServiceDto(service: ServiceWithRelations): ServiceDto {
  return {
    id: service.id,
    providerId: service.providerId,
    categoryId: service.categoryId,
    title: service.title,
    slug: service.slug,
    shortDescription: service.shortDescription,
    description: service.description,
    status: service.status,
    pricingModel: service.pricingModel,
    basePrice: decimalToNumber(service.basePrice),
    currency: service.currency,
    duration: service.duration,
    cancellationPolicy: service.cancellationPolicy,
    instantBookingEnabled: service.instantBookingEnabled,
    featured: service.featured,
    publishedAt: service.publishedAt?.toISOString() ?? null,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
    category: service.category ? toCategoryDto(service.category) : undefined,
    media: service.media.map(toMediaDto),
    tags: service.tags.map(toTagDto),
    locations: service.locations.map(toLocationDto),
    faqs: service.faqs.map(toFaqDto),
    requirements: service.requirements.map(toRequirementDto),
  };
}

export function toServiceListItemDto(
  service: Service & { category?: Category | null },
): ServiceListItemDto {
  return {
    id: service.id,
    providerId: service.providerId,
    categoryId: service.categoryId,
    title: service.title,
    slug: service.slug,
    shortDescription: service.shortDescription,
    status: service.status,
    pricingModel: service.pricingModel,
    basePrice: decimalToNumber(service.basePrice),
    currency: service.currency,
    duration: service.duration,
    featured: service.featured,
    updatedAt: service.updatedAt.toISOString(),
    categoryName: service.category?.name ?? null,
  };
}
