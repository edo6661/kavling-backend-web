import { PrismaClient, Role } from "@prisma/client";

export async function seedRolePermission(prisma: PrismaClient) {
  console.log("Seeding role permissions (Bypass All for testing)...");

  const roles = [
    Role.SUPERADMIN,
    Role.ADMIN,
    Role.FINANCE,
    Role.MARKETING,
    Role.CUSTOMER,
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

  const permissionsToInsert = [];

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

  const result = await prisma.rolePermission.createMany({
    data: permissionsToInsert,
    skipDuplicates: true,
  });

  console.log(
    `✅ Sukses menambahkan ${result.count} data role permissions awal!`,
  );
}
