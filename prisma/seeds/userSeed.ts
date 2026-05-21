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
        password: await bcrypt.hash("arga123", 10),
        role: Role.ADMIN,
      },
      {
        username: "Wiwi",
        email: "wiwi@gmail.com",
        password: await bcrypt.hash("wiwi123", 10),
        role: Role.MARKETING,
      },
      {
        username: "Eva",
        email: "eva@gmail.com",
        password: await bcrypt.hash("eva123", 10),
        role: Role.MARKETING,
      },
      {
        username: "Mandor Surya",
        email: "mandor@gmail.com",
        password: await bcrypt.hash("mandor123", 10),
        role: Role.MANDOR,
      },
    ],
  });
}
