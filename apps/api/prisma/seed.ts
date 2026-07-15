import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES: Array<{ name: RoleName; description: string }> = [
  { name: RoleName.CUSTOMER, description: 'Marketplace customer' },
  { name: RoleName.PROVIDER, description: 'Individual service provider' },
  { name: RoleName.BUSINESS, description: 'Business organization account' },
  { name: RoleName.ADMIN, description: 'Platform administrator' },
];

const PERMISSIONS: Array<{ code: string; description: string }> = [
  { code: 'user.read', description: 'Read own user identity' },
  { code: 'user.manage', description: 'Manage user accounts' },
  { code: 'tenant.read', description: 'Read tenant information' },
  { code: 'tenant.switch', description: 'Switch active tenant' },
  { code: 'organization.read', description: 'Read organization information' },
  { code: 'organization.manage', description: 'Manage organization details' },
  { code: 'membership.read', description: 'Read tenant memberships' },
  { code: 'provider.read', description: 'Read provider profiles' },
  { code: 'provider.manage', description: 'Manage provider profiles' },
  { code: 'provider.verification.submit', description: 'Submit provider verification' },
  { code: 'provider.verification.review', description: 'Review provider verification' },
  { code: 'service.read', description: 'Read service catalog listings' },
  { code: 'service.manage', description: 'Manage service catalog listings' },
  { code: 'category.read', description: 'Read service categories' },
  { code: 'category.manage', description: 'Manage service categories' },
  { code: 'search.manage', description: 'Manage search indexes and reindexing' },
];

const CATEGORIES: Array<{
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  children?: Array<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    sortOrder: number;
  }>;
}> = [
  {
    name: 'Home Services',
    slug: 'home-services',
    description: 'Repairs, maintenance, and household help',
    icon: 'home',
    sortOrder: 1,
    children: [
      {
        name: 'Plumbing',
        slug: 'plumbing',
        description: 'Pipes, fixtures, and water systems',
        icon: 'wrench',
        sortOrder: 1,
      },
      {
        name: 'Electrical',
        slug: 'electrical',
        description: 'Wiring, outlets, and electrical repairs',
        icon: 'zap',
        sortOrder: 2,
      },
      {
        name: 'Cleaning',
        slug: 'cleaning',
        description: 'Residential and commercial cleaning',
        icon: 'sparkles',
        sortOrder: 3,
      },
    ],
  },
  {
    name: 'Outdoor',
    slug: 'outdoor',
    description: 'Lawn, garden, and exterior services',
    icon: 'tree',
    sortOrder: 2,
    children: [
      {
        name: 'Landscaping',
        slug: 'landscaping',
        description: 'Lawn care and garden design',
        icon: 'leaf',
        sortOrder: 1,
      },
      {
        name: 'Pest Control',
        slug: 'pest-control',
        description: 'Inspection and treatment services',
        icon: 'bug',
        sortOrder: 2,
      },
    ],
  },
];

async function main(): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    });
  }

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const permissionByCode = Object.fromEntries(permissions.map((p) => [p.code, p]));

  const rolePermissionMap: Record<RoleName, string[]> = {
    [RoleName.CUSTOMER]: [
      'user.read',
      'tenant.read',
      'tenant.switch',
      'membership.read',
      'category.read',
      'service.read',
    ],
    [RoleName.PROVIDER]: [
      'user.read',
      'tenant.read',
      'tenant.switch',
      'membership.read',
      'provider.read',
      'provider.manage',
      'provider.verification.submit',
      'category.read',
      'service.read',
      'service.manage',
    ],
    [RoleName.BUSINESS]: [
      'user.read',
      'tenant.read',
      'tenant.switch',
      'organization.read',
      'organization.manage',
      'membership.read',
      'provider.read',
      'provider.manage',
      'provider.verification.submit',
      'category.read',
      'service.read',
      'service.manage',
    ],
    [RoleName.ADMIN]: [
      'user.read',
      'user.manage',
      'tenant.read',
      'tenant.switch',
      'organization.read',
      'organization.manage',
      'membership.read',
      'provider.read',
      'provider.manage',
      'provider.verification.submit',
      'provider.verification.review',
      'category.read',
      'category.manage',
      'service.read',
      'service.manage',
      'search.manage',
    ],
  };

  for (const role of roles) {
    const codes = rolePermissionMap[role.name] ?? [];
    for (const code of codes) {
      const permission = permissionByCode[code];
      if (!permission) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  for (const category of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
      },
    });

    for (const child of category.children ?? []) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          description: child.description,
          icon: child.icon,
          sortOrder: child.sortOrder,
          parentId: parent.id,
          isActive: true,
        },
        create: {
          name: child.name,
          slug: child.slug,
          description: child.description,
          icon: child.icon,
          sortOrder: child.sortOrder,
          parentId: parent.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
