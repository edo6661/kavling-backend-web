import type { Prisma } from "@prisma/client";
import type { SpkEntity } from "../../domain/entities/Spk.js";
import { SpkPembayaranMapper } from "./SpkPembayaranMapper.js";

export const spkInclude = {
  mandor: { select: { id: true, username: true } },
  bankRekeningPt: { select: { id: true, namaBank: true, noRekening: true, atasNama: true } },
  pembayaranList: {
    orderBy: { createdAt: "asc" as const },
    include: SpkPembayaranMapper.include,
  },
  penjualanItems: {
    include: {
      kavling: {
        include: {
          penjualan: {
            where: { status: { not: "BATAL" } },
            orderBy: { id: "desc" as const },
            take: 1,
            include: { customer: { select: { nama: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.SpkInclude;

export type SpkWithRelations = Prisma.SpkGetPayload<{
  include: typeof spkInclude;
}>;

export class SpkMapper {
  static readonly include = spkInclude;

  static toDomain(row: SpkWithRelations): SpkEntity {
    return {
      id: row.id,
      noSpk: row.noSpk,
      tanggalSpk: row.tanggalSpk,
      judulPekerjaan: row.judulPekerjaan,
      nilaiKontrak: Number(row.nilaiKontrak),
      kasbonSebelumTermin2: row.kasbonSebelumTermin2 ? Number(row.kasbonSebelumTermin2) : null,
      kasbonSebelumTermin3: row.kasbonSebelumTermin3 ? Number(row.kasbonSebelumTermin3) : null,
      kasbonSebelumTermin4: row.kasbonSebelumTermin4 ? Number(row.kasbonSebelumTermin4) : null,
      bankRekeningPtId: row.bankRekeningPtId ?? null,
      nilaiBisaDitagihkan: row.nilaiBisaDitagihkan ? Number(row.nilaiBisaDitagihkan) : null,
      nilaiSudahDibayarkan: row.nilaiSudahDibayarkan ? Number(row.nilaiSudahDibayarkan) : null,
      sisaNilaiKontrak: row.sisaNilaiKontrak ? Number(row.sisaNilaiKontrak) : null,
      progressOverride: row.progressOverride ? Number(row.progressOverride) : null,
      progress: 0,
      progressIsOverride: false,
      notesPekerjaan: row.notesPekerjaan,
      jatuhTempo: row.jatuhTempo,
      fileSpk: row.fileSpk,
      mandorId: row.mandorId,
      mandor: row.mandor,
      kavlingItems: row.penjualanItems.map((item) => {
        const activePenjualan = item.kavling.penjualan[0];
        return {
          id: item.id,
          kavlingId: item.kavlingId,
          blok: item.kavling.blok,
          nomorUnit: item.kavling.nomorUnit,
          customerNama: activePenjualan?.customer?.nama ?? "-",
        };
      }),
      pembayaranList: row.pembayaranList?.map((p) =>
        SpkPembayaranMapper.toDomain(p),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
