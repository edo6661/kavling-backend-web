import { PrismaClient } from "@prisma/client";
import { seedPekerjaanInfra, seedZona } from "./seeds/spkInfrastrukturSeed";

const prisma = new PrismaClient();

seedPekerjaanInfra(prisma)
  .then(() => seedZona(prisma))
  .finally(() => prisma.$disconnect());
