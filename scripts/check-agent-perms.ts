import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const perms = await prisma.rolePermission.findMany({
    where: { role: "AGENT" },
    select: {
      resource: true,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    },
    orderBy: { resource: "asc" },
  });

  console.log("AGENT permissions count:", perms.length);
  console.log(JSON.stringify(perms, null, 2));

  const agents = await prisma.agent.findMany({
    where: { userId: { not: null } },
    select: { id: true, nama: true, userId: true, status: true, email: true },
    take: 5,
  });
  console.log("\nSample agents with portal account:", agents.length);
  console.log(JSON.stringify(agents, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
