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
    [RoleName.CUSTOMER]: ['user.read'],
    [RoleName.PROVIDER]: ['user.read'],
    [RoleName.BUSINESS]: ['user.read'],
    [RoleName.ADMIN]: ['user.read', 'user.manage'],
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
