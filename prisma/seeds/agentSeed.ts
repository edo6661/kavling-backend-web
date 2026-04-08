import { PrismaClient, AgentStatus } from "@prisma/client";

export async function seedAgent(prisma: PrismaClient) {
  await prisma.agent.create({
    data: {
      nik: "3671001122334455",
      kodeSales: "SLS-001",
      nama: "Agus Pramono",
      alamat: "Jl. Merdeka No. 10, Tangerang",
      noHp: "081234567890",
      email: "agus.agent@example.com",
      status: AgentStatus.AKTIF,
      pics: {
        create: [
          {
            nama: "Budi (PIC Agus)",
            noHp: "081299990000",
            alamat: "Jl. Merdeka 11, Tangerang",
          },
        ],
      },
    },
  });

  await prisma.agent.create({
    data: {
      nik: "3671009988776655",
      kodeSales: "SLS-002",
      nama: "Rina Wijaya",
      alamat: "Jl. Sudirman No. 5, Tangerang",
      noHp: "081987654321",
      email: "rina.agent@example.com",
      status: AgentStatus.NONAKTIF,
      pics: {
        create: [
          {
            nama: "Sari (PIC Rina)",
            noHp: "081900001111",
            alamat: "Jl. Sudirman 6, Tangerang",
          },
        ],
      },
    },
  });
}
