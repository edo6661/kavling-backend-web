import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { SuketPphResponseDTO } from "../dtos/SuketPphDTO.js";

const includeRelations = {
  customer: { select: { nama: true } },
  penjualan: {
    include: {
      kavling: {
        include: {
          perumahan: { select: { nama: true } },
        },
      },
    },
  },
} satisfies Prisma.SuketPphInclude;

type SuketPphRow = Prisma.SuketPphGetPayload<{
  include: typeof includeRelations;
}>;

function toDomain(row: SuketPphRow): SuketPphResponseDTO {
  return {
    id: row.id,
    customerId: row.customerId,
    namaCustomer: row.customer.nama,
    penjualanId: row.penjualanId,
    perumahan: row.penjualan?.kavling?.perumahan?.nama ?? null,
    blok: row.penjualan?.kavling?.blok ?? null,
    nomorUnit: row.penjualan?.kavling?.nomorUnit ?? null,
    fileSuket: row.fileSuket,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class SuketPphRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: {
    customerId: number;
    penjualanId: number;
    fileSuket: string;
    uploadedBy?: number | null;
  }): Promise<SuketPphResponseDTO> {
    const result = await this.db.suketPph.create({
      data: {
        customerId: data.customerId,
        penjualanId: data.penjualanId,
        fileSuket: data.fileSuket,
        uploadedBy: data.uploadedBy ?? null,
      },
      include: includeRelations,
    });
    return toDomain(result);
  }

  async findByPenjualanId(penjualanId: number): Promise<SuketPphResponseDTO | null> {
    const result = await this.db.suketPph.findUnique({
      where: { penjualanId },
      include: includeRelations,
    });
    return result ? toDomain(result) : null;
  }

  async replaceFile(
    id: number,
    fileSuket: string,
    uploadedBy?: number | null,
  ): Promise<SuketPphResponseDTO> {
    const result = await this.db.suketPph.update({
      where: { id },
      data: { fileSuket, uploadedBy: uploadedBy ?? null },
      include: includeRelations,
    });
    return toDomain(result);
  }
}
