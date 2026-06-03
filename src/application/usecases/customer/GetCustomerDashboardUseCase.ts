import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { normalizeTagihanFileBuktiList } from "../../../utils/tagihanBukti.js";

export class GetCustomerDashboardUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(userId: number) {
    const customer = await this.db.customer.findFirst({
      where: { userId },
      include: {
        penjualan: {
          include: {
            kavling: {
              include: { perumahan: true },
            },
            tagihan: {
              orderBy: { jatuhTempo: "asc" },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        "Data profil Customer tidak ditemukan",
      );
    }

    return {
      profil: {
        id: customer.id,
        nama: customer.nama,
        nikKtp: customer.nikKtp,
        noHp: customer.noHp,
        email: customer.email,
        pekerjaan: customer.pekerjaan,
        alamatKtp: customer.alamatKtp,
        fileKtp: customer.fileKtp,
        fileKk: customer.fileKk,
        fileNpwp: customer.fileNpwp,
        dokumenLainnya: customer.dokumenLainnya,
      },
      // Mengambil semua transaksi pembelian dan cicilan (tagihan) mereka
      transaksi: customer.penjualan.map((p) => ({
        noTransaksi: p.noTransaksi,
        kavling: `Blok ${p.kavling.blok} No ${p.kavling.nomorUnit}`,
        perumahan: p.kavling.perumahan.nama,
        statusPenjualan: p.status,
        hargaJual: p.hargaJual,
        tagihan: p.tagihan.map((t) => {
          const fileBuktiList = normalizeTagihanFileBuktiList(
            t.fileBuktiList,
            t.fileBukti,
          );
          return {
            id: t.id,
            noTagihan: t.noTagihan,
            tujuan: t.tujuan,
            pembayaran: t.pembayaran,
            nominal: t.nominal,
            jatuhTempo: t.jatuhTempo,
            status: t.status,
            fileBukti: fileBuktiList[0] ?? t.fileBukti,
            fileBuktiList,
          };
        }),
      })),
    };
  }
}
