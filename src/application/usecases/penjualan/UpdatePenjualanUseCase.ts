import { Prisma } from "@prisma/client";
import { type PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import type { CreatePenjualanDTO } from "../../../domain/dtos/PenjualanDTO.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSprPdfUseCase } from "./GenerateSprPdfUseCase.js";

interface IBiayaTambahan {
  nama: string;
  nominal: number;
}

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

      if (data.keteranganAngsuran !== undefined) {
        updateData.keteranganAngsuran = data.keteranganAngsuran ?? null;
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

      const existingTambahan = await tx.tagihan.findMany({
        where: {
          penjualanId: old.id,
          noTagihan: { startsWith: "INV-ADD-" },
        },
      });
      const totalTambahanLama = existingTambahan.reduce(
        (sum, t) => sum + Number(t.nominal),
        0,
      );

      const listBiayaTambahan = data.biayaTambahan as
        | IBiayaTambahan[]
        | undefined;
      const totalTambahanBaru = Array.isArray(listBiayaTambahan)
        ? listBiayaTambahan.reduce(
            (sum, b) => sum + (Number(b.nominal) || 0),
            0,
          )
        : 0;

      const totalSemuaBiayaTambahan = totalTambahanLama + totalTambahanBaru;

      const listTambahanKpr = data.biayaTambahanKpr as
        | IBiayaTambahan[]
        | undefined;
      const totalTambahanKpr = Array.isArray(listTambahanKpr)
        ? listTambahanKpr.reduce((sum, b) => sum + (Number(b.nominal) || 0), 0)
        : 0;

      let biayaKpr = 0;
      let plafonKredit = 0;
      let nilaiPengajuanKpr = 0;
      let dp = 0;
      let dpTidakDibayar = 0;
      let hargaJual = 0;

      if (
        currentCaraPembayaran === "CASH_KERAS" ||
        currentCaraPembayaran === "CASH_BERTAHAP"
      ) {
        hargaJual = data.hargaJual ?? currentHargaDasar - currentDiskon;
        if (currentCaraPembayaran === "CASH_BERTAHAP") {
          dp = data.dp ?? 0;
        }
      } else if (currentCaraPembayaran === "KPR") {
        biayaKpr = data.biayaKpr ?? plafonAwal * 0.06;
        plafonKredit = data.plafonKredit ?? plafonAwal + biayaKpr;
        const baseHargaJual = plafonKredit / 0.9;
        hargaJual =
          data.hargaJual ?? baseHargaJual + currentDiskon + totalTambahanKpr;
        nilaiPengajuanKpr =
          data.nilaiPengajuanKpr ??
          plafonKredit - totalSemuaBiayaTambahan + totalTambahanKpr;
        dpTidakDibayar =
          data.dpTidakDibayar ?? baseHargaJual * 0.1 - currentBookingFee;
        nilaiPengajuanKpr =
          data.nilaiPengajuanKpr ??
          plafonKredit - totalSemuaBiayaTambahan + totalTambahanKpr;
        dp = data.dp ?? dpTidakDibayar;
      }

      updateData.hargaDasar = currentHargaDasar;
      updateData.plafonAwal = plafonAwal;
      updateData.biayaKpr = biayaKpr > 0 ? biayaKpr : null;
      updateData.plafonKredit = plafonKredit > 0 ? plafonKredit : null;
      updateData.dpTidakDibayar = dpTidakDibayar > 0 ? dpTidakDibayar : null;
      updateData.nilaiPengajuanKpr =
        nilaiPengajuanKpr > 0 ? nilaiPengajuanKpr : null;
      updateData.dp = dp > 0 ? dp : null;
      updateData.hargaJual = hargaJual;

      updateData.diskonPenjualan = currentDiskon > 0 ? currentDiskon : null;
      updateData.bookingFee = currentBookingFee > 0 ? currentBookingFee : null;

      if (data.biayaTambahanKpr !== undefined) {
        updateData.tambahanKpr = data.biayaTambahanKpr
          ? (data.biayaTambahanKpr as any)
          : Prisma.DbNull;
      }
      if (currentCaraPembayaran === "CASH_BERTAHAP" && data.termin) {
        updateData.termin = data.termin;
      } else {
        updateData.termin = null;
      }

      const updated = await tx.penjualan.update({
        where: { noTransaksi },
        data: updateData,
      });
      if (currentBookingFee > 0) {
        const existingBf = await tx.tagihan.findFirst({
          where: {
            penjualanId: old.id,
            pembayaran: { contains: "Booking" },
          },
        });

        if (!existingBf) {
          await tx.tagihan.create({
            data: {
              noTagihan: `INV-BF-${noTransaksi}`,
              customerId: old.customerId,
              penjualanId: old.id,
              pembayaran: "Booking Fee",
              nominal: currentBookingFee,
              jatuhTempo: new Date(old.tanggal),
              status: "BELUM_BAYAR",
            },
          });
        } else if (Number(existingBf.nominal) !== currentBookingFee) {
          await tx.tagihan.update({
            where: { id: existingBf.id },
            data: { nominal: currentBookingFee },
          });
        }
      }

      if (
        dp > 0 &&
        (currentCaraPembayaran === "KPR" ||
          currentCaraPembayaran === "CASH_BERTAHAP")
      ) {
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
        } else if (Number(existingDp.nominal) !== dp) {
          await tx.tagihan.update({
            where: { id: existingDp.id },
            data: { nominal: dp },
          });
        }
      }

      if (
        currentCaraPembayaran === "CASH_BERTAHAP" &&
        data.termin &&
        data.termin > 0
      ) {
        const sisaPembayaran = Math.max(0, hargaJual - dp - currentBookingFee);
        const cicilanPerBulan = sisaPembayaran / data.termin;

        const existingCicilans = await tx.tagihan.findMany({
          where: {
            penjualanId: old.id,
            pembayaran: { startsWith: "Cicilan Ke-" },
          },
        });

        if (existingCicilans.length === 0 && sisaPembayaran > 0) {
          const baseDate = new Date(old.tanggal);

          for (let i = 1; i <= data.termin; i++) {
            const jatuhTempoCicilan = new Date(baseDate);

            jatuhTempoCicilan.setMonth(jatuhTempoCicilan.getMonth() + i);

            await tx.tagihan.create({
              data: {
                noTagihan: `INV-CCL-${noTransaksi}-${i}`,
                customerId: old.customerId,
                penjualanId: old.id,
                pembayaran: `Cicilan Ke-${i}`,
                nominal: cicilanPerBulan,
                jatuhTempo: jatuhTempoCicilan,
                status: "BELUM_BAYAR",
              },
            });
          }
        } else if (existingCicilans.length === data.termin) {
          for (const cicilan of existingCicilans) {
            if (Number(cicilan.nominal) !== cicilanPerBulan) {
              await tx.tagihan.update({
                where: { id: cicilan.id },
                data: { nominal: cicilanPerBulan },
              });
            }
          }
        }
      }

      if (Array.isArray(listBiayaTambahan) && listBiayaTambahan.length > 0) {
        const dueDate = new Date(old.tanggal);
        dueDate.setDate(dueDate.getDate() + 14);

        for (let i = 0; i < listBiayaTambahan.length; i++) {
          const biaya = listBiayaTambahan[i];
          if (typeof biaya !== "object" || biaya === null) continue;

          const namaBiaya = String(biaya.nama || "");
          const nominalBiaya = Number(biaya.nominal) || 0;

          if (!namaBiaya || nominalBiaya <= 0) continue;

          await tx.tagihan.create({
            data: {
              noTagihan: `INV-ADD-${noTransaksi}-${Date.now().toString().slice(-4)}-${i}-${Math.floor(Math.random() * 1000)}`,
              customerId: old.customerId,
              penjualanId: old.id,
              pembayaran: namaBiaya,
              nominal: nominalBiaya,
              jatuhTempo: dueDate,
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

    const triggerUpdateSpr =
      (data.caraPembayaran !== undefined ||
        data.bank !== undefined ||
        (data.biayaTambahan && data.biayaTambahan.length > 0)) ??
      data.keteranganUpdateSpr !== undefined;

    if (transactionResult && triggerUpdateSpr) {
      try {
        if (transactionResult.fileSpr) {
          await this.db.riwayatSpr.create({
            data: {
              penjualanId: transactionResult.id,
              fileSpr: transactionResult.fileSpr,
              keterangan:
                data.keteranganUpdateSpr ??
                "Update Skema / Bank / Biaya Tambahan",
            },
          });
        }

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
          include: {
            customer: true,
            kavling: { include: { perumahan: true, rekeningTujuan: true } },
            agent: true,
          },
        });
      } catch (error) {
        console.error(
          "Gagal auto-generate SPR setelah update skema atau bank:",
          error,
        );
      }
    }

    return transactionResult;
  }
}
