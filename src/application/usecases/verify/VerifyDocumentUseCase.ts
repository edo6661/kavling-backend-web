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

    if (
      documentNumber.startsWith("INV-") ||
      documentNumber.startsWith("KWT-")
    ) {
      return await this.handleTagihan(documentNumber);
    }

    if (documentNumber.startsWith("TRX-")) {
      const penjualan = await this.db.penjualan.findUnique({
        where: { noTransaksi: documentNumber },
        include: {
          customer: { select: { nama: true, noHp: true, alamatKtp: true } },
          kavling: {
            include: {
              perumahan: { select: { nama: true, logo: true } },
              rekeningTujuan: true,
            },
          },
        },
      });

      if (!penjualan) throw new NotFoundError("Dokumen SPR tidak ditemukan");

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
            logoPerumahan: penjualan.kavling.perumahan.logo,
            blokUnit: `Blok ${penjualan.kavling.blok}-${penjualan.kavling.nomorUnit}`,
            tipe: penjualan.kavling.namaTipe,
            rekeningTujuan: penjualan.kavling.rekeningTujuan,
          },
        },
      };
    }

    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Format nomor dokumen tidak dikenali",
    );
  }

  private async handleTagihan(requestedNumber: string) {
    // 2. Deteksi apakah user meminta Kwitansi atau Invoice dari URL-nya
    const isRequestingKwitansi = requestedNumber.startsWith("KWT-");

    // 3. Konversi KWT- kembali menjadi INV- karena di database disimpannya sebagai INV-
    const searchNoTagihan = requestedNumber.replace(/^KWT-/, "INV-");

    const tagihan = await this.db.tagihan.findUnique({
      where: { noTagihan: searchNoTagihan },
      include: {
        customer: { select: { nama: true, noHp: true, alamatKtp: true } },
        penjualan: {
          include: {
            kavling: {
              include: {
                perumahan: { select: { nama: true, logo: true } },
                rekeningTujuan: {
                  select: { namaBank: true, noRekening: true, atasNama: true },
                },
              },
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

    // 4. Return tipe dokumen dengan tepat agar frontend memproses judul dengan benar
    const documentType = isRequestingKwitansi ? "KWITANSI" : "INVOICE";

    return {
      type: documentType,
      data: {
        noDokumen: requestedNumber, // Kembalikan nomor asli sesuai request (INV/KWT)
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
          logoPerumahan: tagihan.penjualan.kavling.perumahan.logo,
          blok: tagihan.penjualan.kavling.blok,
          nomorUnit: tagihan.penjualan.kavling.nomorUnit,
          tipe: tagihan.penjualan.kavling.namaTipe,
          rekeningTujuan: tagihan.penjualan.kavling.rekeningTujuan,
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
