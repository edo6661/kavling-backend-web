import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { FakturPajakPpnResponseDTO } from "../dtos/FakturPajakPpnDTO.js";

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
} satisfies Prisma.FakturPajakPpnInclude;

type FakturPajakPpnRow = Prisma.FakturPajakPpnGetPayload<{
  include: typeof includeRelations;
}>;

function toDomain(row: FakturPajakPpnRow): FakturPajakPpnResponseDTO {
  return {
    id: row.id,
    customerId: row.customerId,
    namaCustomer: row.customer.nama,
    penjualanId: row.penjualanId,
    sertifikatUrutan: row.sertifikatUrutan ?? 1,
    perumahan: row.penjualan?.kavling?.perumahan?.nama ?? null,
    blok: row.penjualan?.kavling?.blok ?? null,
    nomorUnit: row.penjualan?.kavling?.nomorUnit ?? null,
    fileFaktur: row.fileFaktur,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class FakturPajakPpnRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: {
    customerId: number;
    penjualanId: number;
    sertifikatUrutan?: number;
    fileFaktur: string;
    uploadedBy?: number | null;
  }): Promise<FakturPajakPpnResponseDTO> {
    const result = await this.db.fakturPajakPpn.create({
      data: {
        customerId: data.customerId,
        penjualanId: data.penjualanId,
        sertifikatUrutan: data.sertifikatUrutan ?? 1,
        fileFaktur: data.fileFaktur,
        uploadedBy: data.uploadedBy ?? null,
      },
      include: includeRelations,
    });
    return toDomain(result);
  }

  async findByPenjualanId(
    penjualanId: number,
    sertifikatUrutan = 1,
  ): Promise<FakturPajakPpnResponseDTO | null> {
    const normalizedPenjualanId = Number(penjualanId);
    const normalizedUrutan = Number(sertifikatUrutan) || 1;
    const result = await this.db.fakturPajakPpn.findFirst({
      where: {
        penjualanId: normalizedPenjualanId,
        sertifikatUrutan: normalizedUrutan,
      },
      include: includeRelations,
    });
    return result ? toDomain(result) : null;
  }

  async findAllByPenjualanId(
    penjualanId: number,
  ): Promise<FakturPajakPpnResponseDTO[]> {
    const results = await this.db.fakturPajakPpn.findMany({
      where: { penjualanId },
      orderBy: { sertifikatUrutan: "asc" },
      include: includeRelations,
    });
    return results.map(toDomain);
  }

  async replaceFile(
    id: number,
    fileFaktur: string,
    uploadedBy?: number | null,
  ): Promise<FakturPajakPpnResponseDTO> {
    const result = await this.db.fakturPajakPpn.update({
      where: { id },
      data: { fileFaktur, uploadedBy: uploadedBy ?? null },
      include: includeRelations,
    });
    return toDomain(result);
  }

  async deleteById(id: number): Promise<void> {
    const normalizedId = Number(id);
    await this.db.fakturPajakPpn.delete({ where: { id: normalizedId } });
  }
}
