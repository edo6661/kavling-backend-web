import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

export async function seedUser(prisma: PrismaClient) {
  const defaultPassword = await bcrypt.hash("password", 10);
  await prisma.user.createMany({
    data: [
      {
        username: "Admin",
        email: "admin@gmail.com",
        password: defaultPassword,
        role: Role.ADMIN,
      },
      {
        username: "Arga",
        email: "arga@gmail.com",
        password: "arga123",
        role: Role.ADMIN,
      },
      {
        username: "Wiwi",
        email: "wiwi@gmail.com",
        password: "wiwi123",
        role: Role.MARKETING,
      },
      {
        username: "Eva",
        email: "eva@gmail.com",
        password: "eva123",
        role: Role.MARKETING,
      },
    ],
  });
}
