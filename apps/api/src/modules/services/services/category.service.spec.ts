import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  const prisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const auditService = { log: jest.fn() };
  const service = new CategoryService(
    prisma as never,
    auditService as never,
    {
      emit: jest.fn(),
    } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds a nested category tree', async () => {
    prisma.category.findMany.mockResolvedValue([
      {
        id: 'root',
        parentId: null,
        name: 'Home Services',
        slug: 'home-services',
        description: null,
        icon: null,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'child',
        parentId: 'root',
        name: 'Plumbing',
        slug: 'plumbing',
        description: null,
        icon: null,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const tree = await service.getTree();
    expect(tree).toHaveLength(1);
    expect(tree[0]?.children).toHaveLength(1);
    expect(tree[0]?.children[0]?.slug).toBe('plumbing');
  });

  it('rejects deleting categories with children', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'root',
      slug: 'home-services',
      children: [{ id: 'child' }],
      services: [],
    });

    await expect(
      service.remove(
        {
          id: 'admin',
          email: 'admin@example.com',
          roles: [],
          permissions: [],
          activeTenantId: null,
          tenantContext: null,
          tenantPermissions: [],
        },
        'root',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when updating a missing category', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(
      service.update(
        {
          id: 'admin',
          email: 'admin@example.com',
          roles: [],
          permissions: [],
          activeTenantId: null,
          tenantContext: null,
          tenantPermissions: [],
        },
        'missing',
        { name: 'Nope' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
