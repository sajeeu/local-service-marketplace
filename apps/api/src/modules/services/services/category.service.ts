import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CategoryDto,
  CategoryTreeNodeDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@local-service-marketplace/shared-types';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  AuthenticatedUser,
  RequestContextMeta,
} from '../../identity/interfaces/auth.interfaces';
import { AuditService } from '../../identity/services/audit.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/service.dto';
import { toCategoryDto, toCategoryTree } from '../mappers/service.mapper';
import { slugify } from '../utils/slugify';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listActive(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map(toCategoryDto);
  }

  async getTree(includeInactive = false): Promise<CategoryTreeNodeDto[]> {
    const categories = await this.prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return toCategoryTree(categories);
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateCategoryDto,
    meta?: RequestContextMeta,
  ): Promise<CategoryDto> {
    if (dto.parentId) {
      await this.assertCategoryExists(dto.parentId);
    }

    const slug = await this.allocateUniqueSlug(dto.slug?.trim() || dto.name);

    const created = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        icon: dto.icon?.trim() || null,
        parentId: dto.parentId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'CATEGORY_CREATED',
      resourceType: 'Category',
      resourceId: created.id,
      metadata: { slug: created.slug },
      ...meta,
    });

    return toCategoryDto(created);
  }

  async update(
    user: AuthenticatedUser,
    categoryId: string,
    dto: UpdateCategoryDto,
    meta?: RequestContextMeta,
  ): Promise<CategoryDto> {
    const existing = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === categoryId) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      await this.assertCategoryExists(dto.parentId);
      await this.assertNotDescendant(categoryId, dto.parentId);
    }

    let slug = existing.slug;
    if (dto.slug !== undefined) {
      slug = await this.allocateUniqueSlug(dto.slug, categoryId);
    } else if (dto.name !== undefined && dto.name.trim() !== existing.name) {
      slug = await this.allocateUniqueSlug(dto.name, categoryId);
    }

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        slug,
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon?.trim() || null } : {}),
        ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'CATEGORY_UPDATED',
      resourceType: 'Category',
      resourceId: categoryId,
      metadata: { fields: Object.keys(dto) },
      ...meta,
    });

    return toCategoryDto(updated);
  }

  async remove(
    user: AuthenticatedUser,
    categoryId: string,
    meta?: RequestContextMeta,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        children: { select: { id: true }, take: 1 },
        services: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing.children.length > 0) {
      throw new BadRequestException('Cannot delete a category that has child categories');
    }

    if (existing.services.length > 0) {
      throw new BadRequestException('Cannot delete a category that has services');
    }

    await this.prisma.category.delete({ where: { id: categoryId } });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'CATEGORY_DELETED',
      resourceType: 'Category',
      resourceId: categoryId,
      metadata: { slug: existing.slug },
      ...meta,
    });

    return { message: 'Category deleted' };
  }

  async assertActiveCategory(categoryId: string): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || !category.isActive) {
      throw new BadRequestException('Category is invalid or inactive');
    }
    return toCategoryDto(category);
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new BadRequestException('Parent category not found');
    }
  }

  private async assertNotDescendant(ancestorId: string, candidateParentId: string): Promise<void> {
    let currentId: string | null = candidateParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === ancestorId) {
        throw new BadRequestException('Cannot move a category under its own descendant');
      }
      if (visited.has(currentId)) {
        throw new BadRequestException('Category hierarchy cycle detected');
      }
      visited.add(currentId);

      const parent: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = parent?.parentId ?? null;
    }
  }

  private async allocateUniqueSlug(input: string, excludeId?: string): Promise<string> {
    const base = slugify(input);
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const existing = await this.prisma.category.findUnique({ where: { slug: candidate } });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
    }
    throw new ConflictException('Unable to allocate a unique category slug');
  }
}

export type { CreateCategoryRequest, UpdateCategoryRequest };
