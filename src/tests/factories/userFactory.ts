import { PrismaClient, Role } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const UserFactory = {
  async create(
    overrides: Partial<Parameters<typeof prisma.user.create>[0]["data"]> = {},
  ) {
    const defaultPassword = await bcrypt.hash("password123", 10);
    return await prisma.user.create({
      data: {
        username: faker.internet.displayName(),
        email: faker.internet.email(),
        password: defaultPassword,
        role: Role.CUSTOMER,
        ...overrides,
      },
    });
  },
};
