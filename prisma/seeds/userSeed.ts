import { PrismaClient, Role } from "@prisma/client";

export async function seedUser(prisma: PrismaClient) {
  await prisma.user.createMany({
    data: [
      {
        username: "admin_twinly",
        email: "admin@twinlytech.com",
        password: "hashedpassword123",
        role: Role.ADMIN,
      },
      {
        username: "marketing_01",
        email: "marketing1@sariasih.com",
        password: "hashedpassword123",
        role: Role.MARKETING,
      },
      {
        username: "customer_01",
        email: "customer1@gmail.com",
        password: "hashedpassword123",
        role: Role.CUSTOMER,
      },
    ],
  });
}
