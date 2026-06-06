import { Prisma, PrismaClient, Role } from "@prisma/client";

export async function seedRolePermission(prisma: PrismaClient) {
  console.log("Seeding role permissions (Bypass All for testing)...");

  const roles = [
    Role.SUPERADMIN,
    Role.ADMIN,
    Role.FINANCE,
    Role.MARKETING,
    Role.CUSTOMER,
    Role.MANDOR,
    Role.PENGAWAS,
    
  ];

  const resources = [
    "DASHBOARD",
    "PENJUALAN",
    "PROGRESS_PENJUALAN",
    "GANTI_KAVLING",
    "BATAL_TRANSAKSI",
    "USER",
    "ROLE_PERMISSION",
    "KAVLING",
    "NOTARIS",
    "BANK",
    "AUDIT_LOG",
    "CUSTOMER",
    "CUSTOMER_KAVLING",
    "TAGIHAN",
    "AGENT",
    "FEE_AGENT",
    "SPK",
    "PROGRESS_PROYEK",
  ];

  const permissionsToInsert: Prisma.RolePermissionCreateManyInput[] = [];

  for (const role of roles) {
    for (const resource of resources) {
      permissionsToInsert.push({
        role: role,
        resource: resource,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      });
    }
  }

  const mandorPermissions = [
    { resource: "PROGRESS_PROYEK", canCreate: false, canRead: true, canUpdate: true, canDelete: false },
    { resource: "PENJUALAN", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    { resource: "SPK", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  ];

  for (const perm of mandorPermissions) {
    permissionsToInsert.push({
      role: Role.MANDOR,
      ...perm,
    });
  }

  const pengawasPermissions = [
    { resource: "SPK", canCreate: false, canRead: true, canUpdate: true, canDelete: false },
    { resource: "PROGRESS_PROYEK", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  ];

  for (const perm of pengawasPermissions) {
    permissionsToInsert.push({
      role: Role.PENGAWAS,
      ...perm,
    });
  }

  const result = await prisma.rolePermission.createMany({
    data: permissionsToInsert,
    skipDuplicates: true,
  });

  console.log(
    `✅ Sukses menambahkan ${result.count} data role permissions awal!`,
  );
}
