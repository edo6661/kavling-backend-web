import { z } from "zod";
import { emptyAsUndefined } from "./emptySchema.js";
import type { PaymentMethod } from "@prisma/client";
import { PenjualanStatus } from "@prisma/client";
import { offsetPaginationQuerySchema } from "./paginationSchema.js";

export const createPenjualanSchema = {
  body: z.object({
    noIdentitas: z.string().min(16, "NIK minimal 16 karakter"),
    nama: z.string().min(3, "Nama minimal 3 karakter"),
    noTelepon: z.string().min(9, "No Telepon minimal 9 karakter"),
    alamat: z.string().min(5, "Alamat minimal 5 karakter"),
    perusahaan: emptyAsUndefined(z.string().optional()),
    alamatKoresponden: emptyAsUndefined(z.string().optional()),
    perumahan: z.string().min(1, "Perumahan wajib diisi"),
    blok: z.string().min(1, "Blok wajib diisi").max(10, "Blok Max 10 Karakter"),
    nomorUnit: z
      .string()
      .min(1, "Nomor unit wajib diisi")
      .max(10, "No Unit Max 10 Karakter"),
    tipe: z.string().min(1, "Tipe kavling wajib diisi"),
    luasBangunan: z.coerce.number().min(0),
    luasTanah: z.coerce.number().min(0),
    tanggal: z.string().datetime().or(z.string().min(1)),
    hargaDasar: z.coerce.number().min(1, "Harga dasar tidak valid"),
    hargaPromosi: emptyAsUndefined(z.coerce.number().min(0).optional()),
    diskonPenjualan: emptyAsUndefined(z.coerce.number().min(0).optional()),
    dp: emptyAsUndefined(z.coerce.number().min(0).optional()),
    bookingFee: emptyAsUndefined(z.coerce.number().min(0).optional()),
    bank: emptyAsUndefined(z.string().optional()),
    caraPembayaran: emptyAsUndefined(
      z
        .string()
        .transform((val) => {
          const formatted = val.toUpperCase().replace(/\s+/g, "_");
          if (["CASH_KERAS", "CASH_BERTAHAP", "KPR"].includes(formatted)) {
            return formatted as PaymentMethod;
          }
          throw new Error("Cara pembayaran tidak valid");
        })
        .optional(),
    ),
    nilaiPengajuanKpr: emptyAsUndefined(z.coerce.number().min(0).optional()),
    agent: z.string().min(1, "Agent wajib diisi"),
  }),
};
export const getPenjualanPaginatedSchema = {
  query: offsetPaginationQuerySchema.extend({
    status: emptyAsUndefined(z.nativeEnum(PenjualanStatus).optional()),
  }),
};
export const cancelPenjualanSchema = {
  params: z.object({
    id: z.string().min(1, "No Transaksi wajib diisi"),
  }),
  body: z.object({
    alasanBatal: z.string().min(5, "Alasan pembatalan minimal 5 karakter"),
  }),
};
export const uploadBuktiPenjualanSchema = {
  params: z.object({
    id: z.string().min(1, "No Transaksi wajib diisi"),
    type: z.string().min(1, "Type wajib diisi"),
  }),
  body: z.object({
    alasanBatal: z.string().min(5, "Alasan pembatalan minimal 5 karakter"),
  }),
};
export const uploadSignatureSchema = {
  params: z.object({
    id: z.string().min(1, "No Transaksi wajib diisi"),
  }),
  body: z.object({
    signatureBase64: z.string().min(1, "Data signature wajib diisi"),
    nama: z.string().min(1, "Nama wajib diisi"),
    peran: z.string().min(1, "Peran wajib diisi"),
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
  }),
};
export const biayaTambahanSchema = z.object({
  nama: z.string().min(1, "Nama biaya wajib diisi"),
  nominal: z.coerce.number().min(0, "Nominal tidak boleh negatif"),
});
export const updatePenjualanSchema = {
  params: z.object({
    id: z.string().min(1, "No Transaksi wajib diisi"),
  }),
  body: z
    .object({
      nama: emptyAsUndefined(z.string().min(3).optional()),
      noIdentitas: emptyAsUndefined(z.string().min(16).optional()),
      noTelepon: emptyAsUndefined(z.string().optional()),
      alamat: emptyAsUndefined(z.string().optional()),
      perusahaan: emptyAsUndefined(z.string().optional()),
      alamatKoresponden: emptyAsUndefined(z.string().optional()),
      caraPembayaran: emptyAsUndefined(z.string().optional()),
      termin: emptyAsUndefined(z.coerce.number().int().min(1).optional()),
      bank: emptyAsUndefined(z.string().optional()),

      // TAMBAHAN: Diizinkan menerima input manual untuk kalkulasi
      plafonAwal: emptyAsUndefined(z.coerce.number().optional()),
      plafonKredit: emptyAsUndefined(z.coerce.number().optional()),
      dpTidakDibayar: emptyAsUndefined(z.coerce.number().optional()),
      cicilanPerBulan: emptyAsUndefined(z.coerce.number().optional()),
      biayaKpr: emptyAsUndefined(z.coerce.number().optional()),
      nilaiPengajuanKpr: emptyAsUndefined(z.coerce.number().optional()),
      dp: emptyAsUndefined(z.coerce.number().optional()),
      bookingFee: emptyAsUndefined(z.coerce.number().optional()),
      diskonPenjualan: emptyAsUndefined(z.coerce.number().optional()),
      hargaPromosi: emptyAsUndefined(z.coerce.number().optional()),
      agent: emptyAsUndefined(z.string().optional()),
      blok: emptyAsUndefined(z.string().optional()),
      nomorUnit: emptyAsUndefined(z.string().optional()),
      tipe: emptyAsUndefined(z.string().optional()),
      luasBangunan: emptyAsUndefined(z.coerce.number().optional()),
      luasTanah: emptyAsUndefined(z.coerce.number().optional()),
      hargaJual: emptyAsUndefined(z.coerce.number().optional()),
      biayaTambahan: emptyAsUndefined(z.array(biayaTambahanSchema).optional()),
      biayaTambahanKpr: emptyAsUndefined(
        z.array(biayaTambahanSchema).optional(),
      ),
      keteranganUpdateSpr: emptyAsUndefined(z.string().optional()),
      keteranganAngsuran: emptyAsUndefined(z.string().optional()),
    })
    .partial(),
};

export const gantiKavlingSchema = {
  params: z.object({
    id: z.string().min(1, "No Transaksi wajib diisi"),
  }),
  body: z.object({
    kavlingBaruId: z.coerce.number().positive("Kavling baru wajib dipilih"),
    alasan: z.string().min(5, "Alasan ganti kavling minimal 5 karakter"),
  }),
};

export const approveSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    isApproved: z.boolean({
      error: "Status persetujuan (isApproved) wajib diisi boolean",
    }),
  }),
};
