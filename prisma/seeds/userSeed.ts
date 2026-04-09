import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUser(prisma: PrismaClient) {
  const defaultPassword = await bcrypt.hash("password", 10);
  await prisma.user.createMany({
    data: [
      {
        username: "admin_twinly",
        email: "admin@gmail.com",
        password: defaultPassword,
        role: Role.ADMIN,
      },
      {
        username: "marketing_01",
        email: "marketing@gmail.com",
        password: defaultPassword,
        role: Role.MARKETING,
      },
      {
        username: "customer_01",
        email: "customer@gmail.com",
        password: defaultPassword,
        role: Role.CUSTOMER,
      },
    ],
  });
}
