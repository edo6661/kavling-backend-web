import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
  const defaultPassword = await bcrypt.hash("password", 10);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@gmail.com",
      password: defaultPassword,
      role: Role.ADMIN,
    },
  });

  const marketing = await prisma.user.create({
    data: {
      username: "marketing_utama",
      email: "marketing@bumantara.com",
      password: defaultPassword,
      role: Role.MARKETING,
    },
  });

  return { admin, marketing };
}
