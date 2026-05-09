import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSprPdfUseCase } from "./GenerateSprPdfUseCase.js";

export class ApproveGantiKavlingUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
    private readonly generateSprPdfUseCase: GenerateSprPdfUseCase,
  ) {}

  async execute(riwayatId: number, approvedById: number, isApproved: boolean) {
    const result = await this.db.$transaction(async (tx) => {
      const riwayat = await tx.riwayatGantiKavling.findUnique({
        where: { id: riwayatId },
        include: {
          penjualan: { include: { kavling: true, detailKavlingPajak: true } },
          kavlingBaru: true,
          kavlingLama: true,
        },
      });

      if (!riwayat)
        throw new NotFoundError("Pengajuan ganti kavling tidak ditemukan");
      if (riwayat.status !== "PENDING")
        throw new ConflictError("Pengajuan ini sudah diproses");

      if (!isApproved) {
        await tx.kavling.update({
          where: { id: riwayat.kavlingBaruId },
          data: { status: "AVAILABLE" },
        });

        return await tx.riwayatGantiKavling.update({
          where: { id: riwayatId },
          data: { status: "REJECTED", approvedById },
          include: { penjualan: true, kavlingLama: true, kavlingBaru: true },
        });
      }

      await tx.kavling.update({
        where: { id: riwayat.kavlingLamaId },
        data: { status: "AVAILABLE" },
      });

      await tx.kavling.update({
        where: { id: riwayat.kavlingBaruId },
        data: { status: riwayat.penjualan.kavling.status },
      });

      const oldPenjualan = riwayat.penjualan;
      const hargaDasarBaru = Number(riwayat.kavlingBaru.hargaDasar);
      const diskon = Number(oldPenjualan.diskonPenjualan ?? 0);
      const bookingFee = Number(oldPenjualan.bookingFee ?? 0);

      const plafonAwal = hargaDasarBaru - diskon - bookingFee;

      let biayaKpr = 0;
      let plafonKredit = 0;
      let nilaiPengajuanKpr = 0;
      let dp = 0;
      let hargaJual = 0;

      if (
        oldPenjualan.caraPembayaran === "CASH_KERAS" ||
        oldPenjualan.caraPembayaran === "CASH_BERTAHAP"
      ) {
        hargaJual = hargaDasarBaru - diskon;
      } else if (oldPenjualan.caraPembayaran === "KPR") {
        biayaKpr = plafonAwal * 0.06;
        plafonKredit = plafonAwal + biayaKpr;

        nilaiPengajuanKpr = plafonKredit;

        const baseHargaJual = plafonKredit / 0.9;
        dp = oldPenjualan.dp ? Number(oldPenjualan.dp) : baseHargaJual * 0.1;
        hargaJual = baseHargaJual + diskon;
      }

      await tx.penjualan.update({
        where: { id: riwayat.penjualanId },
        data: {
          kavlingId: riwayat.kavlingBaruId,
          hargaDasar: hargaDasarBaru,
          plafonAwal: plafonAwal,
          biayaKpr: biayaKpr > 0 ? biayaKpr : null,
          plafonKredit: plafonKredit > 0 ? plafonKredit : null,
          nilaiPengajuanKpr: nilaiPengajuanKpr > 0 ? nilaiPengajuanKpr : null,
          dp: dp > 0 ? dp : null,
          hargaJual: hargaJual,
        },
      });

      if (riwayat.penjualan.detailKavlingPajak) {
        await tx.detailKavlingPajak.update({
          where: { penjualanId: riwayat.penjualanId },
          data: { luasBangunan: riwayat.kavlingBaru.luasBangunan.toString() },
        });
      }

      return await tx.riwayatGantiKavling.update({
        where: { id: riwayatId },
        data: { status: "APPROVED", approvedById },
        include: { penjualan: true, kavlingLama: true, kavlingBaru: true },
      });
    });

    if (isApproved && result.status === "APPROVED" && result.penjualan) {
      try {
        const oldPenjualan = result.penjualan;

        if (oldPenjualan.fileSpr) {
          await this.db.riwayatSpr.create({
            data: {
              penjualanId: oldPenjualan.id,
              fileSpr: oldPenjualan.fileSpr,
              keterangan: `Ganti Kavling: Blok ${result.kavlingLama.blok}-${result.kavlingLama.nomorUnit} -> Blok ${result.kavlingBaru.blok}-${result.kavlingBaru.nomorUnit}`,
            },
          });
        }

        const pdfBuffer = await this.generateSprPdfUseCase.execute(
          oldPenjualan.id,
        );
        const sprUrl = await this.cloudinaryService.uploadFile(
          pdfBuffer,
          "bumantara/spr",
        );

        await this.db.penjualan.update({
          where: { id: oldPenjualan.id },
          data: { fileSpr: sprUrl },
        });
      } catch (error) {
        console.error("Gagal auto-generate SPR setelah Ganti Kavling:", error);
      }
    }

    return result;
  }
}
