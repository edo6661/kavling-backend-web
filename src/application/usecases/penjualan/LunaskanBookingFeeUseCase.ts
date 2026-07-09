import { type PrismaClient } from "@prisma/client";
import type { ApproveBuktiTagihanUseCase } from "../tagihan/ApproveBuktiTagihanUseCase.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import { effectiveTagihanTujuan } from "../../../domain/tagihan/tagihanTujuan.js";

function findBookingFeeTagihan(
  tagihanList: Array<{
    id: number;
    noTagihan: string;
    pembayaran: string;
    tujuan: string | null;
    status: string;
  }>,
  noTransaksi: string,
) {
  return tagihanList.find(
    (t) =>
      effectiveTagihanTujuan(t as Parameters<typeof effectiveTagihanTujuan>[0]) ===
        "BOOKING_FEE" || t.noTagihan === `INV-BF-${noTransaksi}`,
  );
}

export class LunaskanBookingFeeUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly approveBuktiTagihanUseCase: ApproveBuktiTagihanUseCase,
  ) {}

  async execute(noTransaksi: string) {
    const penjualan = await this.db.penjualan.findUnique({
      where: { noTransaksi },
      include: { tagihan: true },
    });

    if (!penjualan) {
      throw new NotFoundError("Data Penjualan tidak ditemukan");
    }

    if (penjualan.status === "BATAL") {
      throw new ConflictError(
        "Penjualan batal tidak dapat dilunaskan di sini. Gunakan menu Batal Transaksi.",
      );
    }

    const bookingFee = Number(penjualan.bookingFee ?? 0);
    let bookingTagihan = findBookingFeeTagihan(
      penjualan.tagihan,
      noTransaksi,
    );

    if (bookingTagihan?.status === "LUNAS") {
      return {
        alreadyLunas: true,
        tagihanId: bookingTagihan.id,
        penjualanId: penjualan.id,
      };
    }

    if (!bookingTagihan) {
      if (bookingFee <= 0) {
        throw new ConflictError(
          "Penjualan ini tidak memiliki tagihan booking fee.",
        );
      }

      const existingByNo = await this.db.tagihan.findUnique({
        where: { noTagihan: `INV-BF-${noTransaksi}` },
      });
      if (existingByNo) {
        bookingTagihan = existingByNo;
      } else {
        bookingTagihan = await this.db.tagihan.create({
          data: {
            noTagihan: `INV-BF-${noTransaksi}`,
            customerId: penjualan.customerId,
            penjualanId: penjualan.id,
            pembayaran: "Booking Fee",
            tujuan: "BOOKING_FEE",
            nominal: bookingFee,
            jatuhTempo: penjualan.tanggal,
            status: "BELUM_BAYAR",
          },
        });
      }
    }

    if (bookingTagihan.status === "LUNAS") {
      return {
        alreadyLunas: true,
        tagihanId: bookingTagihan.id,
        penjualanId: penjualan.id,
      };
    }

    const approved = await this.approveBuktiTagihanUseCase.execute(
      bookingTagihan.id,
      true,
    );

    return {
      alreadyLunas: false,
      tagihanId: bookingTagihan.id,
      penjualanId: penjualan.id,
      tagihan: approved,
    };
  }
}
