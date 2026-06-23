import { type PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";

export interface UpdateBatalPenjualanDTO {
  agent?: string;
  bookingFeeLunasBatal?: boolean;
}

export class UpdateBatalPenjualanUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(noTransaksi: string, data: UpdateBatalPenjualanDTO) {
    return await this.db.$transaction(async (tx) => {
      const old = await tx.penjualan.findUnique({
        where: { noTransaksi },
        include: { agent: true },
      });

      if (!old) throw new NotFoundError("Data Penjualan tidak ditemukan");
      if (old.status !== "BATAL") {
        throw new ConflictError(
          "Hanya penjualan berstatus BATAL yang dapat diedit di menu ini.",
        );
      }

      const updateData: {
        bookingFeeLunasBatal?: boolean;
        agent?: { connect: { id: number } };
      } = {};

      if (data.bookingFeeLunasBatal !== undefined) {
        updateData.bookingFeeLunasBatal = data.bookingFeeLunasBatal;
      }

      if (data.agent !== undefined && data.agent.trim()) {
        const agentNama = data.agent.trim();
        const currentAgentNama = old.agent?.nama ?? null;

        if (agentNama !== currentAgentNama) {
          let agent = await tx.agent.findFirst({
            where: { nama: agentNama },
          });

          if (!agent) {
            const dummyNik = `MKT-${Date.now().toString().slice(-10)}`;
            agent = await tx.agent.create({
              data: {
                nik: dummyNik,
                nama: agentNama,
                noHp: "-",
                status: "AKTIF",
              },
            });
          }

          if (agent.id !== old.agentId) {
            updateData.agent = { connect: { id: agent.id } };

            const existingFeeAgent = await tx.feeAgent.findUnique({
              where: { penjualanId: old.id },
            });

            if (existingFeeAgent) {
              await tx.feeAgent.update({
                where: { id: existingFeeAgent.id },
                data: { agentId: agent.id },
              });
              await tx.agentPencairan.updateMany({
                where: { penjualanId: old.id },
                data: { agentId: agent.id },
              });
            } else {
              await tx.feeAgent.create({
                data: {
                  agentId: agent.id,
                  penjualanId: old.id,
                },
              });
            }
          }
        }
      }

      if (
        updateData.bookingFeeLunasBatal === undefined &&
        updateData.agent === undefined
      ) {
        throw new ConflictError("Tidak ada perubahan data untuk disimpan.");
      }

      return await tx.penjualan.update({
        where: { id: old.id },
        data: updateData,
        include: {
          agent: true,
          tagihan: { orderBy: { jatuhTempo: "asc" } },
        },
      });
    });
  }
}
