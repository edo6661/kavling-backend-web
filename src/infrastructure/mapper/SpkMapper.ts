import type { Prisma } from "@prisma/client";
import type { SpkEntity } from "../../domain/entities/Spk.js";
import { SpkPembayaranMapper } from "./SpkPembayaranMapper.js";

export const spkInclude = {
  mandor: { select: { id: true, username: true } },
  bankRekeningPt: { select: { id: true, namaBank: true, noRekening: true, atasNama: true } },
  zona: {
    select: { id: true, nama: true, hgb: true, luas: true, deskripsi: true },
  },
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
  pekerjaanInfraItems: {
    orderBy: { urutan: "asc" as const },
    include: {
      pekerjaanInfra: { select: { id: true, nama: true, kategori: true, urutan: true } },
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
      jenis: row.jenis,
      terminScheme: row.terminScheme,
      tanggalSpk: row.tanggalSpk,
      judulPekerjaan: row.judulPekerjaan,
      nilaiKontrak: Number(row.nilaiKontrak),
      bankRekeningPtId: row.bankRekeningPtId ?? null,
      zonaId: row.zonaId ?? null,
      zona: row.zona
        ? {
            id: row.zona.id,
            nama: row.zona.nama,
            hgb: row.zona.hgb,
            luas: row.zona.luas,
            deskripsi: row.zona.deskripsi,
          }
        : null,
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
          luasTanah: Number(item.kavling.luasTanah),
          luasBangunan: Number(item.kavling.luasBangunan),
          customerNama: activePenjualan?.customer?.nama ?? "-",
        };
      }),
      pekerjaanInfraItems: row.pekerjaanInfraItems.map((item) => ({
        id: item.id,
        pekerjaanInfraId: item.pekerjaanInfraId,
        nama: item.pekerjaanInfra.nama,
        kategori: item.pekerjaanInfra.kategori,
        urutan: item.urutan,
      })),
      pembayaranList: row.pembayaranList?.map((p) =>
        SpkPembayaranMapper.toDomain(p),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
