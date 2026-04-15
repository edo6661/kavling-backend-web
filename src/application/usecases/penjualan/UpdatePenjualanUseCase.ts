import type { Prisma } from "@prisma/client";
import { type PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import type { CreatePenjualanDTO } from "../../../domain/dtos/PenjualanDTO.js";
export class UpdatePenjualanUseCase {
  constructor(private readonly db: PrismaClient) {}
  async execute(
    noTransaksi: string,
    data: Partial<CreatePenjualanDTO>,
    userId?: number,
  ) {
    return await this.db.$transaction(async (tx) => {
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
      let formattedPayment = data.caraPembayaran as string | undefined;
      if (formattedPayment) {
        formattedPayment = formattedPayment.toUpperCase().replace(/\s+/g, "_");
      }
      const updateData: Prisma.PenjualanUpdateInput = {};
      if (formattedPayment !== undefined)
        updateData.caraPembayaran = formattedPayment as any;
      if (data.hargaJual !== undefined) updateData.hargaJual = data.hargaJual;
      if (data.dp !== undefined) updateData.dp = data.dp ?? null;
      if (data.diskonPenjualan !== undefined)
        updateData.diskonPenjualan = data.diskonPenjualan ?? null;
      if (data.hargaPromosi !== undefined)
        updateData.hargaPromosi = data.hargaPromosi ?? null;
      if (data.bank !== undefined) updateData.bank = data.bank ?? null;
      if (data.nilaiPengajuanKpr !== undefined)
        updateData.nilaiPengajuanKpr = data.nilaiPengajuanKpr ?? null;
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
              hargaJual: data.hargaJual ?? newKavling.hargaJual,
            },
          });
          updateData.kavling = { connect: { id: newKavling.id } };
        }
      }
      const updated = await tx.penjualan.update({
        where: { noTransaksi },
        data: updateData,
      });
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
  }
}
