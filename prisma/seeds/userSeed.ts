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
        username: "Marketing",
        email: "marketing@gmail.com",
        password: defaultPassword,
        role: Role.MARKETING,
      },
      {
        username: "Customer",
        email: "customer@gmail.com",
        password: defaultPassword,
        role: Role.CUSTOMER,
      },
    ],
  });
}
