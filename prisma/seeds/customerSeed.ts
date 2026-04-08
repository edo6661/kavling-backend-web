import { PrismaClient, Role } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/id_ID";
import bcrypt from "bcrypt";

export async function seedCustomers(prisma: PrismaClient) {
  const defaultPassword = await bcrypt.hash("password123", 10);
  const customers = [];

  for (let i = 0; i < 10; i++) {
    const customerUser = await prisma.user.create({
      data: {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: defaultPassword,
        role: Role.CUSTOMER,
      },
    });

    const customer = await prisma.customer.create({
      data: {
        userId: customerUser.id,
        nikKtp: faker.string.numeric(16),
        nama: faker.person.fullName(),
        noHp: faker.phone.number({ style: "national" }),
        alamatKtp: faker.location.streetAddress(),
        alamatTinggal: faker.location.streetAddress(),
        email: customerUser.email,
        pekerjaan: faker.person.jobTitle(),
        perusahaan: faker.company.name(),
        alamatKorespondensi: faker.location.streetAddress(),
        fileKtp: `ktp-${faker.string.uuid()}.pdf`,
        fileKk: `kk-${faker.string.uuid()}.pdf`,
        fileNpwp: `npwp-${faker.string.uuid()}.pdf`,
      },
    });
    customers.push(customer);
  }
  return customers;
}
