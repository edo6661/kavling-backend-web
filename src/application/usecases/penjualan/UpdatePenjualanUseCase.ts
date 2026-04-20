import type { Prisma } from "@prisma/client";
import { type PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import type { CreatePenjualanDTO } from "../../../domain/dtos/PenjualanDTO.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSprPdfUseCase } from "./GenerateSprPdfUseCase.js";

export class UpdatePenjualanUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
    private readonly generateSprPdfUseCase: GenerateSprPdfUseCase,
  ) {}

  async execute(
    noTransaksi: string,
    data: Partial<CreatePenjualanDTO>,
    userId?: number,
  ) {
    const transactionResult = await this.db.$transaction(async (tx) => {
      const old = await tx.penjualan.findUnique({
        where: { noTransaksi },
        include: {
          customer: true,
          agent: true,
          kavling: { include: { perumahan: true } },
        },
      });

      if (!old) throw new NotFoundError("Data Penjualan tidak ditemukan");

      if (
        data.nama !== undefined ||
        data.noIdentitas !== undefined ||
        data.noTelepon !== undefined ||
        data.alamat !== undefined ||
        data.perusahaan !== undefined ||
        data.alamatKoresponden !== undefined
      ) {
        if (data.noIdentitas && data.noIdentitas !== old.customer.nikKtp) {
          const existingCustomer = await tx.customer.findUnique({
            where: { nikKtp: data.noIdentitas },
          });
          if (existingCustomer && existingCustomer.id !== old.customerId) {
            throw new ConflictError(
              `Gagal update! NIK KTP ${data.noIdentitas} sudah terdaftar untuk customer lain.`,
            );
          }
        }
        const updateCustomerData: Prisma.CustomerUpdateInput = {};
        if (data.nama !== undefined) updateCustomerData.nama = data.nama;
        if (data.noIdentitas !== undefined)
          updateCustomerData.nikKtp = data.noIdentitas;
        if (data.noTelepon !== undefined)
          updateCustomerData.noHp = data.noTelepon;
        if (data.alamat !== undefined)
          updateCustomerData.alamatKtp = data.alamat;
        if (data.perusahaan !== undefined)
          updateCustomerData.perusahaan = data.perusahaan ?? null;
        if (data.alamatKoresponden !== undefined)
          updateCustomerData.alamatKoresponden = data.alamatKoresponden ?? null;

        await tx.customer.update({
          where: { id: old.customerId },
          data: updateCustomerData,
        });
      }

      if (data.agent && old.agentId) {
        await tx.agent.update({
          where: { id: old.agentId },
          data: { nama: data.agent },
        });
      }

      const updateData: Prisma.PenjualanUpdateInput = {};

      let formattedPayment = data.caraPembayaran as string | undefined;
      if (formattedPayment) {
        formattedPayment = formattedPayment.toUpperCase().replace(/\s+/g, "_");
        updateData.caraPembayaran = formattedPayment as any;
      }

      let overrideHargaDasarDariKavlingBaru: number | undefined = undefined;

      if (
        data.blok &&
        data.nomorUnit &&
        (data.blok !== old.kavling.blok ||
          data.nomorUnit !== old.kavling.nomorUnit)
      ) {
        const newKavling = await tx.kavling.findFirst({
          where: {
            perumahanId: old.kavling.perumahanId,
            blok: data.blok,
            nomorUnit: data.nomorUnit,
          },
        });
        if (newKavling && newKavling.id !== old.kavlingId) {
          if (newKavling.status !== "AVAILABLE") {
            throw new ConflictError(
              `Kavling Blok ${data.blok} No ${data.nomorUnit} tidak tersedia (Status: ${newKavling.status})`,
            );
          }

          await tx.kavling.update({
            where: { id: old.kavlingId },
            data: { status: "AVAILABLE" },
          });

          await tx.kavling.update({
            where: { id: newKavling.id },
            data: {
              status: old.kavling.status,
              namaTipe: data.tipe ?? newKavling.namaTipe,
              luasBangunan: data.luasBangunan ?? newKavling.luasBangunan,
              luasTanah: data.luasTanah ?? newKavling.luasTanah,
              hargaDasar: data.hargaDasar ?? newKavling.hargaDasar,
            },
          });
          updateData.kavling = { connect: { id: newKavling.id } };

          overrideHargaDasarDariKavlingBaru =
            data.hargaDasar ?? Number(newKavling.hargaDasar);
        }
      }

      if (data.hargaPromosi !== undefined)
        updateData.hargaPromosi = data.hargaPromosi ?? null;
      if (data.bank !== undefined) updateData.bank = data.bank ?? null;

      const currentCaraPembayaran = formattedPayment ?? old.caraPembayaran;

      const currentHargaDasar =
        overrideHargaDasarDariKavlingBaru ??
        data.hargaDasar ??
        Number(old.hargaDasar);

      const currentDiskon =
        data.diskonPenjualan ?? Number(old.diskonPenjualan ?? 0);
      const currentBookingFee = data.bookingFee ?? Number(old.bookingFee ?? 0);

      const plafonAwal =
        data.plafonAwal ??
        currentHargaDasar - currentDiskon - currentBookingFee;

      let biayaKpr = 0;
      let nilaiPengajuanKpr = 0;
      let dp = 0;
      let hargaJual = 0;

      if (
        currentCaraPembayaran === "CASH_KERAS" ||
        currentCaraPembayaran === "CASH_BERTAHAP"
      ) {
        hargaJual = data.hargaJual ?? plafonAwal;
      } else if (currentCaraPembayaran === "KPR") {
        biayaKpr = data.biayaKpr ?? plafonAwal * 0.06;
        nilaiPengajuanKpr = data.nilaiPengajuanKpr ?? plafonAwal + biayaKpr;

        if (data.dp !== undefined) {
          dp = data.dp ?? 0;
        } else if (old.dp) {
          dp = Number(old.dp);
        } else {
          dp = nilaiPengajuanKpr * 0.1;
        }

        hargaJual = data.hargaJual ?? nilaiPengajuanKpr + dp;
      }

      updateData.hargaDasar = currentHargaDasar;
      updateData.plafonAwal = plafonAwal;
      updateData.biayaKpr = biayaKpr > 0 ? biayaKpr : null;
      updateData.nilaiPengajuanKpr =
        nilaiPengajuanKpr > 0 ? nilaiPengajuanKpr : null;
      updateData.dp = dp > 0 ? dp : null;
      updateData.hargaJual = hargaJual;
      updateData.diskonPenjualan = currentDiskon > 0 ? currentDiskon : null;
      updateData.bookingFee = currentBookingFee > 0 ? currentBookingFee : null;

      const updated = await tx.penjualan.update({
        where: { noTransaksi },
        data: updateData,
      });

      if (dp > 0 && currentCaraPembayaran === "KPR") {
        const existingDp = await tx.tagihan.findFirst({
          where: {
            penjualanId: old.id,
            pembayaran: { contains: "Down Payment" },
          },
        });
        if (!existingDp) {
          const dpDueDate = new Date(old.tanggal);
          dpDueDate.setDate(dpDueDate.getDate() + 14);

          await tx.tagihan.create({
            data: {
              noTagihan: `INV-DP-${noTransaksi}`,
              customerId: old.customerId,
              penjualanId: old.id,
              pembayaran: "Down Payment (DP)",
              nominal: dp,
              jatuhTempo: dpDueDate,
              status: "BELUM_BAYAR",
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          entityName: "Penjualan",
          entityId: noTransaksi,
          action: "UPDATE",
          changes: {
            before: old,
            after: updated,
            input_raw: data,
          } as unknown as Prisma.InputJsonValue,
          userId: userId ?? null,
        },
      });

      return updated;
    });

    if (
      data.caraPembayaran &&
      transactionResult &&
      !transactionResult.fileSpr
    ) {
      try {
        const pdfBuffer = await this.generateSprPdfUseCase.execute(
          transactionResult.id,
        );
        const sprUrl = await this.cloudinaryService.uploadFile(
          pdfBuffer,
          "bumantara/spr",
        );

        return await this.db.penjualan.update({
          where: { id: transactionResult.id },
          data: { fileSpr: sprUrl },
        });
      } catch (error) {
        console.error("Gagal auto-generate SPR setelah update skema:", error);
      }
    }

    return transactionResult;
  }
}
