import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../domain/errors/AppError.js";
import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class VerifyDocumentUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(documentNumber: string) {
    if (!documentNumber) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Nomor dokumen tidak valid");
    }

    // 1. JIKA DOKUMEN ADALAH TAGIHAN BIASA (INV-...)
    if (documentNumber.startsWith("INV-")) {
      return await this.handleTagihan(documentNumber);
    }

    // 2. JIKA DOKUMEN BERAWAL TRX- (Bisa SPR murni, atau Invoice Booking Fee/DP)
    if (documentNumber.startsWith("TRX-")) {
      // Cek apakah ini Invoice khusus (Booking Fee / DP) yang menggunakan No Transaksi sebagai referensi
      // Kita cari di tabel tagihan yang noTagihan-nya mengandung No Transaksi ini
      const tagihanKhusus = await this.db.tagihan.findFirst({
        where: {
          noTagihan: { contains: documentNumber },
        },
      });

      // Jika ditemukan tagihan terkait dan ini bukan scan untuk SPR murni
      // (Berdasarkan logic Anda, Invoice Booking Fee punya no: TRX-... / BMT / 2026)
      // Kita asumsikan jika ada tagihan terkait, kita tampilkan mode Invoice
      if (tagihanKhusus) {
        return await this.handleTagihan(tagihanKhusus.noTagihan);
      }

      // Jika tidak ada tagihan terkait, tampilkan sebagai SPR Murni
      const penjualan = await this.db.penjualan.findUnique({
        where: { noTransaksi: documentNumber },
        include: {
          customer: { select: { nama: true, noHp: true, alamatKtp: true } },
          kavling: {
            include: { perumahan: { select: { nama: true } } },
          },
        },
      });

      if (!penjualan) throw new NotFoundError("Dokumen tidak ditemukan");

      return {
        type: "SPR",
        data: {
          noDokumen: penjualan.noTransaksi,
          tanggalTransaksi: penjualan.tanggal,
          status: penjualan.status,
          hargaJual: Number(penjualan.hargaJual),
          dp: Number(penjualan.dp ?? 0),
          bookingFee: Number(penjualan.bookingFee ?? 0),
          caraPembayaran: penjualan.caraPembayaran.replace(/_/g, " "),
          bank: penjualan.bank ?? "",
          customer: {
            nama: penjualan.customer.nama,
            noHp: penjualan.customer.noHp,
            alamat: penjualan.customer.alamatKtp,
          },
          kavling: {
            perumahan: penjualan.kavling.perumahan.nama,
            blokUnit: `Blok ${penjualan.kavling.blok}-${penjualan.kavling.nomorUnit}`,
            tipe: penjualan.kavling.namaTipe,
          },
        },
      };
    }

    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Format nomor dokumen tidak dikenali",
    );
  }

  // Helper function agar kode tidak duplikat
  private async handleTagihan(noTagihan: string) {
    const tagihan = await this.db.tagihan.findUnique({
      where: { noTagihan },
      include: {
        customer: { select: { nama: true, noHp: true, alamatKtp: true } },
        penjualan: {
          include: {
            kavling: {
              include: { perumahan: { select: { nama: true } } },
            },
          },
        },
      },
    });

    if (!tagihan) throw new NotFoundError("Data tagihan tidak ditemukan");

    const totalTerbayarAgg = await this.db.tagihan.aggregate({
      where: { penjualanId: tagihan.penjualanId, status: "LUNAS" },
      _sum: { nominal: true },
    });

    const totalTerbayar = Number(totalTerbayarAgg._sum.nominal ?? 0);
    const hargaJual = Number(tagihan.penjualan.hargaJual);
    const sisaBelumDibayar = Math.max(0, hargaJual - totalTerbayar);
    const documentType = tagihan.status === "LUNAS" ? "KWITANSI" : "INVOICE";

    return {
      type: documentType,
      data: {
        noDokumen: tagihan.noTagihan,
        pembayaran: tagihan.pembayaran,
        nominal: Number(tagihan.nominal),
        jatuhTempo: tagihan.jatuhTempo,
        status: tagihan.status,
        tanggalDibuat: tagihan.createdAt,
        customer: {
          nama: tagihan.customer.nama,
          noHp: tagihan.customer.noHp,
          alamat: tagihan.customer.alamatKtp,
        },
        kavling: {
          perumahan: tagihan.penjualan.kavling.perumahan.nama,
          blok: tagihan.penjualan.kavling.blok,
          nomorUnit: tagihan.penjualan.kavling.nomorUnit,
          tipe: tagihan.penjualan.kavling.namaTipe,
        },
        transaksi: {
          caraPembayaran: tagihan.penjualan.caraPembayaran.replace(/_/g, " "),
          bank: tagihan.penjualan.bank ?? "",
          hargaJual: hargaJual,
          sisaBelumDibayar: sisaBelumDibayar,
        },
      },
    };
  }
}
