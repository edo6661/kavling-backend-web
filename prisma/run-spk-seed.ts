import { PrismaClient } from "@prisma/client";
import { seedSpk } from "./seeds/spkSeed";

const prisma = new PrismaClient();

seedSpk(prisma)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
